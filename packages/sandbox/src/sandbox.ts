import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface SandboxConfig {
  id?: string;
  workDir?: string;
  env?: Record<string, string>;
  timeout?: number;
  maxProcesses?: number;
}

export interface ProcessInfo {
  id: string;
  pid: number;
  command: string;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  exitCode?: number;
}

export interface ExecOptions {
  stream?: boolean;
  onOutput?: (stream: 'stdout' | 'stderr', data: string) => void;
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
}

export interface ExecuteResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut?: boolean;
}

/**
 * Represents a single isolated sandbox instance
 * Each sandbox has its own working directory and process management
 */
export class Sandbox extends EventEmitter {
  public readonly id: string;
  public readonly workDir: string;
  public readonly createdAt: number;
  private processes: Map<string, ProcessInfo> = new Map();
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private config: SandboxConfig;
  private destroyed: boolean = false;

  constructor(config: SandboxConfig = {}) {
    super();
    this.id = config.id || uuidv4();
    this.workDir = config.workDir || path.join(process.cwd(), '.sandboxes', this.id);
    this.config = { ...config, env: config.env || {} };
    this.createdAt = Date.now();
  }

  /**
   * Initialize the sandbox (create working directory)
   */
  async initialize(): Promise<void> {
    if (this.destroyed) {
      throw new Error('Sandbox has been destroyed');
    }

    // Create working directory
    await fs.mkdir(this.workDir, { recursive: true });

    this.emit('initialized', { id: this.id, workDir: this.workDir });
  }

