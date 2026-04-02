/**
 * Treesap Terminal - Web-based terminal interface for remote sandboxes
 *
 * @packageDocumentation
 */

// Core classes
export { TerminalSession } from './terminal-session.js';
export { TerminalManager } from './terminal-manager.js';

// Server
export { startTerminalServer } from './server.js';

// WebSocket utilities
export { setupWebSocket, handleUpgrade } from './websocket-handler.js';

// API routes
export { createApiRoutes } from './routes/api.js';

// Type definitions
export type {
  TerminalSessionConfig,
  TerminalSessionInfo,
  ClientMessage,
  ServerMessage,
  JoinMessage,
  InputMessage,
  ResizeMessage,
  LeaveMessage,
  PingMessage,
  ConnectedMessage,
  OutputMessage,
  ExitMessage,
  ErrorMessage,
  ClientsCountMessage,
  PongMessage,
  ServerConfig,
  CreateSessionResponse,
  SessionStatusResponse,
  SessionListResponse,
  SuccessResponse,
  HealthResponse
} from './types.js';
