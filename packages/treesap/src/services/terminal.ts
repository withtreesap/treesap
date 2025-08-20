import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as pty from 'node-pty';

export interface TerminalSession {
  id: string;
  process: pty.IPty;
  eventEmitter: EventEmitter;
  createdAt: Date;
  lastActivity: Date;
}

export class TerminalService {
  private static sessions = new Map<string, TerminalSession>();
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  static createSession(sessionId: string): TerminalSession {
    // Clean up any existing session with the same ID
    this.destroySession(sessionId);

    const eventEmitter = new EventEmitter();
    // Increase max listeners to handle multiple terminal tabs and connections
    eventEmitter.setMaxListeners(20);
    
    // Create a PTY process for proper terminal behavior
    const ptyProcess = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : process.env.SHELL || '/bin/bash', [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: process.env
    });

    const session: TerminalSession = {
      id: sessionId,
      process: ptyProcess,
      eventEmitter,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    // Handle process output
    ptyProcess.onData((data: string) => {
      session.lastActivity = new Date();
      eventEmitter.emit('output', {
        type: 'output',
        content: data
      });
    });

    ptyProcess.onExit((e: { exitCode: number; signal?: number }) => {
      eventEmitter.emit('output', {
        type: 'exit',
        code: e.exitCode
      });
      this.destroySession(sessionId);
    });

    this.sessions.set(sessionId, session);
    
    // Set up session cleanup
    this.scheduleSessionCleanup(sessionId);

    return session;
  }

  static getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  static executeCommand(sessionId: string, command: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    try {
      session.lastActivity = new Date();
      session.process.write(command + '\n');
      return true;
    } catch (error) {
      console.error(`Error executing command in session ${sessionId}:`, error);
      return false;
    }
  }

  static destroySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      // Clean up the PTY process
      session.process.kill();

      // Remove event listeners
      session.eventEmitter.removeAllListeners();
      
      // Remove from sessions map
      this.sessions.delete(sessionId);
      
      return true;
    } catch (error) {
      console.error(`Error destroying session ${sessionId}:`, error);
      return false;
    }
  }

  static getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  static cleanupExpiredSessions(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceLastActivity > this.SESSION_TIMEOUT) {
        this.destroySession(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  private static scheduleSessionCleanup(sessionId: string): void {
    setTimeout(() => {
      const session = this.getSession(sessionId);
      if (session) {
        const timeSinceLastActivity = new Date().getTime() - session.lastActivity.getTime();
        if (timeSinceLastActivity >= this.SESSION_TIMEOUT) {
          console.log(`Cleaning up expired terminal session: ${sessionId}`);
          this.destroySession(sessionId);
        } else {
          // Reschedule cleanup
          this.scheduleSessionCleanup(sessionId);
        }
      }
    }, this.SESSION_TIMEOUT);
  }

  static setupGlobalCleanup(): void {
    // Cleanup all sessions on process exit
    const cleanup = () => {
      console.log('Cleaning up all terminal sessions...');
      for (const sessionId of this.sessions.keys()) {
        this.destroySession(sessionId);
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);

    // Periodic cleanup of expired sessions
    setInterval(() => {
      const cleaned = this.cleanupExpiredSessions();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired terminal sessions`);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}