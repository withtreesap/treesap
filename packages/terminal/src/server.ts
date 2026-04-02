/**
 * Treesap Terminal Server
 * Hono-based web server with terminal support
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { TerminalManager } from './terminal-manager.js';
import { createApiRoutes } from './routes/api.js';
import { setupWebSocket, handleUpgrade } from './websocket-handler.js';
import { ServerConfig, HealthResponse } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Start the terminal server
 */
export async function startTerminalServer(config: ServerConfig = {}) {
  const {
    port = 4000,
    host = 'localhost',
    maxSessions = 100,
    cors: enableCors = true
  } = config;

  // Create terminal manager
  const manager = new TerminalManager(maxSessions);

  // Create Hono app
  const app = new Hono();

  // CORS middleware
  if (enableCors) {
    app.use('/*', cors());
  }

  // Health check endpoint
  app.get('/', (c) => {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../package.json'), 'utf-8')
    );

    return c.json<HealthResponse>({
      status: 'ok',
      service: 'Treesap Terminal',
      version: packageJson.version,
      activeSessions: manager.getActiveSessionCount()
    });
  });

  // Serve static files from public directory
  app.use(
    '/static/*',
    serveStatic({
      root: join(__dirname, '../public'),
      rewriteRequestPath: (path) => path.replace(/^\/static/, '')
    })
  );

  // Serve index.html at /terminal
  app.get('/terminal', (c) => {
    const html = readFileSync(join(__dirname, '../public/index.html'), 'utf-8');
    return c.html(html);
  });

  // API routes
  const apiRoutes = createApiRoutes(manager);
  app.route('/api/terminal', apiRoutes);

  // Start server with Node.js adapter
  const server = serve({
    fetch: app.fetch,
    port,
    hostname: host
  }, (info) => {
    // Normalize IPv6 localhost (::1) to 'localhost' for better readability
    const displayAddress = info.address === '::1' || info.address === '::'
      ? 'localhost'
      : info.address;

    console.log(`🚀 Treesap Terminal Server running at http://${displayAddress}:${info.port}`);
    console.log(`   Terminal UI: http://${displayAddress}:${info.port}/terminal`);
    console.log(`   WebSocket: ws://${displayAddress}:${info.port}/terminal/ws`);
    console.log(`   API: http://${displayAddress}:${info.port}/api/terminal`);
    console.log(`   Max sessions: ${maxSessions}`);
  });

  // Set up WebSocket server
  const wss = setupWebSocket(manager);

  // Handle WebSocket upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);

    if (url.pathname === '/terminal/ws') {
      handleUpgrade(wss, request, socket, head);
    } else {
      socket.destroy();
    }
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down Terminal Server...');
    manager.destroyAllSessions();
    wss.close();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return {
    server,
    manager,
    wss,
    shutdown
  };
}

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startTerminalServer({
    port: parseInt(process.env.PORT || '4000'),
    host: process.env.HOST || 'localhost'
  });
}
