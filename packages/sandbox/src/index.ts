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

export { startServer, createServer } from './api-server';
export type { ServerConfig } from './api-server';

// ============================================================================
// Client SDK
// ============================================================================

export { SandboxClient, parseSSEStream } from './client';
export type { SandboxClientConfig, CreateSandboxResponse } from './client';

// ============================================================================
// Core Components
// ============================================================================

export { Sandbox } from './sandbox';
export { SandboxManager } from './sandbox-manager';
export { FileService } from './file-service';
export { StreamService } from './stream-service';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  SandboxConfig,
  ProcessInfo,
  ExecOptions,
  ExecuteResponse,
} from './sandbox';

export type { SandboxManagerConfig } from './sandbox-manager';

export type {
  FileInfo,
  ListFilesOptions,
  ReadFileOptions,
  WriteFileOptions,
} from './file-service';

export type { ExecEvent, ExecEventType, LogEvent } from './stream-service';
