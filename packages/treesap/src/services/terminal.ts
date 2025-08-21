import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as pty from 'node-pty';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface TerminalSession {
  id: string;
  process: pty.IPty;
  eventEmitter: EventEmitter;
  createdAt: Date;
  lastActivity: Date;
  cwd?: string;
  env?: Record<string, string>;
  cols?: number;
  rows?: number;
}

export interface PersistedSessionData {
  id: string;
  createdAt: string;
  lastActivity: string;
  cwd: string;
  env: Record<string, string>;
  cols: number;
  rows: number;
}

export class TerminalService {
  private static sessions = new Map<string, TerminalSession>();
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly PERSISTENCE_DIR = path.join(os.tmpdir(), '.treesap-terminals');
  private static readonly SESSIONS_FILE = path.join(this.PERSISTENCE_DIR, 'sessions.json');

  static createSession(sessionId: string, options?: { cwd?: string; cols?: number; rows?: number }): TerminalSession {
    // Clean up any existing session with the same ID
    this.destroySession(sessionId);

    const eventEmitter = new EventEmitter();
    // Increase max listeners to handle multiple terminal tabs and connections
    eventEmitter.setMaxListeners(20);
    
    // Use provided options or defaults
    const cwd = options?.cwd || process.cwd();
    const cols = options?.cols || 80;
    const rows = options?.rows || 24;
    const env: Record<string, string> = {};
    
    // Filter out undefined values from process.env
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }
    
    // Create a PTY process for proper terminal behavior
    const ptyProcess = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : process.env.SHELL || '/bin/bash', [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env
    });

    const session: TerminalSession = {
      id: sessionId,
      process: ptyProcess,
      eventEmitter,
      createdAt: new Date(),
      lastActivity: new Date(),
      cwd,
      env,
      cols,
      rows
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
    
    // Persist session data
    this.persistSessionData(session);

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
      
      // Remove from persistent storage
      this.removePersistedSession(sessionId);
      
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
    // Load persisted sessions on startup
    this.loadPersistedSessions();

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

  // Persistence methods
  private static ensurePersistenceDir(): void {
    try {
      if (!fs.existsSync(this.PERSISTENCE_DIR)) {
        fs.mkdirSync(this.PERSISTENCE_DIR, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating persistence directory:', error);
    }
  }

  private static persistSessionData(session: TerminalSession): void {
    try {
      this.ensurePersistenceDir();
      
      const sessionData: PersistedSessionData = {
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
        cwd: session.cwd || process.cwd(),
        env: session.env || (() => {
          const env: Record<string, string> = {};
          for (const [key, value] of Object.entries(process.env)) {
            if (value !== undefined) {
              env[key] = value;
            }
          }
          return env;
        })(),
        cols: session.cols || 80,
        rows: session.rows || 24
      };

      let existingData: PersistedSessionData[] = [];
      if (fs.existsSync(this.SESSIONS_FILE)) {
        const content = fs.readFileSync(this.SESSIONS_FILE, 'utf8');
        if (content.trim()) {
          existingData = JSON.parse(content);
        }
      }

      // Remove existing session data if present
      existingData = existingData.filter(s => s.id !== session.id);
      
      // Add new session data
      existingData.push(sessionData);

      fs.writeFileSync(this.SESSIONS_FILE, JSON.stringify(existingData, null, 2));
    } catch (error) {
      console.error('Error persisting session data:', error);
    }
  }

  private static removePersistedSession(sessionId: string): void {
    try {
      if (!fs.existsSync(this.SESSIONS_FILE)) return;

      const content = fs.readFileSync(this.SESSIONS_FILE, 'utf8');
      if (!content.trim()) return;

      let existingData: PersistedSessionData[] = JSON.parse(content);
      existingData = existingData.filter(s => s.id !== sessionId);

      fs.writeFileSync(this.SESSIONS_FILE, JSON.stringify(existingData, null, 2));
    } catch (error) {
      console.error('Error removing persisted session:', error);
    }
  }

  private static loadPersistedSessions(): void {
    try {
      if (!fs.existsSync(this.SESSIONS_FILE)) return;

      const content = fs.readFileSync(this.SESSIONS_FILE, 'utf8');
      if (!content.trim()) return;

      const persistedSessions: PersistedSessionData[] = JSON.parse(content);
      
      console.log(`Found ${persistedSessions.length} persisted terminal session(s)`);

      for (const sessionData of persistedSessions) {
        // Check if session is not too old
        const lastActivity = new Date(sessionData.lastActivity);
        const timeSinceLastActivity = Date.now() - lastActivity.getTime();
        
        if (timeSinceLastActivity < this.SESSION_TIMEOUT) {
          console.log(`Restoring terminal session: ${sessionData.id}`);
          
          // Create new session with the persisted options
          this.createSession(sessionData.id, {
            cwd: sessionData.cwd,
            cols: sessionData.cols,
            rows: sessionData.rows
          });
        } else {
          console.log(`Skipping expired session: ${sessionData.id}`);
          this.removePersistedSession(sessionData.id);
        }
      }
    } catch (error) {
      console.error('Error loading persisted sessions:', error);
    }
  }

  // Update session activity and persist
  static updateSessionActivity(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.persistSessionData(session);
    }
  }
}