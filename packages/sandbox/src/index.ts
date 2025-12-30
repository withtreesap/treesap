/**
 * TreeSap Sandbox v1.0
 *
 * A self-hosted sandbox API for isolated code execution and file management.
 * Provides a Cloudflare-style API for managing sandboxed environments.
 *
 * @example Server usage
 * ```typescript
 * import { startServer } from '@treesap/sandbox';
 *
 * // Start the sandbox server
 * const { server, manager } = await startServer({
 *   port: 3000,
 *   basePath: './.sandboxes'
 * });
 * ```
 *
 * @example Client SDK usage
 * ```typescript
 * import { SandboxClient } from '@treesap/sandbox';
 *
 * // Create a new sandbox
 * const sandbox = await SandboxClient.create('http://localhost:3000');
 *
 * // Execute commands
 * const result = await sandbox.exec('npm install');
 * console.log(result.stdout);
 *
 * // File operations
 * await sandbox.writeFile('package.json', JSON.stringify(pkg, null, 2));
 * const files = await sandbox.listFiles();
 *
 * // Process management
 * const server = await sandbox.startProcess('node server.js');
 * const logs = await sandbox.streamProcessLogs(server.id);
 *
 * // Cleanup
 * await sandbox.destroy({ cleanup: true });
 * ```
 *
 * @packageDocumentation
 */

// ============================================================================
// Server API
// ============================================================================

export { startServer, createServer } from './api-server.js';
export type { ServerConfig } from './api-server.js';

// ============================================================================
// Client SDK
// ============================================================================

export { SandboxClient, parseSSEStream } from './client.js';
export type { SandboxClientConfig, CreateSandboxResponse } from './client.js';

// ============================================================================
// Core Components
// ============================================================================

export { Sandbox } from './sandbox.js';
export { SandboxManager } from './sandbox-manager.js';
export { FileService } from './file-service.js';
export { StreamService } from './stream-service.js';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  SandboxConfig,
  ProcessInfo,
  ExecOptions,
  ExecuteResponse,
} from './sandbox.js';

export type { SandboxManagerConfig } from './sandbox-manager.js';

export type {
  FileInfo,
  ListFilesOptions,
  ReadFileOptions,
  WriteFileOptions,
} from './file-service.js';

export type { ExecEvent, ExecEventType, LogEvent } from './stream-service.js';

// ============================================================================
// Auth & Middleware
// ============================================================================

export { createAuthMiddleware, parseApiKeysFromEnv } from './auth-middleware.js';
export type { AuthConfig } from './auth-middleware.js';

// ============================================================================
// HTTP Exposure
// ============================================================================

export { HttpExposureService } from './http-exposure-service.js';
export type { HttpExposureConfig, ExposedEndpoint } from './http-exposure-service.js';
