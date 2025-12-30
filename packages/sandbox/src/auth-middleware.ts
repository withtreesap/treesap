import { Context, Next } from 'hono';

export interface AuthConfig {
  /**
   * List of valid API keys
   */
  apiKeys: string[];

  /**
   * Header name to check for API key (default: 'X-API-Key')
   */
  headerName?: string;

  /**
   * Paths to exclude from authentication (default: ['/'])
   */
  excludePaths?: string[];
}

/**
 * Create authentication middleware for API key validation
 */
export function createAuthMiddleware(config: AuthConfig) {
  const headerName = config.headerName || 'X-API-Key';
  const excludePaths = config.excludePaths || ['/'];

  return async (c: Context, next: Next) => {
    // Skip auth for excluded paths (exact match)
    if (excludePaths.includes(c.req.path)) {
      return next();
    }

    // Get API key from header
    const apiKey = c.req.header(headerName);

    if (!apiKey) {
      return c.json(
        { error: 'API key required', message: `Missing ${headerName} header` },
        401
      );
    }

    if (!config.apiKeys.includes(apiKey)) {
      return c.json(
        { error: 'Invalid API key', message: 'The provided API key is not valid' },
        403
      );
    }

    // API key is valid, continue to the next middleware/handler
    return next();
  };
}

/**
 * Parse API keys from environment variable
 * Supports comma-separated list of keys
 */
export function parseApiKeysFromEnv(envVar: string = 'SANDBOX_API_KEYS'): string[] {
  const keysString = process.env[envVar] || '';
  return keysString
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}
