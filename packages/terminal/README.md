# @treesap/terminal

Web-based terminal interface for remote sandboxes using node-pty, WebSockets, and xterm.js.

> ⚠️ **Warning**: This package is experimental and exposes a terminal to the local network. Anyone on your network can execute commands on your machine. No authentication is included. Proceed with caution.

## Features

- 🖥️ **Full PTY Support**: Real terminal emulation using node-pty
- 🌐 **Web Interface**: Beautiful xterm.js-based terminal in your browser
- ⚡ **Real-time Communication**: WebSocket for bidirectional terminal I/O
- 🔌 **REST API**: Programmatic control of terminal sessions
- 📦 **Sandbox Integration**: Seamlessly integrates with @treesap/sandbox
- 🎨 **VS Code Theme**: Familiar dark theme with full ANSI color support
- 🔄 **Multiple Sessions**: Support for concurrent terminal sessions
- 📏 **Auto-resize**: Terminals automatically resize with browser window

## Installation

```bash
npm install @treesap/terminal
```

## Quick Start

### Start the Server

```typescript
import { startTerminalServer } from '@treesap/terminal';

const server = await startTerminalServer({
  port: 4000,
  host: 'localhost'
});

// Open http://localhost:4000/terminal in your browser
```

Or run directly:

```bash
npm run dev
# or
tsx src/server.ts
```

### Access the Terminal

Open your browser to:
- **Terminal UI**: http://localhost:4000/terminal
- **API Docs**: http://localhost:4000/
- **WebSocket**: ws://localhost:4000/terminal/ws

## Usage

### Programmatic Usage

#### Create and Manage Sessions

```typescript
import { TerminalManager } from '@treesap/terminal';

const manager = new TerminalManager(100); // max 100 sessions

// Create a session
const session = manager.createSession({
  cwd: '/path/to/working/directory',
  shell: '/bin/bash',
  cols: 80,
  rows: 24,
  env: {
    MY_VAR: 'value'
  }
});

console.log(`Session ID: ${session.id}`);
console.log(`Process ID: ${session.pid}`);

// Listen to output
session.on('output', (data) => {
  console.log('Terminal output:', data);
});

// Listen to exit
session.on('exit', (code) => {
  console.log('Session exited with code:', code);
});

// Send input
session.write('ls -la\n');

// Resize terminal
session.resize(120, 30);

// Kill session
session.kill();
```

#### List and Monitor Sessions

```typescript
// Get all sessions
const sessions = manager.listSessions();

// Get a specific session
const session = manager.getSession('session-id');

// Check if session exists
const exists = manager.hasSession('session-id');

// Get active session count
const count = manager.getActiveSessionCount();

// Destroy a session
manager.destroySession('session-id');

// Destroy all sessions
manager.destroyAllSessions();
```

### REST API

#### Endpoints

**List all sessions**
```bash
GET /api/terminal/sessions
```

Response:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "pid": 12345,
      "status": "active",
      "created": 1234567890,
      "cols": 80,
      "rows": 24
    }
  ]
}
```

**Create a new session**
```bash
POST /api/terminal/sessions
Content-Type: application/json

{
  "sessionId": "optional-custom-id",
  "shell": "/bin/bash",
  "cwd": "/home/user",
  "env": { "KEY": "value" },
  "cols": 80,
  "rows": 24,
  "sandboxId": "optional-sandbox-id"
}
```

**Get session status**
```bash
GET /api/terminal/sessions/:id
```

**Send command (alternative to WebSocket)**
```bash
POST /api/terminal/sessions/:id/command
Content-Type: application/json

{
  "command": "ls -la"
}
```

**Resize terminal**
```bash
POST /api/terminal/sessions/:id/resize
Content-Type: application/json

{
  "cols": 120,
  "rows": 30
}
```

**Kill session**
```bash
DELETE /api/terminal/sessions/:id
```

### WebSocket Protocol

#### Connect to WebSocket

```javascript
const ws = new WebSocket('ws://localhost:4000/terminal/ws');
```

#### Client → Server Messages

**Join a session**
```json
{
  "type": "join",
  "sessionId": "session-uuid",
  "terminalId": "client-identifier",
  "cols": 80,
  "rows": 24
}
```

**Send input**
```json
{
  "type": "input",
  "sessionId": "session-uuid",
  "data": "ls -la\n"
}
```

**Resize terminal**
```json
{
  "type": "resize",
  "sessionId": "session-uuid",
  "cols": 120,
  "rows": 30
}
```

**Leave session**
```json
{
  "type": "leave",
  "sessionId": "session-uuid"
}
```

**Ping (keepalive)**
```json
{
  "type": "ping"
}
```

#### Server → Client Messages

**Connected to session**
```json
{
  "type": "connected",
  "sessionId": "session-uuid",
  "pid": 12345
}
```

**Terminal output**
```json
{
  "type": "output",
  "sessionId": "session-uuid",
  "content": "terminal output with ANSI codes"
}
```

**Process exited**
```json
{
  "type": "exit",
  "sessionId": "session-uuid",
  "code": 0
}
```

**Error occurred**
```json
{
  "type": "error",
  "message": "error description",
  "sessionId": "session-uuid"
}
```

**Pong response**
```json
{
  "type": "pong"
}
```

## Integration with @treesap/sandbox

The terminal package integrates seamlessly with the sandbox package for hybrid workflows.

### Example: Terminal in Sandbox Directory

```typescript
import { startServer, SandboxClient } from '@treesap/sandbox';
import { startTerminalServer } from '@treesap/terminal';

