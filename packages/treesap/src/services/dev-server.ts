import process from "node:process";
import { spawn, type ChildProcess } from "node:child_process";

export interface DevServerStatus {
  running: boolean;
  pid?: number;
  startTime?: Date;
  port?: number;
  command?: string;
  logs: string[];
  errors: string[];
}

export class DevServerManager {
  private childProcess: ChildProcess | null = null;
  private status: DevServerStatus;
  private logBuffer: string[] = [];
  private errorBuffer: string[] = [];
  private maxBufferSize = 1000;

  constructor(private command: string, private port?: number) {
    this.status = {
      running: false,
      command: command,
      port: port,
      logs: [],
      errors: []
    };
  }

  async start(): Promise<void> {
    if (this.childProcess) {
      console.log("Dev server is already running");
      return;
    }

    try {
      console.log(`🚀 Starting dev server: ${this.command}`);
      
      // Split command into parts for spawn
      const commandParts = this.command.split(' ');
      const cmd = commandParts[0];
      const args = commandParts.slice(1);

      this.childProcess = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
        shell: process.platform === 'win32'
      });

      this.status.running = true;
      this.status.pid = this.childProcess.pid;
      this.status.startTime = new Date();

      // Handle stdout
      if (this.childProcess.stdout) {
        this.childProcess.stdout.on('data', (data) => {
          const output = data.toString();
          this.addLog(output);
        });
      }

      // Handle stderr
      if (this.childProcess.stderr) {
        this.childProcess.stderr.on('data', (data) => {
          const output = data.toString();
          this.addError(output);
        });
      }

      // Handle process exit
      this.childProcess.on('exit', (code) => {
        console.log(`Dev server exited with code ${code}`);
        this.status.running = false;
        this.status.pid = undefined;
        this.childProcess = null;
      });

      this.childProcess.on('error', (error) => {
        console.error("Dev server error:", error);
        this.status.running = false;
        this.status.pid = undefined;
        this.childProcess = null;
      });

    } catch (error) {
      console.error("Failed to start dev server:", error);
      this.status.running = false;
      this.addError(`Failed to start: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.childProcess) {
      console.log("Dev server is not running");
      return;
    }

    try {
      this.childProcess.kill("SIGTERM");
      
      // Wait for process to exit with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (this.childProcess) {
            this.childProcess.kill("SIGKILL");
          }
          reject(new Error("Process did not exit gracefully"));
        }, 5000);
        
        this.childProcess!.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      
      this.childProcess = null;
      this.status.running = false;
      this.status.pid = undefined;
      
    } catch (error) {
      console.error("Failed to stop dev server:", error);
      this.addError(`Failed to stop: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async restart(): Promise<void> {
    console.log("🔄 Restarting dev server...");
    await this.stop();
    // Small delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  getStatus(): DevServerStatus {
    return {
      ...this.status,
      logs: [...this.logBuffer],
      errors: [...this.errorBuffer]
    };
  }

  getLogs(_since?: Date): string[] {
    // For now, return all logs. In future, could filter by timestamp
    return [...this.logBuffer];
  }

  sendCommand(command: string): boolean {
    if (!this.childProcess || !this.childProcess.stdin) {
      return false;
    }
    
    try {
      this.childProcess.stdin.write(command + '\n');
      return true;
    } catch (error) {
      console.error('Failed to send command to subprocess:', error);
      return false;
    }
  }


  private addLog(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

  }

  private addError(message: string): void {
    const timestamp = new Date().toISOString();
    const errorEntry = `[${timestamp}] ${message}`;
    
    this.errorBuffer.push(errorEntry);
    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer.shift();
    }

  }

  // Cleanup on process exit
  setupGracefulShutdown(): void {
    const cleanup = async () => {
      if (this.childProcess) {
        await this.stop();
      }
      process.exit(0);
    };

    // Handle Ctrl+C (SIGINT)
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      // Forward signal to child process if it exists
      if (this.childProcess && this.childProcess.pid) {
        try {
          this.childProcess.kill('SIGINT');
        } catch {
          // Silently handle signal forwarding errors
        }
      }
      cleanup().catch(() => {});
    });

    // Handle termination signal
    process.on('SIGTERM', () => {
      console.log('\n🛑 Terminating...');
      // Forward signal to child process if it exists
      if (this.childProcess && this.childProcess.pid) {
        try {
          this.childProcess.kill('SIGTERM');
        } catch {
          // Silently handle signal forwarding errors
        }
      }
      cleanup().catch(() => {});
    });

    // Handle process exit (synchronous cleanup only)
    process.on('exit', () => {
      if (this.childProcess) {
        try {
          this.childProcess.kill('SIGTERM');
        } catch {
          // Silently handle cleanup errors during exit
        }
      }
    });
  }
}