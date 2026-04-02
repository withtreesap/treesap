# 🌳 Treesap Sandbox

A self-hosted sandbox API for isolated code execution and file management. Similar to Cloudflare's Sandbox SDK, but designed for self-hosting on your own infrastructure.

Perfect for AI agents, code execution platforms, and automation tools that need secure, isolated environments.

> ⚠️ **Warning**: This package is experimental and exposes your machine to the local network. It executes arbitrary code with folder-based isolation only (not containerized). Proceed with caution.

## Features

- 🔒 **Folder-based isolation** - Each sandbox gets its own working directory
- 📁 **File Operations API** - Read, write, list, and delete files
- ⚡ **Command Execution** - Run commands with streaming output
- 🔄 **Process Management** - Start, monitor, and kill background processes
- 🌊 **Real-time Streaming** - Server-Sent Events for live output
- 🎯 **Simple REST API** - Easy to integrate with any language
- 📦 **TypeScript SDK** - Full-featured client library included
- 🚀 **Self-hosted** - Run on your own servers, no cloud dependencies

## Installation

```bash
npm install @treesap/sandbox
```

## Quick Start

### Start the Server

```bash
# Using CLI
npx treesap-sandbox --port 3000

# Or programmatically
import { startServer } from '@treesap/sandbox';

await startServer({ port: 3000 });
```

### Use the Client SDK

```typescript
import { SandboxClient } from '@treesap/sandbox';

// Create a new sandbox
const sandbox = await SandboxClient.create('http://localhost:3000');

// Execute commands
const result = await sandbox.exec('npm install');
console.log(result.stdout);

// File operations
await sandbox.writeFile('hello.txt', 'Hello, World!');
const content = await sandbox.readFile('hello.txt');
const files = await sandbox.listFiles();

// Background processes
const server = await sandbox.startProcess('node server.js');
const logs = await sandbox.streamProcessLogs(server.id);

// Cleanup
await sandbox.destroy({ cleanup: true });
```

## API Reference

### Sandbox Management

#### Create a Sandbox

```typescript
POST /sandbox
```

```typescript
const sandbox = await SandboxClient.create('http://localhost:3000', {
  workDir: '/custom/path',  // optional
  timeout: 60000,           // optional, default timeout for commands
});
```

#### Get Sandbox Info

```typescript
GET /sandbox/:id
```

```typescript
const status = await sandbox.getStatus();
console.log(status);
// {
//   id: 'abc123',
//   workDir: '/path/to/sandbox',
//   createdAt: 1234567890,
//   processCount: 2,
//   ...
// }
```

#### List All Sandboxes

```typescript
GET /sandbox
```

#### Destroy a Sandbox

```typescript
DELETE /sandbox/:id?cleanup=true
```

```typescript
await sandbox.destroy({ cleanup: true });
```

### Command Execution

#### Execute Command

```typescript
POST /sandbox/:id/exec
```

```typescript
const result = await sandbox.exec('ls -la', {
  timeout: 5000,
  cwd: '/custom/dir',
  env: { NODE_ENV: 'production' }
});

console.log(result);
// {
//   success: true,
//   stdout: '...',
//   stderr: '...',
//   exitCode: 0
// }
```

#### Stream Command Output

```typescript
GET /sandbox/:id/exec-stream?command=npm%20install
```

```typescript
import { parseSSEStream } from '@treesap/sandbox';

const stream = await sandbox.execStream('npm install');

for await (const event of parseSSEStream(stream)) {
  switch (event.type) {
    case 'stdout':
      console.log('Output:', event.data);
      break;
    case 'stderr':
      console.error('Error:', event.data);
      break;
    case 'complete':
      console.log('Exit code:', event.exitCode);
      break;
  }
}
```

### Process Management

#### Start a Background Process

```typescript
POST /sandbox/:id/process
```

```typescript
const process = await sandbox.startProcess('python -m http.server 8000');
console.log('Started with PID:', process.pid);
```

#### List Processes

```typescript
GET /sandbox/:id/process
```

```typescript
const processes = await sandbox.listProcesses();
```

#### Get Process Info

```typescript
GET /sandbox/:id/process/:processId
```

```typescript
const info = await sandbox.getProcess(processId);
```

#### Kill a Process

```typescript
DELETE /sandbox/:id/process/:processId?signal=SIGTERM
```

```typescript
await sandbox.killProcess(processId, 'SIGTERM');
```

#### Stream Process Logs

```typescript
GET /sandbox/:id/process/:processId/logs
```

```typescript
const stream = await sandbox.streamProcessLogs(processId);

for await (const event of parseSSEStream(stream)) {
  console.log(`[${event.timestamp}] ${event.data}`);
}
```

### File Operations

#### List Files

```typescript
GET /sandbox/:id/files?path=.&recursive=true&pattern=*.js
```

```typescript
const files = await sandbox.listFiles('.', {
  recursive: true,
  pattern: '*.js',
  includeHidden: false
});

files.forEach(file => {
  console.log(file.name, file.type, file.size);
});
```

#### Read File

```typescript
GET /sandbox/:id/files/path/to/file.txt
```

```typescript
const content = await sandbox.readFile('package.json');
console.log(content);
```

#### Write File

```typescript
POST /sandbox/:id/files/path/to/file.txt
```

```typescript
await sandbox.writeFile('README.md', '# Hello World');
```

#### Delete File

```typescript
DELETE /sandbox/:id/files/path/to/file.txt?recursive=true
```

```typescript
await sandbox.deleteFile('node_modules', { recursive: true });
```

## Use Cases

### AI Agent Code Execution