// Start both servers
const sandboxServer = await startServer({ port: 3000 });
const { manager } = await startTerminalServer({
  port: 4000,
  sandboxUrl: 'http://localhost:3000'
});

// Create a sandbox
const sandbox = await SandboxClient.create('http://localhost:3000');

// Create terminal session in sandbox's working directory
const session = manager.createSession({
  cwd: sandbox.workDir,
  sandboxId: sandbox.id,
  env: {
    SANDBOX_ID: sandbox.id
  }
});

// Now you can use both:
// 1. Interactive terminal at http://localhost:4000/terminal?sessionId=${session.id}
// 2. Programmatic sandbox API (sandbox.exec, sandbox.readFile, etc.)
```

### Hybrid Workflows

```typescript
// Terminal: Create file interactively
session.write('echo "Hello" > file.txt\n');

// API: Read file programmatically
const content = await sandbox.readFile('file.txt');
console.log(content); // "Hello"

// API: Create file programmatically
await sandbox.writeFile('data.json', JSON.stringify({ foo: 'bar' }));

// Terminal: Process file interactively
session.write('cat data.json | jq ".foo"\n');
```

## Configuration

```typescript
interface ServerConfig {
  port?: number;           // Default: 4000
  host?: string;          // Default: 'localhost'
  sandboxUrl?: string;    // Optional: URL to sandbox server
  defaultShell?: string;  // Default: '/bin/bash'
  maxSessions?: number;   // Default: 100
  cors?: boolean;         // Default: true
}
```

## Examples

See the `examples/` directory for complete examples:

- **basic-usage.ts**: Simple terminal server with programmatic session creation
- **with-sandbox.ts**: Integration with @treesap/sandbox for hybrid workflows

Run examples:

```bash
tsx examples/basic-usage.ts
tsx examples/with-sandbox.ts
```

## Architecture

```
┌─────────────────────────────────────┐
│        Browser (xterm.js)           │
│            ↕ WebSocket              │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│         Hono Server                 │
│  ┌──────────────────────────────┐  │
│  │   WebSocket Handler          │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │   Terminal Manager           │  │
│  │  - Creates sessions          │  │
│  │  - Maps IDs to sessions      │  │
│  │  - Cleanup & limits          │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │   Terminal Session           │  │
│  │  - node-pty wrapper          │  │
│  │  - I/O handling              │  │
│  │  - Resize, kill              │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   node-pty (PTY Process)            │
│   - bash/zsh/sh shell               │
│   - True terminal emulation         │
└─────────────────────────────────────┘
               ↓
       (Optional Integration)
┌─────────────────────────────────────┐
│   @treesap/sandbox                  │
│   - File operations                 │
│   - Command execution               │
│   - Process management              │
└─────────────────────────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (with auto-reload)
npm run dev

# Watch mode (rebuild on changes)
npm run watch

# Start built server
npm start
```

## Browser Support

The web interface uses modern browser features and xterm.js. Recommended browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Security Considerations

⚠️ **Important Security Notes**:

1. **Authentication**: This package does NOT include authentication. Always add authentication before exposing to the internet.
2. **Network Access**: By default, binds to `localhost`. Be careful when binding to `0.0.0.0`.
3. **Session Limits**: Configure `maxSessions` to prevent resource exhaustion.
4. **Input Validation**: WebSocket messages are validated, but always run in trusted environments.
5. **Sandbox Integration**: When integrated with sandboxes, terminals respect sandbox working directories but have the same permissions as the Node.js process.

## Use Cases

- 🔧 **Remote Development**: Access development environments from anywhere
- 🧪 **Testing & Debugging**: Interactive debugging in sandboxed environments
- 📊 **DevOps Tools**: Web-based CLI for deployment and management
- 🎓 **Education**: Interactive coding environments for teaching
- 🤝 **Collaboration**: Multiple users can connect to shared sessions
- 🔄 **Hybrid Workflows**: Combine interactive CLI with programmatic APIs

## API Reference

See [TypeScript type definitions](./src/types.ts) for complete API reference.

## License

MIT

## Contributing

Contributions welcome! Please see the main Treesap repository for contributing guidelines.

---

**Treesap Terminal** - Part of the Treesap ecosystem 🌲
