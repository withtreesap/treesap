# @treesap/sandbox

A secure sandboxed terminal server with WebSocket support for remote code execution. This package provides a terminal endpoint server that exposes access to the underlying file system through HTTP/WebSocket APIs.

## Features

- 🔒 **Sandboxed Terminal Execution** - Secure terminal sessions with PTY support
- 🔌 **WebSocket Support** - Real-time bidirectional communication
- 📡 **REST API** - HTTP endpoints for terminal management
- 🔄 **Session Management** - Automatic session cleanup and persistence
- 📊 **Multi-client Support** - Multiple clients can connect to the same terminal session
- ⏱️ **Session Timeout** - Automatic cleanup of inactive sessions (30 min default)

## Installation

```bash
npm install @treesap/sandbox
```

## Quick Start

### Starting the Server

```typescript
import { startSandboxServer } from '@treesap/sandbox';

// Start the sandbox server
const server = await startSandboxServer({
  port: 3000,
  projectRoot: process.cwd()
});
```

### Using the REST API

```bash
# List all terminal sessions
curl http://localhost:3000/api/terminal/sessions

# Send a command to a session
curl -X POST http://localhost:3000/api/terminal/sessions/my-session/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ls -la"}'

# Get session status
curl http://localhost:3000/api/terminal/sessions/my-session/status

# Delete a session
curl -X DELETE http://localhost:3000/terminal/session/my-session
```

### WebSocket Client Example

```typescript
import { WebSocket } from 'ws';

const ws = new WebSocket('ws://localhost:3000/terminal/ws');

ws.on('open', () => {
  // Join a terminal session
  ws.send(JSON.stringify({
    type: 'join',
    sessionId: 'my-session',
    terminalId: 'client-1'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());

  if (message.type === 'output') {
    console.log('Terminal output:', message.content);
  } else if (message.type === 'connected') {
    console.log('Connected to session:', message.sessionId);

    // Send a command
    ws.send(JSON.stringify({
      type: 'input',
      sessionId: 'my-session',
      data: 'echo "Hello, World!"\n'
    }));
  }
});
```

## API Reference

### Server Configuration

```typescript
interface SandboxConfig {
  port?: number;         // Server port (default: 3000)
  projectRoot?: string;  // Working directory (default: process.cwd())
}
```

### REST API Endpoints

#### `GET /`
Health check endpoint - returns server status and available endpoints.

#### `GET /api/terminal/sessions`
List all active terminal sessions with their status.

**Response:**
```json
{
  "sessions": [
    {
      "id": "my-session",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastActivity": "2024-01-01T00:05:00.000Z",
      "connectedClients": 2
    }
  ],
  "totalConnectedClients": 2
}
```

#### `GET /api/terminal/sessions/:sessionId/status`
Get detailed status of a specific terminal session.

#### `POST /api/terminal/sessions/:sessionId/command`
Send a command to a terminal session (creates session if it doesn't exist).

**Request:**
```json
{
  "command": "ls -la"
}
```

#### `POST /terminal/execute/:sessionId`
Execute a command in a terminal session.

#### `POST /terminal/input/:sessionId`
Send raw input to a terminal session.

#### `GET /terminal/stream/:sessionId`
SSE (Server-Sent Events) endpoint for streaming terminal output.

#### `DELETE /terminal/session/:sessionId`
Destroy a terminal session.

### WebSocket Protocol

The WebSocket server is available at `ws://localhost:3000/terminal/ws`.

#### Message Types

**Client → Server:**

- `join` - Join a terminal session
  ```json
  {
    "type": "join",
    "sessionId": "my-session",
    "terminalId": "client-1"
  }
  ```

- `leave` - Leave a terminal session
  ```json
  {
    "type": "leave",
    "sessionId": "my-session"
  }
  ```

- `input` - Send input to terminal
  ```json
  {
    "type": "input",
    "sessionId": "my-session",
    "data": "ls -la\n"
  }
  ```

- `resize` - Resize terminal
  ```json
  {
    "type": "resize",
    "sessionId": "my-session",
    "cols": 80,
    "rows": 24
  }
  ```

- `ping` - Ping the server
  ```json
  {
    "type": "ping",
    "timestamp": 1234567890
  }
  ```

**Server → Client:**

- `connected` - Connection confirmed
- `output` - Terminal output
- `exit` - Process exited
- `error` - Error occurred
- `clients_count` - Number of connected clients
- `pong` - Response to ping
- `session_closed` - Session was closed

## Advanced Usage

### Using Terminal Service Directly

```typescript
import { TerminalService } from '@treesap/sandbox';

// Create a terminal session
const session = TerminalService.createSession('my-session', {
  cwd: '/path/to/working/dir',
  cols: 80,
  rows: 24
});

// Execute a command
TerminalService.executeCommand('my-session', 'ls -la');

// Listen for output
session.eventEmitter.on('output', (data) => {
  if (data.type === 'output') {
    console.log('Output:', data.content);
  } else if (data.type === 'exit') {
    console.log('Process exited with code:', data.code);
  }
});

// Clean up when done
TerminalService.destroySession('my-session');
```

### Custom WebSocket Integration

```typescript
import { WebSocketTerminalService, TerminalService } from '@treesap/sandbox';
import { createServer } from 'http';

const server = createServer();

// Initialize WebSocket service with your HTTP server
WebSocketTerminalService.initialize(server);

// Set up terminal service cleanup
TerminalService.setupGlobalCleanup();

server.listen(3000);
```

## Examples

Check out the `examples/` directory for complete working examples:

- **basic-usage.ts** - Simple server setup with API examples
- **websocket-client.html** - Web-based terminal client

To run the basic example:

```bash
cd packages/treesap-sandbox

# Option 1: Run with tsx (development)
npm run example:dev

# Option 2: Build and run
npm run example
```

Then open `examples/websocket-client.html` in your browser to interact with the terminal via WebSocket.

## Security Considerations

⚠️ **Important Security Notes:**

1. **Sandbox Isolation**: This package provides terminal access to the underlying file system. Deploy behind proper authentication and authorization.

2. **Network Access**: By default, the server binds to all network interfaces. Consider using a reverse proxy or firewall for production deployments.

3. **Command Execution**: Any command sent to the terminal will be executed with the permissions of the process running the server.

4. **Session Management**: Sessions are automatically cleaned up after 30 minutes of inactivity, but you should implement your own session validation.

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run in development mode
npm run dev

# Clean build artifacts
npm run clean
```

## License

MIT

## Contributing

Contributions are welcome! Please check out the [main Treesap repository](https://github.com/withtreesap/treesap) for guidelines.

## Related Packages

- [treesap](https://www.npmjs.com/package/treesap) - The main Treesap framework
