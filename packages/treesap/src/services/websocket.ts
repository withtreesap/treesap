import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { TerminalService, type TerminalSession } from './terminal.js';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  sessionId?: string;
  terminalId?: string;
  lastPing: Date;
}

export interface WebSocketMessage {
  type: 'join' | 'leave' | 'input' | 'ping' | 'pong';
  sessionId?: string;
  terminalId?: string;
  data?: string;
  timestamp?: number;
}

export class WebSocketTerminalService {
  private static wss: WebSocketServer | null = null;
  private static clients = new Map<string, WebSocketClient>();
  private static sessionClients = new Map<string, Set<string>>(); // sessionId -> Set<clientId>
  
  static initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/terminal/ws'
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const clientId = uuidv4();
      const client: WebSocketClient = {
        id: clientId,
        ws,
        lastPing: new Date()
      };

      this.clients.set(clientId, client);
      console.log(`WebSocket client connected: ${clientId}`);

      // Set up message handler
      ws.on('message', (data: Buffer) => {
        this.handleMessage(clientId, data);
      });

      // Set up disconnect handler
      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Set up error handler
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });

      // Send initial connection success
      this.sendToClient(clientId, {
        type: 'pong',
        timestamp: Date.now()
      });

      // Set up ping/pong for connection health
      this.setupPingPong(clientId);
    });

    console.log('WebSocket server initialized for terminal connections');
  }

  private static setupPingPong(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const pingInterval = setInterval(() => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
        client.lastPing = new Date();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Ping every 30 seconds

    client.ws.on('pong', () => {
      client.lastPing = new Date();
    });

    client.ws.on('close', () => {
      clearInterval(pingInterval);
    });
  }

  private static handleMessage(clientId: string, data: Buffer) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const client = this.clients.get(clientId);
      
      if (!client) {
        console.error(`Client ${clientId} not found`);
        return;
      }

      switch (message.type) {
        case 'join':
          this.handleJoin(clientId, message);
          break;
        case 'leave':
          this.handleLeave(clientId, message);
          break;
        case 'input':
          this.handleInput(clientId, message);
          break;
        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            timestamp: Date.now()
          });
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error parsing WebSocket message from ${clientId}:`, error);
    }
  }

  private static handleJoin(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client || !message.sessionId) return;

    console.log(`Client ${clientId} joining session ${message.sessionId}`);

    // Remove client from any existing session
    if (client.sessionId) {
      this.removeClientFromSession(clientId, client.sessionId);
    }

    // Get or create terminal session
    let session = TerminalService.getSession(message.sessionId);
    if (!session) {
      console.log(`Creating new terminal session: ${message.sessionId}`);
      session = TerminalService.createSession(message.sessionId);
    }

    // Update client info
    client.sessionId = message.sessionId;
    client.terminalId = message.terminalId;

    // Add client to session tracking
    this.addClientToSession(clientId, message.sessionId);

    // Set up output listener for this session (if not already set up)
    this.setupSessionOutputListener(message.sessionId);

    // Send connection confirmation
    this.sendToClient(clientId, {
      type: 'connected',
      sessionId: message.sessionId,
      timestamp: Date.now()
    });

    // Notify all clients in this session about client count
    this.broadcastClientCount(message.sessionId);
  }

  private static handleLeave(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client ${clientId} leaving session ${client.sessionId}`);

    if (client.sessionId) {
      this.removeClientFromSession(clientId, client.sessionId);
      this.broadcastClientCount(client.sessionId);
    }

    client.sessionId = undefined;
    client.terminalId = undefined;
  }

  private static handleInput(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client || !message.sessionId || message.data === undefined) return;;

    // Get the terminal session
    const session = TerminalService.getSession(message.sessionId);
    if (!session) {
      console.error(`Session ${message.sessionId} not found`);
      this.sendToClient(clientId, {
        type: 'error',
        data: 'Terminal session not found',
        timestamp: Date.now()
      });
      return;
    }

    // Send input directly to PTY (raw input like key presses)
    try {
      session.lastActivity = new Date();
      session.process.write(message.data);
    } catch (error) {
      console.error(`Failed to send input to session ${message.sessionId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        data: 'Failed to send input to terminal',
        timestamp: Date.now()
      });
    }
  }

  private static handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    console.log(`WebSocket client disconnected: ${clientId}`);

    if (client?.sessionId) {
      this.removeClientFromSession(clientId, client.sessionId);
      this.broadcastClientCount(client.sessionId);
    }

    this.clients.delete(clientId);
  }

  private static addClientToSession(clientId: string, sessionId: string) {
    if (!this.sessionClients.has(sessionId)) {
      this.sessionClients.set(sessionId, new Set());
    }
    this.sessionClients.get(sessionId)!.add(clientId);
  }

  private static removeClientFromSession(clientId: string, sessionId: string) {
    const clientSet = this.sessionClients.get(sessionId);
    if (clientSet) {
      clientSet.delete(clientId);
      if (clientSet.size === 0) {
        this.sessionClients.delete(sessionId);
        // Clean up output listener if no clients are connected
        this.cleanupSessionOutputListener(sessionId);
      }
    }
  }

  private static setupSessionOutputListener(sessionId: string) {
    const session = TerminalService.getSession(sessionId);
    if (!session) return;

    // Check if listener already exists
    if (session.eventEmitter.listenerCount('output') > 0) {
      return; // Listener already set up
    }

    const handleOutput = (data: any) => {
      this.broadcastToSession(sessionId, data);
    };

    session.eventEmitter.on('output', handleOutput);
    console.log(`Set up output listener for session ${sessionId}`);
  }

  private static cleanupSessionOutputListener(sessionId: string) {
    const session = TerminalService.getSession(sessionId);
    if (!session) return;

    session.eventEmitter.removeAllListeners('output');
    console.log(`Cleaned up output listener for session ${sessionId}`);
  }

  private static broadcastToSession(sessionId: string, data: any) {
    const clientIds = this.sessionClients.get(sessionId);
    if (!clientIds) return;

    const message = {
      ...data,
      timestamp: Date.now()
    };

    for (const clientId of clientIds) {
      this.sendToClient(clientId, message);
    }
  }

  private static broadcastClientCount(sessionId: string) {
    const clientIds = this.sessionClients.get(sessionId);
    const count = clientIds ? clientIds.size : 0;

    if (clientIds) {
      for (const clientId of clientIds) {
        this.sendToClient(clientId, {
          type: 'clients_count',
          count,
          timestamp: Date.now()
        });
      }
    }
  }

  private static sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      this.handleDisconnect(clientId);
    }
  }

  // API methods for external control
  static getSessionClients(sessionId: string): string[] {
    const clientSet = this.sessionClients.get(sessionId);
    return clientSet ? Array.from(clientSet) : [];
  }

  static sendCommandToSession(sessionId: string, command: string): boolean {
    // Send command to terminal
    const success = TerminalService.executeCommand(sessionId, command);
    
    if (success) {
      // The output will be automatically broadcast to all connected clients
      // via the output listener
      console.log(`Command sent to session ${sessionId}: ${command.substring(0, 50)}...`);
    }
    
    return success;
  }

  static getActiveSessions(): Array<{ sessionId: string; clientCount: number }> {
    return Array.from(this.sessionClients.entries()).map(([sessionId, clients]) => ({
      sessionId,
      clientCount: clients.size
    }));
  }

  static getConnectedClients(): number {
    return this.clients.size;
  }

  static closeSession(sessionId: string) {
    const clientIds = this.sessionClients.get(sessionId);
    if (clientIds) {
      // Notify all clients that the session is closing
      for (const clientId of clientIds) {
        this.sendToClient(clientId, {
          type: 'session_closed',
          sessionId,
          timestamp: Date.now()
        });
      }
      
      // Clean up client tracking
      this.sessionClients.delete(sessionId);
    }

    // Clean up the terminal session
    TerminalService.destroySession(sessionId);
  }

  static cleanup() {
    if (this.wss) {
      console.log('Closing WebSocket server...');
      this.wss.close();
      this.wss = null;
    }
    
    this.clients.clear();
    this.sessionClients.clear();
  }
}