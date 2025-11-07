/**
 * Terminal Session - Wrapper around node-pty for managing PTY instances
 */

import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import { TerminalSessionConfig, TerminalSessionInfo } from './types.js';

/**
 * Events emitted by TerminalSession:
 * - 'output': (data: string) => void - Terminal output received
 * - 'exit': (code: number) => void - Process exited
 */
export class TerminalSession extends EventEmitter {
  private ptyProcess: pty.IPty;
  public readonly id: string;
  public readonly pid: number;
  public readonly created: number;
  public sandboxId?: string;
  public cols: number;
  public rows: number;
  private status: 'active' | 'exited' = 'active';
  private exitCode?: number;

  constructor(config: Required<Pick<TerminalSessionConfig, 'id'>> & TerminalSessionConfig) {
    super();

    this.id = config.id;
    this.cols = config.cols || 80;
    this.rows = config.rows || 24;
    this.sandboxId = config.sandboxId;
    this.created = Date.now();

    // Determine shell to use
    const shell = config.shell || process.env.SHELL || '/bin/bash';

    // Prepare environment variables
    const envVars = {
      ...process.env,
      ...config.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor'
    };

    // Create PTY process
    this.ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: this.cols,
      rows: this.rows,
      cwd: config.cwd || process.cwd(),
      env: envVars
    });

    this.pid = this.ptyProcess.pid;

    // Listen to PTY output
    this.ptyProcess.onData((data: string) => {
      this.emit('output', data);
    });

    // Listen to PTY exit
    this.ptyProcess.onExit(({ exitCode, signal }) => {
      this.status = 'exited';
      this.exitCode = exitCode;
      this.emit('exit', exitCode);
    });
  }

  /**
   * Write input data to the terminal
   */
  write(data: string): void {
    if (this.status === 'active') {
      this.ptyProcess.write(data);
    }
  }

  /**
   * Resize the terminal
   */
  resize(cols: number, rows: number): void {
    if (this.status === 'active') {
      this.cols = cols;
      this.rows = rows;
      this.ptyProcess.resize(cols, rows);
    }
  }

  /**
   * Kill the terminal process
   */
  kill(signal?: string): void {
    if (this.status === 'active') {
      this.ptyProcess.kill(signal);
    }
  }

  /**
   * Get session information
   */
  getInfo(): TerminalSessionInfo {
    return {
      id: this.id,
      pid: this.pid,
      status: this.status,
      created: this.created,
      cols: this.cols,
      rows: this.rows,
      sandboxId: this.sandboxId,
      exitCode: this.exitCode
    };
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.status === 'active';
  }
}
