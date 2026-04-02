/**
 * Type definitions for Treesap Terminal package
 */

/**
 * Configuration for creating a new terminal session
 */
export interface TerminalSessionConfig {
  /** Unique identifier for the session (auto-generated if not provided) */
  id?: string;
  /** Shell to use (default: /bin/bash) */
  shell?: string;
  /** Working directory for the shell */
  cwd?: string;
  /** Environment variables to pass to the shell */
  env?: Record<string, string>;
  /** Terminal columns (default: 80) */
  cols?: number;
  /** Terminal rows (default: 24) */
  rows?: number;
  /** Optional sandbox ID to link this terminal to */
  sandboxId?: string;
}

/**
 * Terminal session information
 */
export interface TerminalSessionInfo {
  /** Session ID */
  id: string;
  /** Process ID of the shell */
  pid: number;
  /** Session status */
  status: 'active' | 'exited';
  /** Timestamp when session was created */
  created: number;
  /** Terminal columns */
  cols: number;
  /** Terminal rows */
  rows: number;
  /** Optional sandbox ID */
  sandboxId?: string;
  /** Exit code if session has exited */
  exitCode?: number;
}

/**
 * WebSocket message types from client to server
 */
export type ClientMessage =
  | JoinMessage
  | InputMessage
  | ResizeMessage
  | LeaveMessage
  | PingMessage;

/**
 * Join a terminal session
 */
export interface JoinMessage {
  type: 'join';
  /** Session ID to join */
  sessionId: string;
  /** Client identifier */
  terminalId: string;
  /** Optional terminal dimensions */
  cols?: number;
  rows?: number;
}

/**
 * Send input to terminal
 */
export interface InputMessage {
  type: 'input';
  /** Session ID */
  sessionId: string;
  /** Input data (keyboard input, including special keys) */
  data: string;
}

/**
 * Resize terminal
 */
export interface ResizeMessage {
  type: 'resize';
  /** Session ID */
  sessionId: string;
  /** New column count */
  cols: number;
  /** New row count */
  rows: number;
}

/**
 * Leave a terminal session
 */
export interface LeaveMessage {
  type: 'leave';
  /** Session ID */
  sessionId: string;
}

/**
 * Ping/keepalive message
 */
export interface PingMessage {
  type: 'ping';
}

/**
 * WebSocket message types from server to client
 */
export type ServerMessage =
  | ConnectedMessage
  | OutputMessage
  | ExitMessage
  | ErrorMessage
  | ClientsCountMessage
  | PongMessage;

/**
 * Successfully connected to session
 */
export interface ConnectedMessage {
  type: 'connected';
  /** Session ID */
  sessionId: string;
  /** Process ID */
  pid: number;
}

/**
 * Terminal output
 */
export interface OutputMessage {
  type: 'output';
  /** Session ID */
  sessionId: string;
  /** Output content (raw terminal output with ANSI codes) */
  content: string;
}

/**
 * Process exited
 */
export interface ExitMessage {
  type: 'exit';
  /** Session ID */
  sessionId: string;
  /** Exit code */
  code: number;
}

/**
 * Error occurred
 */
export interface ErrorMessage {
  type: 'error';
  /** Error message */
  message: string;
  /** Session ID if error is session-specific */
  sessionId?: string;
}

/**
 * Client count update
 */
export interface ClientsCountMessage {
  type: 'clients_count';
  /** Session ID */
  sessionId: string;
  /** Number of connected clients */
  count: number;
}

/**
 * Pong response to ping
 */
export interface PongMessage {
  type: 'pong';
}

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Port to listen on (default: 4000) */
  port?: number;
  /** Host to bind to (default: localhost) */
  host?: string;
  /** Optional URL to sandbox server for integration */
  sandboxUrl?: string;
  /** Default shell to use (default: /bin/bash) */
  defaultShell?: string;
  /** Maximum number of concurrent sessions (default: 100) */
  maxSessions?: number;
  /** Enable CORS (default: true) */
  cors?: boolean;
}

/**
 * API response types
 */
export interface CreateSessionResponse {
  /** Session ID */
  id: string;
  /** Process ID */
  pid: number;
  /** Creation timestamp */
  created: number;
}

export interface SessionStatusResponse extends TerminalSessionInfo {}

export interface SessionListResponse {
  /** List of all active sessions */
  sessions: TerminalSessionInfo[];
}

export interface SuccessResponse {
  /** Success status */
  success: boolean;
  /** Optional message */
  message?: string;
}

export interface HealthResponse {
  /** Service status */
  status: 'ok' | 'error';
  /** Service name */
  service: string;
  /** Version */
  version: string;
  /** Number of active sessions */
  activeSessions?: number;
}
