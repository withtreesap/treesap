# Migration Guide: v0.x to v1.0

TreeSap Sandbox v1.0 is a complete redesign that transforms the package from a terminal-centric WebSocket server to a folder-based sandbox API similar to Cloudflare's Sandbox SDK.

## Breaking Changes

### 1. Core API Redesigned

**Before (v0.x):**
```typescript
import { startSandboxServer, TerminalService } from '@treesap/sandbox';

const server = await startSandboxServer({
  port: 3000,
  projectRoot: process.cwd()
});

const session = TerminalService.createSession('my-session');
TerminalService.executeCommand('my-session', 'ls -la');
```

**After (v1.0):**
```typescript
import { startServer, SandboxClient } from '@treesap/sandbox';

// Server
const { server, manager } = await startServer({ port: 3000 });

// Client
const sandbox = await SandboxClient.create('http://localhost:3000');
const result = await sandbox.exec('ls -la');
```

### 2. WebSocket Removed

The WebSocket-based terminal has been removed in favor of:
- REST API for command execution
- Server-Sent Events (SSE) for streaming output
- Simpler integration model

**Migration:**
- Replace WebSocket connections with REST API calls
- Use `execStream()` for real-time output instead of WebSocket messages

### 3. File Operations Now Built-in

File operations are now first-class citizens with dedicated APIs:

```typescript
// Write files
await sandbox.writeFile('test.txt', 'content');

// Read files
const content = await sandbox.readFile('test.txt');

// List files
const files = await sandbox.listFiles('.', { recursive: true });

// Delete files
await sandbox.deleteFile('test.txt');
```

### 4. New Sandbox Model

Instead of persistent terminal sessions, you now create isolated sandbox instances:

```typescript
// Create sandbox
const sandbox = await SandboxClient.create('http://localhost:3000');

// Use it
await sandbox.exec('npm install');

// Destroy when done
await sandbox.destroy({ cleanup: true });
```

### 5. Process Management

Background processes are now explicitly managed:

```typescript
// Start a process
const process = await sandbox.startProcess('node server.js');

// Monitor logs
const stream = await sandbox.streamProcessLogs(process.id);

// Kill process
await sandbox.killProcess(process.id);
```

## What's Removed

- `TerminalService` class - replaced by `Sandbox` class
- `WebSocketTerminalService` - replaced by REST API + SSE
- `node-pty` dependency - replaced by `child_process`
- `ws` WebSocket library - replaced by Server-Sent Events
- Terminal session persistence to disk

## What's New

- `SandboxClient` - TypeScript SDK for interacting with sandboxes
- `FileService` - Dedicated file operations API
- `SandboxManager` - Centralized sandbox lifecycle management
- Folder-based isolation (each sandbox gets its own directory)
- Server-Sent Events for streaming
- Process management API
- Auto-cleanup of idle sandboxes

## Migration Steps

### Step 1: Update Dependency

```bash
npm install @treesap/sandbox@1.0.0
```

### Step 2: Update Server Code

**Before:**
```typescript
import { startSandboxServer } from '@treesap/sandbox';

await startSandboxServer({
  port: 3000,
  projectRoot: '/path'
});
```

**After:**
```typescript
import { startServer } from '@treesap/sandbox';

await startServer({
  port: 3000,
  basePath: '/path/.sandboxes'
});
```

### Step 3: Update Client Code

**Before (WebSocket):**
```typescript
import { WebSocket } from 'ws';

const ws = new WebSocket('ws://localhost:3000/terminal/ws');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'join',
    sessionId: 'my-session'
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'output') {
    console.log(msg.content);
  }
});
```

**After (REST + SDK):**
```typescript
import { SandboxClient } from '@treesap/sandbox';

const sandbox = await SandboxClient.create('http://localhost:3000');

const result = await sandbox.exec('ls -la');
console.log(result.stdout);
```

### Step 4: Update File Operations

**Before (via shell commands):**
```typescript
TerminalService.executeCommand('my-session', 'echo "content" > file.txt');
TerminalService.executeCommand('my-session', 'cat file.txt');
```

**After (dedicated API):**
```typescript
await sandbox.writeFile('file.txt', 'content');
const content = await sandbox.readFile('file.txt');
```

### Step 5: Update Streaming

**Before (WebSocket):**
```typescript
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'output') {
    // Handle output
  }
});
```

**After (SSE):**
```typescript
import { parseSSEStream } from '@treesap/sandbox';

const stream = await sandbox.execStream('npm install');

for await (const event of parseSSEStream(stream)) {
  if (event.type === 'stdout') {
    console.log(event.data);
  }
}
```

## API Mapping

| v0.x | v1.0 |
|------|------|
| `startSandboxServer()` | `startServer()` |
| `TerminalService.createSession()` | `SandboxClient.create()` |
| `TerminalService.executeCommand()` | `sandbox.exec()` |
| WebSocket for output | `sandbox.execStream()` with SSE |
| Session persistence | Automatic sandbox cleanup |
| N/A | `sandbox.writeFile()` |
| N/A | `sandbox.readFile()` |
| N/A | `sandbox.listFiles()` |
| N/A | `sandbox.startProcess()` |

## Benefits of Upgrading

1. **Simpler Integration**: REST API is easier than WebSocket
2. **File Operations**: Built-in file API, no more shell hacks
3. **Better Isolation**: Each sandbox gets its own folder
4. **Process Management**: Explicit background process control
5. **TypeScript SDK**: Full type safety and intellisense
6. **Self-hosted**: No dependency on Cloudflare or other cloud providers
7. **Auto-cleanup**: Idle sandboxes are automatically cleaned up

## Need Help?

If you encounter issues during migration, please:
1. Check the [README](./README.md) for complete API documentation
2. Review the [examples](./examples/) directory
3. Open an issue on [GitHub](https://github.com/withtreesap/treesap/issues)

## Staying on v0.x

If you need to stay on the old version:

```bash
npm install @treesap/sandbox@0.1.0
```

However, v0.x will not receive further updates. We strongly recommend migrating to v1.0.
