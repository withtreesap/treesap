# Treesap

**AI Agent Framework for Distributed Development Teams**

Treesap is a revolutionary development platform that enables multiple AI agents and human developers to collaborate in real-time through persistent terminal sessions and WebSocket-based coordination. Built for the future of software development where AI agents work alongside humans in coordinated teams.

## 🌟 Key Features

- **Multi-Agent Terminal Orchestration** - Multiple AI agents can work simultaneously across different terminal sessions
- **Real-Time Cross-Session Monitoring** - External agents can observe and control multiple terminal sessions
- **Mobile-Responsive Terminal Interface** - Chat-style input for better mobile development experience
- **WebSocket-Based Architecture** - Real-time bidirectional communication between terminals, web UI, and external agents
- **Framework Agnostic** - Works with any development stack (Hono, Vite, React, etc.)
- **Persistent Terminal Sessions** - Sessions survive across browser refreshes and disconnections
- **Live Preview Integration** - Built-in development server with live reload

## 🚀 Quick Start

### Installation

```bash
npm install treesap
```

### Basic Setup

1. Create a `treesap.config.ts` file in your project root:

```typescript
import type { TreesapConfig } from 'treesap';

const config: TreesapConfig = {
  port: 1235,              // Treesap server port
  previewPort: 5173,       // Your app's dev server port
  devCommand: "npm run dev", // Command to start your dev server
  devPort: 5173,           // Port your dev server runs on
  projectRoot: process.cwd()
};

export default config;
```

2. Add scripts to your `package.json`:

```json
{
  "scripts": {
    "dev:treesap": "treesap dev",
    "treesap": "treesap start"
  }
}
```

3. Start Treesap:

```bash
npm run dev:treesap
```

Visit `http://localhost:1235` to access the Treesap interface with integrated terminal and live preview.

## 🏗️ Core Concepts

### Terminal Sessions
Each terminal session is persistent and can be shared across multiple clients (browsers, agents, etc.). Sessions survive disconnections and can be resumed at any time.

### WebSocket Communication
All terminal I/O, resize events, and cross-session communication happens over WebSockets, enabling real-time collaboration between humans and AI agents.

### Agent Coordination
External AI agents can:
- Monitor multiple terminal sessions simultaneously
- Send commands to specific terminals
- Receive real-time output from all monitored sessions
- Coordinate complex multi-step tasks across multiple environments

## 📱 Mobile-First Design

Treesap features a responsive terminal interface with:
- **Chat-style input** - Familiar textarea interface for mobile users
- **Two-step command execution** - Send to input field, then execute
- **Automatic terminal resizing** - Adapts to mobile screen sizes and orientation changes
- **Touch-optimized controls** - Better interaction on mobile devices

## ⚙️ Configuration

The `TreesapConfig` interface supports these options:

```typescript
interface TreesapConfig {
  port?: number;           // Treesap server port (default: 1235)
  previewPort?: number;    // Preview iframe port (default: 3000)
  devCommand?: string;     // Command to auto-start dev server
  devPort?: number;        // Dev server port to auto-start
  projectRoot?: string;    // Project root directory
}
```

## 🧠 Multi-Agent Development

Treesap enables unprecedented AI agent collaboration:

### Agent Orchestration
- **Supervisor Agents** - Monitor multiple coding agents across different terminals
- **Specialized Agents** - Each agent can work in its dedicated terminal session
- **Cross-Agent Communication** - Agents can coordinate through the WebSocket infrastructure

### Human-AI Collaboration
- **Seamless Handoffs** - Switch between human and AI control of terminal sessions
- **Real-time Monitoring** - Watch AI agents work while maintaining override capability
- **Collaborative Debugging** - Multiple agents can work on the same problem simultaneously

## 🛠️ Architecture

### WebSocket Terminal Service
- Persistent terminal sessions using `node-pty`
- Multi-client session sharing
- Cross-session monitoring and control
- Real-time input/output streaming

### Sapling Islands Components
- Reactive terminal interface
- Live preview integration
- Mobile-responsive design
- Chat-style input system

### External Agent Integration
```typescript
// Connect to WebSocket for monitoring
const ws = new WebSocket('ws://localhost:1235/terminal/ws');

// Join a terminal session
ws.send(JSON.stringify({
  type: 'join',
  sessionId: 'terminal-1',
  terminalId: 'terminal-1'
}));

// Send commands
ws.send(JSON.stringify({
  type: 'input',
  sessionId: 'terminal-1',
  data: 'npm test\r'
}));
```

## 🎯 Use Cases

### AI Development Teams
- Multiple AI agents working on different parts of a large codebase
- Coordinated testing and deployment across multiple environments
- Real-time code review and collaboration between AI agents

### Educational Platforms
- Instructors monitoring multiple student coding sessions
- AI tutors providing real-time assistance
- Collaborative coding exercises with mixed human-AI teams

### DevOps Orchestration
- Coordinated deployments across multiple servers
- Real-time monitoring and intervention capabilities
- Automated testing with human oversight

## 📚 API Reference

### WebSocket Message Types
- `join` - Join a terminal session
- `leave` - Leave a terminal session  
- `input` - Send input to terminal
- `resize` - Resize terminal dimensions
- `ping/pong` - Connection health checks

### Terminal Service Methods
- `getActiveSessions()` - List all active sessions
- `sendCommandToSession(sessionId, command)` - Send command to session
- `getSessionClients(sessionId)` - Get connected clients
- `closeSession(sessionId)` - Terminate a session

## 🔧 Development

### Prerequisites
- Node.js >=18.0.0
- TypeScript support

### Building from Source
```bash
git clone https://github.com/withtreesap/treesap.git
cd treesap/packages/treesap
npm install
npm run build
```

### Development Scripts
```bash
npm run dev        # Start with hot reload
npm run dev:css    # Watch CSS changes
npm run build      # Build for production
npm run clean      # Clean build artifacts
```

## 🤝 Contributing

We welcome contributions! Treesap is building the foundation for the future of AI-powered development.

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/withtreesap/treesap)
- [Issues & Bug Reports](https://github.com/withtreesap/treesap/issues)
- [NPM Package](https://www.npmjs.com/package/treesap)

---

**Treesap** - *Growing the future of collaborative development* 🌳