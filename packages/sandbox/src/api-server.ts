import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { SandboxManager } from './sandbox-manager';
import { FileService } from './file-service';
import { StreamService } from './stream-service';
import { stream } from 'hono/streaming';
import { Readable } from 'stream';

export interface ServerConfig {
  port?: number;
  host?: string;
  basePath?: string;
  maxSandboxes?: number;
  cors?: boolean;
}

/**
 * Create and configure the API server
 */
export function createServer(config: ServerConfig = {}) {
  const app = new Hono();
  const manager = new SandboxManager({
    basePath: config.basePath,
    maxSandboxes: config.maxSandboxes,
  });

  // CORS middleware if enabled
  if (config.cors) {
    app.use('*', async (c, next) => {
      await next();
      c.header('Access-Control-Allow-Origin', '*');
      c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type');
    });
  }

  // Health check
  app.get('/', (c) => {
    return c.json({
      status: 'ok',
      service: 'Treesap Sandbox',
      version: '1.0.0',
      stats: manager.getStats(),
    });
  });

  // ============================================================================
  // Sandbox Management Endpoints
  // ============================================================================

  /**
   * Create a new sandbox
   * POST /sandbox
   */
  app.post('/sandbox', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const sandbox = await manager.createSandbox(body);

      return c.json({
        id: sandbox.id,
        workDir: sandbox.workDir,
        createdAt: sandbox.createdAt,
      }, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  });

  /**
   * List all sandboxes
   * GET /sandbox
   */
  app.get('/sandbox', (c) => {
    const sandboxes = manager.listSandboxes();
    return c.json({ sandboxes });
  });

  /**
   * Get sandbox info
   * GET /sandbox/:id
   */
  app.get('/sandbox/:id', (c) => {
    const id = c.req.param('id');
    const sandbox = manager.getSandbox(id);

    if (!sandbox) {
      return c.json({ error: 'Sandbox not found' }, 404);
    }

    return c.json(sandbox.getStatus());
  });

  /**
   * Destroy a sandbox
   * DELETE /sandbox/:id
   */
  app.delete('/sandbox/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const cleanup = c.req.query('cleanup') === 'true';

      await manager.destroySandbox(id, { cleanup });
      return c.json({ success: true });
    } catch (error: any) {
      return c.json({ error: error.message }, 404);
    }
  });

  // ============================================================================
  // Command Execution Endpoints
  // ============================================================================

  /**
   * Execute a command
   * POST /sandbox/:id/exec
   */
  app.post('/sandbox/:id/exec', async (c) => {
    try {
      const id = c.req.param('id');
      const sandbox = manager.getSandbox(id);

      if (!sandbox) {
        return c.json({ error: 'Sandbox not found' }, 404);
      }

      const body = await c.req.json();
      const { command, timeout, cwd, env } = body;

      if (!command) {
        return c.json({ error: 'Command is required' }, 400);
      }

      const result = await sandbox.exec(command, { timeout, cwd, env });
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  });

  /**
   * Execute a command with streaming output
   * GET /sandbox/:id/exec-stream?command=...
   */
  app.get('/sandbox/:id/exec-stream', (c) => {
    const id = c.req.param('id');
    const sandbox = manager.getSandbox(id);

    if (!sandbox) {
      return c.json({ error: 'Sandbox not found' }, 404);
    }

    const command = c.req.query('command');
    if (!command) {
      return c.json({ error: 'Command is required' }, 400);
    }

    const timeout = c.req.query('timeout');
    const options = timeout ? { timeout: parseInt(timeout) } : {};

    return stream(c, async (stream) => {
      const execStream = StreamService.createExecStream(sandbox, command, options);

      // Set SSE headers
      c.header('Content-Type', 'text/event-stream');
      c.header('Cache-Control', 'no-cache');
      c.header('Connection', 'keep-alive');

      // Pipe the readable stream to the response
      for await (const chunk of execStream) {
        await stream.write(chunk);
      }
    });
  });

  // ============================================================================
  // Process Management Endpoints
  // ============================================================================

  /**
   * Start a background process
   * POST /sandbox/:id/process
   */
  app.post('/sandbox/:id/process', async (c) => {
    try {
      const id = c.req.param('id');
      const sandbox = manager.getSandbox(id);

      if (!sandbox) {
        return c.json({ error: 'Sandbox not found' }, 404);
      }

      const body = await c.req.json();
      const { command, cwd, env } = body;

      if (!command) {
        return c.json({ error: 'Command is required' }, 400);
      }

      const processInfo = await sandbox.startProcess(command, { cwd, env });
      return c.json(processInfo, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  });

  /**
   * List all processes in a sandbox
   * GET /sandbox/:id/process
   */
  app.get('/sandbox/:id/process', (c) => {
    const id = c.req.param('id');
    const sandbox = manager.getSandbox(id);

    if (!sandbox) {
      return c.json({ error: 'Sandbox not found' }, 404);
    }

    const processes = sandbox.listProcesses();
    return c.json({ processes });
  });

  /**
   * Get process info
   * GET /sandbox/:id/process/:processId
   */
  app.get('/sandbox/:id/process/:processId', (c) => {
    const id = c.req.param('id');
    const processId = c.req.param('processId');
    const sandbox = manager.getSandbox(id);

    if (!sandbox) {
      return c.json({ error: 'Sandbox not found' }, 404);
    }

    const process = sandbox.getProcess(processId);
    if (!process) {
      return c.json({ error: 'Process not found' }, 404);
    }

    return c.json(process);
  });

  /**
   * Kill a process
   * DELETE /sandbox/:id/process/:processId
   */
  app.delete('/sandbox/:id/process/:processId', async (c) => {
    try {
      const id = c.req.param('id');
      const processId = c.req.param('processId');
      const sandbox = manager.getSandbox(id);

      if (!sandbox) {
        return c.json({ error: 'Sandbox not found' }, 404);
      }

      const signal = c.req.query('signal') || 'SIGTERM';
      await sandbox.killProcess(processId, signal);

      return c.json({ success: true });
    } catch (error: any) {
      return c.json({ error: error.message }, 404);
    }
  });

  /**
   * Stream process logs
   * GET /sandbox/:id/process/:processId/logs
   */
  app.get('/sandbox/:id/process/:processId/logs', (c) => {
    const id = c.req.param('id');
    const processId = c.req.param('processId');
    const sandbox = manager.getSandbox(id);

    if (!sandbox) {
      return c.json({ error: 'Sandbox not found' }, 404);
    }

    return stream(c, async (stream) => {
      const logStream = StreamService.createProcessLogStream(sandbox, processId);

      c.header('Content-Type', 'text/event-stream');
      c.header('Cache-Control', 'no-cache');
      c.header('Connection', 'keep-alive');

      for await (const chunk of logStream) {
        await stream.write(chunk);
      }
    });
  });

  // ============================================================================
  // File Operations Endpoints
  // ============================================================================

  /**
   * List files in a directory
   * GET /sandbox/:id/files?path=...&recursive=true
   */
  app.get('/sandbox/:id/files', async (c) => {
    try {
      const id = c.req.param('id');
      const sandbox = manager.getSandbox(id);

      if (!sandbox) {
        return c.json({ error: 'Sandbox not found' }, 404);
      }

      const fileService = new FileService(sandbox.workDir);
      const dirPath = c.req.query('path') || '.';
      const recursive = c.req.query('recursive') === 'true';
      const pattern = c.req.query('pattern');
      const includeHidden = c.req.query('hidden') === 'true';

      const files = await fileService.listFiles(dirPath, {
        recursive,
        pattern,
        includeHidden,
      });

      return c.json({ files });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  });

  /**
   * Read a file
   * GET /sandbox/:id/files/*
   */
  app.get('/sandbox/:id/files/*', async (c) => {
    try {
      const id = c.req.param('id');
      const sandbox = manager.getSandbox(id);

      if (!sandbox) {
        return c.json({ error: 'Sandbox not found' }, 404);
      }

      // Get the file path from the wildcard
      const fullPath = c.req.path;
      const filePath = fullPath.replace(`/sandbox/${id}/files/`, '');

      if (!filePath) {
        return c.json({ error: 'File path is required' }, 400);
      }

      const fileService = new FileService(sandbox.workDir);
      const raw = c.req.query('raw') === 'true';

      if (raw) {
        // Return raw file as stream
        const stream = fileService.createReadStream(filePath);
        return c.body(stream as any);
      } else {
        // Return file content as JSON
        const content = await fileService.readFile(filePath);
        return c.json({ content });
      }
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  });

  /**
   * Write a file
   * POST /sandbox/:id/files/*
   */
  app.post('/sandbox/:id/files/*', async (c) => {
    try {
      const id = c.req.param('id');
      const sandbox = manager.getSandbox(id);

      if (!sandbox) {
        return c.json({ error: 'Sandbox not found' }, 404);
      }

      const fullPath = c.req.path;
      const filePath = fullPath.replace(`/sandbox/${id}/files/`, '');

      if (!filePath) {
        return c.json({ error: 'File path is required' }, 400);
      }

      const body = await c.req.json();
      const { content } = body;

      if (content === undefined) {
        return c.json({ error: 'Content is required' }, 400);
      }

      const fileService = new FileService(sandbox.workDir);
      await fileService.writeFile(filePath, content, { createDirs: true });

      return c.json({ success: true, path: filePath });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  });

  /**
   * Delete a file
   * DELETE /sandbox/:id/files/*
   */
  app.delete('/sandbox/:id/files/*', async (c) => {
    try {
      const id = c.req.param('id');
      const sandbox = manager.getSandbox(id);

      if (!sandbox) {
        return c.json({ error: 'Sandbox not found' }, 404);
      }

      const fullPath = c.req.path;
      const filePath = fullPath.replace(`/sandbox/${id}/files/`, '');

      if (!filePath) {
        return c.json({ error: 'File path is required' }, 400);
      }

      const fileService = new FileService(sandbox.workDir);
      const recursive = c.req.query('recursive') === 'true';

      await fileService.deleteFile(filePath, { recursive });

      return c.json({ success: true });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Cleanup on process exit
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    console.log('Cleaning up sandboxes...');
    await manager.shutdown({ cleanup: true });
    console.log('✅ Shutdown complete');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    console.log('Cleaning up sandboxes...');
    await manager.shutdown({ cleanup: true });
    console.log('✅ Shutdown complete');
    process.exit(0);
  });

  return { app, manager };
}

/**
 * Start the sandbox server
 */
export async function startServer(config: ServerConfig = {}) {
  const port = config.port || 3000;
  const host = config.host || '0.0.0.0';

  const { app, manager } = createServer(config);

  console.log(`🌳 Treesap Sandbox Server starting...`);
  console.log(`📁 Base path: ${manager.getStats().basePath}`);
  console.log(`🚀 Server listening on http://${host}:${port}`);

  const server = serve({
    fetch: app.fetch,
    port,
    hostname: host,
  });

  return { server, app, manager };
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
