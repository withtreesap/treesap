/**
 * Treesap Sandbox
 *
 * A secure sandboxed terminal server with WebSocket support for remote code execution.
 * This package provides a terminal endpoint server that exposes access to the underlying
 * file system through HTTP/WebSocket APIs.
 *
 * @example
 * ```typescript
 * import { startSandboxServer } from '@treesap/sandbox';
 *
 * // Start the sandbox server
 * const server = await startSandboxServer({
 *   port: 3000,
 *   projectRoot: process.cwd()
 * });
 * ```
 *
 * @example Using the terminal services directly
 * ```typescript
 * import { TerminalService, WebSocketTerminalService } from '@treesap/sandbox';
 *
 * // Create a terminal session
 * const session = TerminalService.createSession('my-session-id', {
 *   cwd: '/path/to/working/dir',
 *   cols: 80,
 *   rows: 24
 * });
 *
 * // Execute a command
 * TerminalService.executeCommand('my-session-id', 'ls -la');
 *
 * // Listen for output
 * session.eventEmitter.on('output', (data) => {
 *   console.log('Terminal output:', data);
 * });
 * ```
 *
 * @packageDocumentation
 */

// Export server functionality
export { startSandboxServer } from './server.js';
export type { SandboxConfig } from './server.js';

// Export terminal service
export { TerminalService } from './terminal.js';
export type {
  TerminalSession,
  PersistedSessionData
} from './terminal.js';

// Export WebSocket service
export { WebSocketTerminalService } from './websocket.js';
export type {
  WebSocketClient,
  WebSocketMessage
} from './websocket.js';
