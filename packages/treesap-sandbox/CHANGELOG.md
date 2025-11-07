# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-11-06

### 🎉 Major Redesign - Breaking Changes

TreeSap Sandbox has been completely redesigned from a terminal-centric WebSocket server to a folder-based sandbox API similar to Cloudflare's Sandbox SDK.

### Added

- **Sandbox Management API**
  - Create isolated sandbox instances with dedicated working directories
  - List all active sandboxes
  - Get sandbox status and metrics
  - Destroy sandboxes with optional cleanup

- **File Operations API**
  - `readFile()` - Read file contents
  - `writeFile()` - Write/create files
  - `listFiles()` - List directory contents with optional recursion
  - `deleteFile()` - Remove files and directories
  - Path traversal protection
  - Glob pattern filtering

- **Command Execution**
  - `exec()` - Execute commands and return complete results
  - `execStream()` - Stream command output via Server-Sent Events
  - Timeout support
  - Custom working directory and environment variables

- **Process Management**
  - `startProcess()` - Start long-running background processes
  - `listProcesses()` - View all running processes
  - `killProcess()` - Terminate specific processes
  - `killAllProcesses()` - Terminate all processes
  - `streamProcessLogs()` - Real-time log streaming
  - `getProcessLogs()` - Get accumulated logs

- **TypeScript SDK Client**
  - Full-featured client library (`SandboxClient`)
  - Promise-based API with async/await support
  - Type-safe interfaces
  - Streaming support with SSE parsing utilities

- **REST API Server**
  - Built with Hono framework
  - Complete REST endpoints for all operations
  - Server-Sent Events for streaming
  - CORS support
  - Health check endpoints

- **CLI Tool**
  - `treesap-sandbox` command-line interface
  - Configurable port, host, and paths
  - Built-in help

- **Core Components**
  - `Sandbox` class - Individual sandbox instance
  - `SandboxManager` - Multi-sandbox management
  - `FileService` - File operations service
  - `StreamService` - SSE streaming utilities

- **Auto-cleanup**
  - Automatic cleanup of idle sandboxes (30 min default)
  - Configurable cleanup intervals
  - Graceful shutdown handling

- **Documentation**
  - Comprehensive README with examples
  - Migration guide from v0.x
  - API reference
  - Use case examples

### Removed

- `TerminalService` - Replaced by `Sandbox` class
- `WebSocketTerminalService` - Replaced by REST API + SSE
- WebSocket support - Replaced by Server-Sent Events
- `node-pty` dependency - Replaced by `child_process`
- `ws` dependency - No longer needed
- Terminal session persistence to disk

### Changed

- **Package version**: `0.1.0` → `1.0.0`
- **Main export**: `startSandboxServer()` → `startServer()`
- **Communication**: WebSocket → REST API + Server-Sent Events
- **Isolation**: PTY sessions → Folder-based sandboxes
- **Dependencies**: Removed `node-pty` and `ws`, kept `hono` and `@hono/node-server`

### Migration

See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions from v0.x to v1.0.

## [0.1.0] - Previous Version

Initial release with terminal-centric WebSocket server.

### Features

- PTY-based terminal sessions
- WebSocket real-time communication
- REST API for terminal management
- Session persistence
- Multi-client support