```typescript
const sandbox = await SandboxClient.create('http://localhost:3000');

// Agent writes code
await sandbox.writeFile('script.py', `
import pandas as pd
print(pd.__version__)
`);

// Agent installs dependencies
await sandbox.exec('pip install pandas');

// Agent runs code
const result = await sandbox.exec('python script.py');
console.log(result.stdout);

// Cleanup
await sandbox.destroy({ cleanup: true });
```

### Running Tests in Isolation

```typescript
const sandbox = await SandboxClient.create('http://localhost:3000');

// Clone repo
await sandbox.exec('git clone https://github.com/user/repo.git');
await sandbox.exec('cd repo && npm install');

// Run tests
const testResult = await sandbox.exec('cd repo && npm test');

console.log('Tests passed:', testResult.success);
```

### Long-Running Services

```typescript
const sandbox = await SandboxClient.create('http://localhost:3000');

// Start a web server
const server = await sandbox.startProcess('node server.js');

// Monitor logs in real-time
const logStream = await sandbox.streamProcessLogs(server.id);

for await (const log of parseSSEStream(logStream)) {
  console.log('[Server]', log.data);

  if (log.data.includes('Server started')) {
    console.log('Server is ready!');
    break;
  }
}

// Later: stop the server
await sandbox.killProcess(server.id);
```

## Server Configuration

### CLI Options

```bash
treesap-sandbox [options]

Options:
  -p, --port <port>            Port to listen on (default: 3000)
  -h, --host <host>            Host to bind to (default: 0.0.0.0)
  -b, --base-path <path>       Base path for sandbox folders (default: ./.sandboxes)
  -m, --max-sandboxes <num>    Maximum number of sandboxes (default: 100)
  --cors                       Enable CORS (default: false)
  --help                       Show this help message
```

### Programmatic Configuration

```typescript
import { startServer } from '@treesap/sandbox';

const { server, manager } = await startServer({
  port: 3000,
  host: '0.0.0.0',
  basePath: './.sandboxes',
  maxSandboxes: 100,
  cors: true,
});

// Access sandbox manager directly
const stats = manager.getStats();
console.log('Active sandboxes:', stats.totalSandboxes);
```

## Architecture

Treesap Sandbox uses a simple, lightweight architecture:

```
┌─────────────────────────────────────┐
│         Client SDK / API            │
│    (HTTP REST + Server-Sent Events) │
└──────────────┬──────────────────────┘
               │
               │ HTTP/REST
               │
┌──────────────▼──────────────────────┐
│         API Server (Hono)           │
│  - Sandbox Management               │
│  - Command Execution                │
│  - Process Management               │
│  - File Operations                  │
└──────────────┬──────────────────────┘
               │
               │
┌──────────────▼──────────────────────┐
│       Sandbox Manager               │
│  - Creates isolated sandboxes       │
│  - Manages lifecycle                │
│  - Auto-cleanup                     │
└──────────────┬──────────────────────┘
               │
               │
┌──────────────▼──────────────────────┐
│     Individual Sandboxes            │
│  - Isolated working directory       │
│  - Process spawning (child_process) │
│  - File operations (fs)             │
└─────────────────────────────────────┘
```

### Security Model

- **Folder-based isolation**: Each sandbox operates in its own directory
- **Path traversal prevention**: File operations are validated to prevent `../` attacks
- **Process limits**: Configurable max processes per sandbox
- **Automatic cleanup**: Idle sandboxes are cleaned up after 30 minutes
- **Resource monitoring**: Optional timeout limits for commands

> ⚠️ **Note**: This is folder-based isolation, not container-based. For production use with untrusted code, consider running the server inside a Docker container or VM for an additional security layer.

## Comparison with Cloudflare Sandbox SDK

| Feature | Treesap Sandbox | Cloudflare Sandbox |
|---------|----------------|-------------------|
| Self-hosted | ✅ Yes | ❌ Cloud only |
| Folder isolation | ✅ Yes | Container-based |
| File operations | ✅ Full API | ✅ Full API |
| Command execution | ✅ Yes | ✅ Yes |
| Process management | ✅ Yes | ✅ Yes |
| Streaming output | ✅ SSE | ✅ SSE |
| Code interpreters | ⚠️ Planned | ✅ Python/JS |
| Public URLs | ❌ No | ✅ Yes |
| Platform | Node.js | Cloudflare Workers |

## Advanced Usage

### Using Core Components Directly

```typescript
import { Sandbox, FileService } from '@treesap/sandbox';

// Create a sandbox directly (without server)
const sandbox = new Sandbox({
  workDir: '/tmp/my-sandbox',
  timeout: 30000,
});

await sandbox.initialize();

// Execute commands
const result = await sandbox.exec('ls -la');

// Use file service
const fileService = new FileService(sandbox.workDir);
await fileService.writeFile('test.txt', 'Hello!');
const files = await fileService.listFiles();

// Cleanup
await sandbox.destroy({ cleanup: true });
```

### Custom Server Integration

```typescript
import { createServer, SandboxManager } from '@treesap/sandbox';
import { serve } from '@hono/node-server';

const { app, manager } = createServer({
  basePath: '/custom/sandboxes',
  maxSandboxes: 50,
});

// Add custom routes
app.get('/custom-endpoint', (c) => {
  const stats = manager.getStats();
  return c.json({ stats });
});

// Start server
serve({ fetch: app.fetch, port: 3000 });
```

## Contributing

Contributions are welcome! Please check out the [GitHub repository](https://github.com/withtreesap/treesap) for more information.

## License

MIT

## Related Projects

- [Cloudflare Sandbox SDK](https://developers.cloudflare.com/sandbox/) - Cloud-based sandbox execution
- [Treesap](https://github.com/withtreesap/treesap) - AI agent framework

---

Built with ❤️ by the Treesap Team
