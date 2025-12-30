/**
 * HTTP Exposure Service
 * Integrates with Caddy Admin API to dynamically expose sandbox ports
 */

export interface HttpExposureConfig {
  /**
   * Caddy Admin API URL (default: http://localhost:2019)
   */
  caddyAdminUrl: string;

  /**
   * Base domain for sandbox subdomains (e.g., sandbox.yourdomain.com)
   */
  baseDomain: string;

  /**
   * Protocol to use for generated URLs (default: https)
   */
  protocol: 'http' | 'https';

  /**
   * Host where sandbox ports are accessible (default: localhost)
   * This is the internal address Caddy will proxy to
   */
  upstreamHost: string;
}

export interface ExposedEndpoint {
  sandboxId: string;
  port: number;
  publicUrl: string;
  routeId: string;
  createdAt: number;
}

const DEFAULT_CONFIG: HttpExposureConfig = {
  caddyAdminUrl: 'http://localhost:2019',
  baseDomain: 'sandbox.localhost',
  protocol: 'https',
  upstreamHost: 'localhost',
};

/**
 * Service for managing HTTP exposure of sandbox ports via Caddy
 */
export class HttpExposureService {
  private config: HttpExposureConfig;
  private exposures: Map<string, ExposedEndpoint[]> = new Map();

  constructor(config: Partial<HttpExposureConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      // Allow env vars to override
      caddyAdminUrl: config.caddyAdminUrl || process.env.CADDY_ADMIN_URL || DEFAULT_CONFIG.caddyAdminUrl,
      baseDomain: config.baseDomain || process.env.SANDBOX_DOMAIN || DEFAULT_CONFIG.baseDomain,
      protocol: (config.protocol || process.env.SANDBOX_PROTOCOL || DEFAULT_CONFIG.protocol) as 'http' | 'https',
      upstreamHost: config.upstreamHost || process.env.SANDBOX_UPSTREAM_HOST || DEFAULT_CONFIG.upstreamHost,
    };
  }

  /**
   * Generate a unique subdomain for a sandbox port
   */
  private generateSubdomain(sandboxId: string, port: number): string {
    // Use first 8 chars of sandbox ID + port for a shorter, readable subdomain
    const shortId = sandboxId.substring(0, 8);
    return `${shortId}-${port}`;
  }

  /**
   * Generate a unique route ID for Caddy
   */
  private generateRouteId(sandboxId: string, port: number): string {
    return `sandbox-${sandboxId}-${port}`;
  }

  /**
   * Expose a sandbox port and return the public URL
   */
  async expose(sandboxId: string, port: number): Promise<string> {
    const subdomain = this.generateSubdomain(sandboxId, port);
    const routeId = this.generateRouteId(sandboxId, port);
    const hostname = `${subdomain}.${this.config.baseDomain}`;
    const publicUrl = `${this.config.protocol}://${hostname}`;

    // Check if already exposed
    const existing = this.getExposure(sandboxId, port);
    if (existing) {
      return existing.publicUrl;
    }

    // Create Caddy route configuration
    const route = {
      '@id': routeId,
      match: [{ host: [hostname] }],
      handle: [
        {
          handler: 'reverse_proxy',
          upstreams: [{ dial: `${this.config.upstreamHost}:${port}` }],
        },
      ],
    };

    try {
      // Add route to Caddy via Admin API
      const response = await fetch(
        `${this.config.caddyAdminUrl}/config/apps/http/servers/srv0/routes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(route),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add Caddy route: ${errorText}`);
      }

      // Track the exposure
      const endpoint: ExposedEndpoint = {
        sandboxId,
        port,
        publicUrl,
        routeId,
        createdAt: Date.now(),
      };

      const sandboxExposures = this.exposures.get(sandboxId) || [];
      sandboxExposures.push(endpoint);
      this.exposures.set(sandboxId, sandboxExposures);

      return publicUrl;
    } catch (error: any) {
      // If Caddy is not available, return a placeholder URL for development
      if (error.cause?.code === 'ECONNREFUSED') {
        console.warn(`Caddy not available at ${this.config.caddyAdminUrl}. Using placeholder URL.`);

        // Still track the exposure locally
        const endpoint: ExposedEndpoint = {
          sandboxId,
          port,
          publicUrl: `http://${this.config.upstreamHost}:${port}`,
          routeId,
          createdAt: Date.now(),
        };

        const sandboxExposures = this.exposures.get(sandboxId) || [];
        sandboxExposures.push(endpoint);
        this.exposures.set(sandboxId, sandboxExposures);

        return endpoint.publicUrl;
      }
      throw error;
    }
  }

  /**
   * Remove HTTP exposure for a sandbox port (or all ports if port is undefined)
   */
  async unexpose(sandboxId: string, port?: number): Promise<void> {
    const endpoints = this.exposures.get(sandboxId) || [];
    const toRemove = port
      ? endpoints.filter((e) => e.port === port)
      : endpoints;

    for (const endpoint of toRemove) {
      try {
        // Remove route from Caddy via Admin API
        const response = await fetch(
          `${this.config.caddyAdminUrl}/id/${endpoint.routeId}`,
          { method: 'DELETE' }
        );

        // Ignore 404 errors (route doesn't exist)
        if (!response.ok && response.status !== 404) {
          console.warn(`Failed to remove Caddy route ${endpoint.routeId}: ${response.status}`);
        }
      } catch (error: any) {
        // Ignore connection errors (Caddy not available)
        if (error.cause?.code !== 'ECONNREFUSED') {
          console.warn(`Error removing Caddy route: ${error.message}`);
        }
      }
    }

    // Update local tracking
    if (port) {
      this.exposures.set(
        sandboxId,
        endpoints.filter((e) => e.port !== port)
      );
    } else {
      this.exposures.delete(sandboxId);
    }
  }

  /**
   * Get all exposures for a sandbox
   */
  getExposures(sandboxId: string): ExposedEndpoint[] {
    return this.exposures.get(sandboxId) || [];
  }

  /**
   * Get a specific exposure
   */
  getExposure(sandboxId: string, port: number): ExposedEndpoint | undefined {
    const endpoints = this.exposures.get(sandboxId) || [];
    return endpoints.find((e) => e.port === port);
  }

  /**
   * Get all exposures across all sandboxes
   */
  getAllExposures(): ExposedEndpoint[] {
    const all: ExposedEndpoint[] = [];
    for (const endpoints of this.exposures.values()) {
      all.push(...endpoints);
    }
    return all;
  }

  /**
   * Clean up all exposures for a sandbox (called when sandbox is destroyed)
   */
  async cleanup(sandboxId: string): Promise<void> {
    await this.unexpose(sandboxId);
  }
}
