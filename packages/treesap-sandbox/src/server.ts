import { Hono, type Context } from "hono";
import { TerminalService } from "./terminal.js";
import { WebSocketTerminalService } from "./websocket.js";
import type { Server } from 'http';
import process from "node:process";

export interface SandboxConfig {
  port?: number;
  projectRoot?: string;
}

export async function startSandboxServer(config: SandboxConfig = {}) {
  const {
    port = 3000,
    projectRoot = process.cwd()
  } = config;

  // Change the current working directory to the project root
  process.chdir(projectRoot);

  const app = new Hono();

  // Health check endpoint
  app.get("/", (c: Context) => {
    return c.json({
      status: "ok",
      message: "Treesap Sandbox Server",
      version: "0.1.0",
      endpoints: {
        terminal_sessions: "/api/terminal/sessions",
        websocket: "ws://localhost:" + port + "/terminal/ws"
      }
    });
  });

  // List active terminal sessions with WebSocket client info
  app.get("/api/terminal/sessions", (c: Context) => {
    const sessions = TerminalService.getAllSessions();
    const wsActiveSessions = WebSocketTerminalService.getActiveSessions();

    return c.json({
      sessions: sessions.map(session => {
        const wsInfo = wsActiveSessions.find(ws => ws.sessionId === session.id);
        return {
          id: session.id,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          connectedClients: wsInfo ? wsInfo.clientCount : 0
        };
      }),
      totalConnectedClients: WebSocketTerminalService.getConnectedClients()
    });
  });

  // Get specific terminal session status
  app.get("/api/terminal/sessions/:sessionId/status", (c: Context) => {
    const sessionId = c.req.param('sessionId');
    const session = TerminalService.getSession(sessionId);

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    const clients = WebSocketTerminalService.getSessionClients(sessionId);

    return c.json({
      id: session.id,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      connectedClients: clients.length,
      clientIds: clients
    });
  });

  // Send command to terminal via API
  app.post("/api/terminal/sessions/:sessionId/command", async (c: Context) => {
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    const { command } = body;

    if (!command) {
      return c.json({ error: "Command is required" }, 400);
    }

    // Get or create terminal session
    let session = TerminalService.getSession(sessionId);
    if (!session) {
      session = TerminalService.createSession(sessionId);
    }

    const success = WebSocketTerminalService.sendCommandToSession(sessionId, command);

    if (success) {
      return c.json({
        success: true,
        message: `Command sent to session ${sessionId}`,
        connectedClients: WebSocketTerminalService.getSessionClients(sessionId).length
      });
    } else {
      return c.json({ error: "Failed to send command to terminal" }, 500);
    }
  });

  // Get recent output from terminal session (for API clients)
  app.get("/api/terminal/sessions/:sessionId/output", async (c: Context) => {
    const sessionId = c.req.param('sessionId');
    const session = TerminalService.getSession(sessionId);

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Note: This is a basic implementation. For production, you'd want to
    // store recent output history in the TerminalService
    return c.json({
      sessionId,
      message: "Output streaming available via WebSocket connection",
      connectedClients: WebSocketTerminalService.getSessionClients(sessionId).length,
      websocketUrl: `ws://${c.req.header('host')}/terminal/ws`
    });
  });

  // Terminal endpoints
  app.post("/terminal/execute/:sessionId", async (c: Context) => {
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    const { command } = body;

    if (!command) {
      return c.json({ error: "Command is required" }, 400);
    }

    // Get or create terminal session
    let session = TerminalService.getSession(sessionId);
    if (!session) {
      session = TerminalService.createSession(sessionId);
    }

    const success = TerminalService.executeCommand(sessionId, command);

    if (success) {
      return c.json({ success: true });
    } else {
      return c.json({ error: "Failed to execute command" }, 500);
    }
  });

  app.post("/terminal/input/:sessionId", async (c: Context) => {
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    const { input } = body;

    if (input === undefined) {
      return c.json({ error: "Input is required" }, 400);
    }

    // Get or create terminal session
    let session = TerminalService.getSession(sessionId);
    if (!session) {
      session = TerminalService.createSession(sessionId);
    }

    // Send input directly to PTY
    try {
      session.lastActivity = new Date();
      session.process.write(input);
      return c.json({ success: true });
    } catch (error) {
      console.error(`Error sending input to session ${sessionId}:`, error);
      return c.json({ error: "Failed to send input" }, 500);
    }
  });

  app.get("/terminal/stream/:sessionId", async (c: Context) => {
    const sessionId = c.req.param('sessionId');

    // Get or create terminal session
    let session = TerminalService.getSession(sessionId);
    if (!session) {
      session = TerminalService.createSession(sessionId);
    }

    // Set SSE headers
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('Access-Control-Allow-Origin', '*');

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send initial connection event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

        // Set up output listener
        const handleOutput = (data: any) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (error) {
            console.error('Error sending terminal output:', error);
            // Remove listener on error to prevent memory leaks
            session!.eventEmitter.removeListener('output', handleOutput);
          }
        };

        session!.eventEmitter.on('output', handleOutput);

        // Handle client disconnect
        const handleDisconnect = () => {
          try {
            session!.eventEmitter.removeListener('output', handleOutput);
          } catch (error) {
            console.error('Error removing output listener:', error);
          }
        };

        // Clean up on stream close
        return () => {
          handleDisconnect();
        };
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });
  });

  // Delete terminal session
  app.delete("/terminal/session/:sessionId", async (c: Context) => {
    const sessionId = c.req.param('sessionId');

    if (!sessionId) {
      return c.json({ error: "Session ID is required" }, 400);
    }

    const success = TerminalService.destroySession(sessionId);

    if (success) {

      return c.json({ message: `Terminal session ${sessionId} destroyed successfully` });
    } else {
      console.log(`Terminal session not found: ${sessionId}`);
      return c.json({ error: `Terminal session ${sessionId} not found` }, 404);
    }
  });

  const { serve } = await import('@hono/node-server');

  // Start the server and initialize WebSocket
  const server = serve({
    fetch: app.fetch,
    port,
  }) as Server;

  // Initialize WebSocket service
  WebSocketTerminalService.initialize(server);

  // Setup global graceful shutdown
  const setupGlobalShutdown = () => {
    const cleanup = async () => {
      console.log('\n🛑 Shutting down sandbox server and all terminal sessions...');

      // Clean up WebSocket connections
      WebSocketTerminalService.cleanup();

      process.exit(0);
    };

    // Handle Ctrl+C (SIGINT)
    process.on('SIGINT', () => {
      cleanup().catch(() => process.exit(1));
    });

    // Handle termination signal
    process.on('SIGTERM', () => {
      cleanup().catch(() => process.exit(1));
    });
  };

  setupGlobalShutdown();

  // Initialize terminal service cleanup
  TerminalService.setupGlobalCleanup();

  console.log(`\n🌳 Treesap Sandbox Server running at http://localhost:${port}`);
  console.log(`🔌 WebSocket terminal server available at ws://localhost:${port}/terminal/ws\n`);

  return server;
}