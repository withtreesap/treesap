/**
 * Terminal Manager - Manages multiple terminal sessions
 */

import { v4 as uuidv4 } from 'uuid';
import { TerminalSession } from './terminal-session.js';
import { TerminalSessionConfig, TerminalSessionInfo } from './types.js';

export class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private maxSessions: number;

  constructor(maxSessions: number = 100) {
    this.maxSessions = maxSessions;
  }

  /**
   * Create a new terminal session
   * @throws Error if max sessions limit reached
   */
  createSession(config: TerminalSessionConfig = {}): TerminalSession {
    // Check session limit
    if (this.sessions.size >= this.maxSessions) {
      throw new Error(`Maximum number of sessions (${this.maxSessions}) reached`);
    }

    // Generate ID if not provided
    const id = config.id || uuidv4();

    // Check if session with this ID already exists
    if (this.sessions.has(id)) {
      throw new Error(`Session with ID ${id} already exists`);
    }

    // Create session
    const session = new TerminalSession({
      ...config,
      id
    });

    // Auto-cleanup on exit
    session.on('exit', () => {
      // Remove from sessions map after a delay to allow final output to be read
      setTimeout(() => {
        this.sessions.delete(id);
      }, 5000); // Keep session info for 5 seconds after exit
    });

    // Store session
    this.sessions.set(id, session);

    return session;
  }

  /**
   * Get a terminal session by ID
   */
  getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Check if a session exists
   */
  hasSession(id: string): boolean {
    return this.sessions.has(id);
  }

  /**
   * List all terminal sessions
   */
  listSessions(): TerminalSessionInfo[] {
    return Array.from(this.sessions.values()).map(session => session.getInfo());
  }

  /**
   * Get sessions by sandbox ID
   */
  getSessionsBySandbox(sandboxId: string): TerminalSessionInfo[] {
    return this.listSessions().filter(session => session.sandboxId === sandboxId);
  }

  /**
   * Destroy a specific terminal session
   */
  destroySession(id: string): boolean {
    const session = this.sessions.get(id);
    if (session) {
      session.kill();
      this.sessions.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Destroy all terminal sessions
   */
  destroyAllSessions(): void {
    for (const session of this.sessions.values()) {
      session.kill();
    }
    this.sessions.clear();
  }

  /**
   * Get count of active sessions
   */
  getActiveSessionCount(): number {
    return Array.from(this.sessions.values()).filter(s => s.isActive()).length;
  }

  /**
   * Get count of all sessions (including exited but not cleaned up)
   */
  getTotalSessionCount(): number {
    return this.sessions.size;
  }
}
