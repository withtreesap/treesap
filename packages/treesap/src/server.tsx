
import { Hono, type Context } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import NotFoundLayout from "./layouts/NotFoundLayout.js";
import { Welcome } from "./pages/Welcome.js";
import { Code } from "./pages/Code.js";
import { DevServerManager } from "./services/dev-server.js";
import { TerminalService } from "./services/terminal.js";
import { WebSocketTerminalService } from "./services/websocket.js";
import * as path from 'node:path';
import process from "node:process";
import { fileURLToPath } from 'node:url';
import type { Server } from 'http';

export interface TreesapConfig {
  port?: number;
  projectRoot?: string;
  previewPort?: number;
  devCommand?: string;
  devPort?: number;
}

export async function startServer(config: TreesapConfig & { autoStartDev?: boolean } = {}) {
  const { 
    port = 1234, 
    projectRoot = process.cwd(), 
    previewPort = 5173,
    devCommand,
    devPort,
    autoStartDev = false 
  } = config;

  // Change the current working directory to the project root
  process.chdir(projectRoot);

  // Initialize dev server manager if dev command is provided
  let devServerManager: DevServerManager | null = null;
  if (devCommand) {
    devServerManager = new DevServerManager(devCommand, devPort);
    devServerManager.setupGracefulShutdown();
    
    // Auto-start dev server if enabled
    if (autoStartDev) {
      devServerManager.start().catch(error => {
        console.error("Failed to auto-start dev server:", error);
      });
    }
  }

  const app = new Hono();

  // Resolve module static directory (so consumers can see bundled assets)
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const moduleStaticRoot = path.join(moduleDir, 'static');

  // Welcome page (default)
  app.get("/", (c: Context) => {
    // Additional cache prevention headers
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
    return c.html(<Welcome />);
  });

  // Code page
  app.get("/code", (c: Context) => {
    // Additional cache prevention headers
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
    return c.html(<Code previewPort={previewPort} />);
  });

  // Claude page
  app.get("/claude", (c: Context) => {
    // Additional cache prevention headers
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
    return c.html(<Code previewPort={previewPort} workingDirectory={projectRoot} />);
  });

  
  // Dev server management endpoints
  app.get("/api/dev-status", (c: Context) => {
    if (!devServerManager) {
      return c.json({ error: "No dev server configured" }, 400);
    }
    return c.json(devServerManager.getStatus());
  });

  app.post("/api/dev-restart", async (c: Context) => {
    if (!devServerManager) {
      return c.json({ error: "No dev server configured" }, 400);
    }
    
    try {
      await devServerManager.restart();
      return c.json({ success: true, message: "Dev server restarted" });
    } catch (error) {
      return c.json({ 
        error: "Failed to restart dev server", 
        details: error instanceof Error ? error.message : String(error) 
      }, 500);
    }
  });

  app.post("/api/dev-start", async (c: Context) => {
    if (!devServerManager) {
      return c.json({ error: "No dev server configured" }, 400);
    }
    
    try {
      await devServerManager.start();
      return c.json({ success: true, message: "Dev server started" });
    } catch (error) {
      return c.json({ 
        error: "Failed to start dev server", 
        details: error instanceof Error ? error.message : String(error) 
      }, 500);
    }
  });

  app.post("/api/dev-stop", async (c: Context) => {
    if (!devServerManager) {
      return c.json({ error: "No dev server configured" }, 400);
    }
    
    try {
      await devServerManager.stop();
      return c.json({ success: true, message: "Dev server stopped" });
    } catch (error) {
      return c.json({ 
        error: "Failed to stop dev server", 
        details: error instanceof Error ? error.message : String(error) 
      }, 500);
    }
  });

  app.get("/api/dev-logs", (c: Context) => {
    if (!devServerManager) {
      return c.json({ error: "No dev server configured" }, 400);
    }
    
    const logs = devServerManager.getLogs();
    return c.json({ logs });
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

  // Claude Code subprocess management
  let claudeCodeManager: DevServerManager | null = null;

  app.post("/api/claude-start", async (c: Context) => {
    try {
      if (claudeCodeManager && claudeCodeManager.getStatus().running) {
        return c.json({ error: "Claude Code is already running" }, 400);
      }
      
      claudeCodeManager = new DevServerManager("claude");
      claudeCodeManager.setupGracefulShutdown();
      await claudeCodeManager.start();
      
      return c.json({ success: true, message: "Claude Code started" });
    } catch (error) {
      return c.json({ 
        error: "Failed to start Claude Code", 
        details: error instanceof Error ? error.message : String(error) 
      }, 500);
    }
  });

  app.get("/api/claude-status", (c: Context) => {
    if (!claudeCodeManager) {
      return c.json({ running: false });
    }
    return c.json(claudeCodeManager.getStatus());
  });

  app.post("/api/claude-stop", async (c: Context) => {
    if (!claudeCodeManager) {
      return c.json({ error: "No Claude Code process running" }, 400);
    }
    
    try {
      await claudeCodeManager.stop();
      claudeCodeManager = null;
      return c.json({ success: true, message: "Claude Code stopped" });
    } catch (error) {
      return c.json({ 
        error: "Failed to stop Claude Code", 
        details: error instanceof Error ? error.message : String(error) 
      }, 500);
    }
  });

  app.post("/api/claude-send", async (c: Context) => {
    if (!claudeCodeManager) {
      return c.json({ error: "Claude Code process not running" }, 400);
    }
    
    try {
      const body = await c.req.json();
      const { command } = body;
      
      if (!command) {
        return c.json({ error: "Command is required" }, 400);
      }
      
      // Send command to Claude Code stdin
      const success = claudeCodeManager.sendCommand(command);
      
      if (success) {
        return c.json({ success: true, message: "Command sent to Claude Code" });
      } else {
        return c.json({ error: "Failed to send command - process may not be running" }, 500);
      }
    } catch (error) {
      return c.json({ 
        error: "Failed to send command to Claude Code", 
        details: error instanceof Error ? error.message : String(error) 
      }, 500);
    }
  });

  // Serve static files from the module's bundled static directory
  app.get("*", serveStatic({ root: moduleStaticRoot }));


  // 404 Handler
  app.notFound((c: Context) => c.html(<NotFoundLayout />));

  const { serve } = await import('@hono/node-server');
  
  // Start the server and initialize WebSocket
  const server = serve({
    fetch: app.fetch,
    port,
  }) as Server;
  
  // Initialize WebSocket service
  WebSocketTerminalService.initialize(server);
  
  // Setup global graceful shutdown for all subprocess managers
  const setupGlobalShutdown = () => {
    const cleanup = async () => {
      console.log('\n🛑 Shutting down server and all subprocesses...');
      
      // Clean up WebSocket connections
      WebSocketTerminalService.cleanup();
      
      // Stop Claude Code process if running
      if (claudeCodeManager) {
        try {
          await claudeCodeManager.stop();
          claudeCodeManager = null;
        } catch (error) {
          console.error('Error stopping Claude Code process:', error);
        }
      }
      
      // Stop dev server if running
      if (devServerManager) {
        try {
          await devServerManager.stop();
        } catch (error) {
          console.error('Error stopping dev server:', error);
        }
      }
      
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

    // Handle process exit (synchronous cleanup only)
    process.on('exit', () => {
      if (claudeCodeManager) {
        try {
          claudeCodeManager.stop();
        } catch {
          // Silently handle cleanup errors during exit
        }
      }
    });
  };

  setupGlobalShutdown();
  
  // Initialize terminal service cleanup
  TerminalService.setupGlobalCleanup();
  
  console.log(`\n🌳 Treesap server running at http://localhost:${port}`);
  console.log(`🔌 WebSocket terminal server available at ws://localhost:${port}/terminal/ws\n`);
}