  /**
   * Execute a command and return the complete result
   */
  async exec(command: string, options: ExecOptions = {}): Promise<ExecuteResponse> {
    if (this.destroyed) {
      throw new Error('Sandbox has been destroyed');
    }

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Parse command and args
      const childProcess = spawn(command, [], {
        cwd: options.cwd || this.workDir,
        env: { ...process.env, ...this.config.env, ...options.env },
        shell: true,
      });

      // Handle timeout
      let timeoutId: NodeJS.Timeout | undefined;
      const timeout = options.timeout || this.config.timeout;
      if (timeout) {
        timeoutId = setTimeout(() => {
          timedOut = true;
          childProcess.kill('SIGTERM');

          // Force kill after 5 seconds
          setTimeout(() => {
            if (!childProcess.killed) {
              childProcess.kill('SIGKILL');
            }
          }, 5000);
        }, timeout);
      }

      // Capture stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;

        if (options.stream && options.onOutput) {
          options.onOutput('stdout', text);
        }

        this.emit('output', { stream: 'stdout', data: text });
      });

      // Capture stderr
      childProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;

        if (options.stream && options.onOutput) {
          options.onOutput('stderr', text);
        }

        this.emit('output', { stream: 'stderr', data: text });
      });

      // Handle process completion
      childProcess.on('close', (exitCode) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const response: ExecuteResponse = {
          success: !timedOut && exitCode === 0,
          stdout,
          stderr,
          exitCode: exitCode || 0,
          timedOut,
        };

        this.emit('exec_complete', response);
        resolve(response);
      });

      childProcess.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const response: ExecuteResponse = {
          success: false,
          stdout,
          stderr: stderr + '\n' + error.message,
          exitCode: 1,
        };

        this.emit('exec_error', error);
        resolve(response);
      });
    });
  }

  /**
   * Start a long-running background process
   */
  async startProcess(command: string, options: ExecOptions = {}): Promise<ProcessInfo> {
    if (this.destroyed) {
      throw new Error('Sandbox has been destroyed');
    }

    // Check max processes limit
    if (this.config.maxProcesses && this.runningProcesses.size >= this.config.maxProcesses) {
      throw new Error(`Maximum process limit reached (${this.config.maxProcesses})`);
    }

    const processId = uuidv4();
      const childProcess = spawn(command, [], {
        cwd: options.cwd || this.workDir,
        env: { ...process.env, ...this.config.env, ...options.env },
        shell: true,
      });

    const processInfo: ProcessInfo = {
      id: processId,
      pid: childProcess.pid!,
      command,
      status: 'running',
      startTime: Date.now(),
    };

    this.processes.set(processId, processInfo);
    this.runningProcesses.set(processId, childProcess);

    // Listen for output
    childProcess.stdout?.on('data', (data: Buffer) => {
      this.emit('process_output', {
        processId,
        stream: 'stdout',
        data: data.toString(),
      });
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      this.emit('process_output', {
        processId,
        stream: 'stderr',
        data: data.toString(),
      });
    });

    // Handle process exit
    childProcess.on('close', (exitCode) => {
      const info = this.processes.get(processId);
      if (info) {
        info.status = exitCode === 0 ? 'completed' : 'failed';
        info.exitCode = exitCode || 0;
      }

      this.runningProcesses.delete(processId);
      this.emit('process_exit', { processId, exitCode });
    });

    this.emit('process_started', processInfo);
    return processInfo;
  }

  /**
   * List all processes (running and completed)
   */
  listProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }

  /**
   * Get information about a specific process
   */
  getProcess(processId: string): ProcessInfo | undefined {
    return this.processes.get(processId);
  }

  /**
   * Kill a specific process
   */
  async killProcess(processId: string, signal: string = 'SIGTERM'): Promise<void> {
    const childProcess = this.runningProcesses.get(processId);
    if (!childProcess) {
      throw new Error(`Process ${processId} not found or already stopped`);
    }

    childProcess.kill(signal as NodeJS.Signals);

    // Update process info
    const info = this.processes.get(processId);
    if (info) {
      info.status = 'failed';
    }
  }

  /**
   * Kill all running processes
   */
  async killAllProcesses(signal: string = 'SIGTERM'): Promise<void> {
    const killPromises = Array.from(this.runningProcesses.keys()).map((processId) =>
      this.killProcess(processId, signal).catch(() => {
        // Ignore errors if process already stopped
      })
    );

    await Promise.all(killPromises);
  }

  /**
   * Get sandbox status
   */
  getStatus() {
    return {
      id: this.id,
      workDir: this.workDir,
      createdAt: this.createdAt,
      uptime: Date.now() - this.createdAt,
      processCount: this.runningProcesses.size,
      totalProcesses: this.processes.size,
      destroyed: this.destroyed,
    };
  }

  // ============================================================================
  // Environment Variable Management
  // ============================================================================

  /**
   * Set a single environment variable
   */
  setEnv(key: string, value: string): void {
    if (this.destroyed) {
      throw new Error('Sandbox has been destroyed');
    }
    this.config.env![key] = value;
    this.emit('env_changed', { key, value, action: 'set' });
  }

  /**
   * Set multiple environment variables at once
   */
  setEnvBatch(variables: Record<string, string>): void {
    if (this.destroyed) {
      throw new Error('Sandbox has been destroyed');
    }
    for (const [key, value] of Object.entries(variables)) {
      this.config.env![key] = value;
    }
    this.emit('env_changed', { variables, action: 'batch_set' });
  }

  /**
   * Get environment variable(s)
   * If key is provided, returns the value for that key
   * Otherwise returns all environment variables
   */
  getEnv(): Record<string, string>;
  getEnv(key: string): string | undefined;
  getEnv(key?: string): Record<string, string> | string | undefined {
    if (key !== undefined) {
      return this.config.env![key];
    }
    return { ...this.config.env };
  }

  /**
   * Get list of environment variable names (for security, not exposing values)
   */
  getEnvKeys(): string[] {
    return Object.keys(this.config.env!);
  }

  /**
   * Unset (remove) an environment variable
   */
  unsetEnv(key: string): boolean {
    if (this.destroyed) {
      throw new Error('Sandbox has been destroyed');
    }
    if (key in this.config.env!) {
      delete this.config.env![key];
      this.emit('env_changed', { key, action: 'unset' });
      return true;
    }
    return false;
  }

  /**
   * Destroy the sandbox (kill all processes, optionally clean up files)
   */
  async destroy(options: { cleanup?: boolean } = {}): Promise<void> {
    if (this.destroyed) {
      return;
    }

    // Kill all running processes
    await this.killAllProcesses('SIGKILL');

    // Clean up files if requested
    if (options.cleanup) {
      try {
        await fs.rm(this.workDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    this.destroyed = true;
    this.emit('destroyed', { id: this.id });
    this.removeAllListeners();
  }


}
