/**
 * WebSocket handler for terminal sessions
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { TerminalManager } from './terminal-manager.js';
import { TerminalSession } from './terminal-session.js';
import {
  ClientMessage,
  ServerMessage,
  ConnectedMessage,
  OutputMessage,
  ExitMessage,
  ErrorMessage,
  PongMessage
} from './types.js';

interface ClientConnection {
  ws: WebSocket;
  sessionId?: string;
  terminalId?: string;
  session?: TerminalSession;
  outputListener?: (data: string) => void;
  exitListener?: (code: number) => void;
}

export function setupWebSocket(manager: TerminalManager): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const client: ClientConnection = { ws };

    // Send helper
    const send = (message: ServerMessage) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    };

    // Error helper
    const sendError = (message: string, sessionId?: string) => {
      send({ type: 'error', message, sessionId } as ErrorMessage);
    };

    // Cleanup helper
    const cleanup = () => {
      if (client.session && client.outputListener) {
        client.session.removeListener('output', client.outputListener);
      }
      if (client.session && client.exitListener) {
        client.session.removeListener('exit', client.exitListener);
      }
      client.session = undefined;
      client.outputListener = undefined;
      client.exitListener = undefined;
    };

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as ClientMessage;

        switch (message.type) {
          case 'join': {
            // Clean up previous session if any
            cleanup();

            // Get or create session
            let session = manager.getSession(message.sessionId);

            if (!session) {
              try {
                // Create new session
                session = manager.createSession({
                  id: message.sessionId,
                  cols: message.cols,
                  rows: message.rows
                });
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Failed to create session';
                sendError(errorMsg);
                return;
              }
            }

            // Store session reference
            client.session = session;
            client.sessionId = message.sessionId;
            client.terminalId = message.terminalId;

            // Set up output listener
            client.outputListener = (data: string) => {
              send({
                type: 'output',
                sessionId: message.sessionId,
                content: data
              } as OutputMessage);
            };
            session.on('output', client.outputListener);

            // Set up exit listener
            client.exitListener = (code: number) => {
              send({
                type: 'exit',
                sessionId: message.sessionId,
                code
              } as ExitMessage);
            };
            session.on('exit', client.exitListener);

            // Send connected message
            send({
              type: 'connected',
              sessionId: message.sessionId,
              pid: session.pid
            } as ConnectedMessage);

            break;
          }

          case 'input': {
            if (!client.session || client.sessionId !== message.sessionId) {
              sendError('Not connected to session', message.sessionId);
              return;
            }

            if (!client.session.isActive()) {
              sendError('Session is not active', message.sessionId);
              return;
            }

            client.session.write(message.data);
            break;
          }

          case 'resize': {
            if (!client.session || client.sessionId !== message.sessionId) {
              sendError('Not connected to session', message.sessionId);
              return;
            }

            if (!client.session.isActive()) {
              sendError('Session is not active', message.sessionId);
              return;
            }

            client.session.resize(message.cols, message.rows);
            break;
          }

          case 'leave': {
            cleanup();
            client.sessionId = undefined;
            break;
          }

          case 'ping': {
            send({ type: 'pong' } as PongMessage);
            break;
          }

          default: {
            sendError('Unknown message type');
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Invalid message format';
        sendError(errorMsg);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      cleanup();
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      cleanup();
    });
  });

  return wss;
}

/**
 * Handle WebSocket upgrade requests
 */
export function handleUpgrade(
  wss: WebSocketServer,
  request: IncomingMessage,
  socket: any,
  head: Buffer
) {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
}
