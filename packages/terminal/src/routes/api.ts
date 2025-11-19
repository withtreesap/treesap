/**
 * REST API routes for terminal management
 */

import { Hono } from 'hono';
import { TerminalManager } from '../terminal-manager.js';
import {
  CreateSessionResponse,
  SessionListResponse,
  SessionStatusResponse,
  SuccessResponse,
  TerminalSessionConfig
} from '../types.js';

export function createApiRoutes(manager: TerminalManager) {
  const api = new Hono();

  /**
   * List all terminal sessions
   * GET /api/terminal/sessions
   */
  api.get('/sessions', (c) => {
    const sessions = manager.listSessions();
    return c.json<SessionListResponse>({ sessions });
  });

  /**
   * Create a new terminal session
   * POST /api/terminal/sessions
   */
  api.post('/sessions', async (c) => {
    try {
      const body = await c.req.json<TerminalSessionConfig>();

      const session = manager.createSession(body);

      return c.json<CreateSessionResponse>({
        id: session.id,
        pid: session.pid,
        created: session.created
      }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create session';
      return c.json({ error: message }, 400);
    }
  });

  /**
   * Get session status
   * GET /api/terminal/sessions/:id
   */
  api.get('/sessions/:id', (c) => {
    const id = c.req.param('id');
    const session = manager.getSession(id);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json<SessionStatusResponse>(session.getInfo());
  });

  /**
   * Send command to session (alternative to WebSocket)
   * POST /api/terminal/sessions/:id/command
   */
  api.post('/sessions/:id/command', async (c) => {
    const id = c.req.param('id');
    const session = manager.getSession(id);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (!session.isActive()) {
      return c.json({ error: 'Session is not active' }, 400);
    }

    try {
      const body = await c.req.json<{ command: string }>();

      if (!body.command) {
        return c.json({ error: 'Command is required' }, 400);
      }

      // Write command with newline
      session.write(body.command + '\n');

      return c.json<SuccessResponse>({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send command';
      return c.json({ error: message }, 400);
    }
  });

  /**
   * Resize terminal
   * POST /api/terminal/sessions/:id/resize
   */
  api.post('/sessions/:id/resize', async (c) => {
    const id = c.req.param('id');
    const session = manager.getSession(id);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (!session.isActive()) {
      return c.json({ error: 'Session is not active' }, 400);
    }

    try {
      const body = await c.req.json<{ cols: number; rows: number }>();

      if (!body.cols || !body.rows) {
        return c.json({ error: 'cols and rows are required' }, 400);
      }

      session.resize(body.cols, body.rows);

      return c.json<SuccessResponse>({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resize terminal';
      return c.json({ error: message }, 400);
    }
  });

  /**
   * Kill/terminate session
   * DELETE /api/terminal/sessions/:id
   */
  api.delete('/sessions/:id', (c) => {
    const id = c.req.param('id');
    const success = manager.destroySession(id);

    if (!success) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json<SuccessResponse>({ success: true });
  });

  /**
   * Get sessions by sandbox ID
   * GET /api/terminal/sessions/sandbox/:sandboxId
   */
  api.get('/sessions/sandbox/:sandboxId', (c) => {
    const sandboxId = c.req.param('sandboxId');
    const sessions = manager.getSessionsBySandbox(sandboxId);

    return c.json<SessionListResponse>({ sessions });
  });

  return api;
}
