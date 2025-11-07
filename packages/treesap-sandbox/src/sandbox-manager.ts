import { Sandbox, SandboxConfig } from './sandbox';
import { EventEmitter } from 'events';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface SandboxManagerConfig {
  basePath?: string;
  maxSandboxes?: number;
  defaultTimeout?: number;
  autoCleanup?: boolean;
  cleanupInterval?: number;
  maxIdleTime?: number;
}

/**
 * Manages multiple sandbox instances
 */
export class SandboxManager extends EventEmitter {
  private sandboxes: Map<string, Sandbox> = new Map();
  private lastActivity: Map<string, number> = new Map();
  private config: SandboxManagerConfig;
  private cleanupIntervalId?: NodeJS.Timeout;

  constructor(config: SandboxManagerConfig = {}) {
    super();
    this.config = {
      basePath: config.basePath || path.join(process.cwd(), '.sandboxes'),
      maxSandboxes: config.maxSandboxes || 100,
      defaultTimeout: config.defaultTimeout || 300000, // 5 minutes
      autoCleanup: config.autoCleanup !== false, // Default true
      cleanupInterval: config.cleanupInterval || 60000, // 1 minute
      maxIdleTime: config.maxIdleTime || 1800000, // 30 minutes
    };

    // Ensure basePath is always set
    if (!this.config.basePath) {
      this.config.basePath = path.join(process.cwd(), '.sandboxes');
    }

    if (this.config.autoCleanup) {
      this.startCleanupTask();
    }
  }

  /**
   * Create a new sandbox
   */
  async createSandbox(config: SandboxConfig = {}): Promise<Sandbox> {
    // Check sandbox limit
    if (this.config.maxSandboxes && this.sandboxes.size >= this.config.maxSandboxes) {
      throw new Error(`Maximum sandbox limit reached (${this.config.maxSandboxes})`);
    }

    // Generate ID first if not provided
    const sandboxId = config.id || uuidv4();

    // Create sandbox with base path
    const sandboxConfig: SandboxConfig = {
      ...config,
      id: sandboxId,
      workDir: config.workDir || path.join(this.config.basePath!, sandboxId),
      timeout: config.timeout || this.config.defaultTimeout,
    };

    const sandbox = new Sandbox(sandboxConfig);
    await sandbox.initialize();

    // Track sandbox
    this.sandboxes.set(sandbox.id, sandbox);
    this.lastActivity.set(sandbox.id, Date.now());

    // Listen for sandbox events to track activity
    sandbox.on('output', () => this.updateActivity(sandbox.id));
    sandbox.on('exec_complete', () => this.updateActivity(sandbox.id));
    sandbox.on('process_started', () => this.updateActivity(sandbox.id));

    this.emit('sandbox_created', { id: sandbox.id });

    return sandbox;
  }

  /**
   * Get a sandbox by ID
   */
  getSandbox(id: string): Sandbox | undefined {
    const sandbox = this.sandboxes.get(id);
    if (sandbox) {
      this.updateActivity(id);
    }
    return sandbox;
  }

  /**
   * List all sandboxes
   */
  listSandboxes(): Array<{ id: string; status: ReturnType<Sandbox['getStatus']> }> {
    return Array.from(this.sandboxes.entries()).map(([id, sandbox]) => ({
      id,
      status: sandbox.getStatus(),
    }));
  }

  /**
   * Destroy a sandbox
   */
  async destroySandbox(id: string, options: { cleanup?: boolean } = {}): Promise<void> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) {
      throw new Error(`Sandbox ${id} not found`);
    }

    await sandbox.destroy(options);
    this.sandboxes.delete(id);
    this.lastActivity.delete(id);

    this.emit('sandbox_destroyed', { id });
  }

  /**
   * Destroy all sandboxes
   */
  async destroyAll(options: { cleanup?: boolean } = {}): Promise<void> {
    const destroyPromises = Array.from(this.sandboxes.keys()).map((id) =>
      this.destroySandbox(id, options).catch((err) => {
        console.error(`Error destroying sandbox ${id}:`, err);
      })
    );

    await Promise.all(destroyPromises);
  }

  /**
   * Get manager statistics
   */
  getStats() {
    const sandboxList = this.listSandboxes();
    const totalProcesses = sandboxList.reduce(
      (sum, { status }) => sum + status.processCount,
      0
    );

    return {
      totalSandboxes: this.sandboxes.size,
      maxSandboxes: this.config.maxSandboxes,
      totalProcesses,
      basePath: this.config.basePath,
      autoCleanup: this.config.autoCleanup,
    };
  }

  /**
   * Start periodic cleanup task
   */
  private startCleanupTask(): void {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupIdleSandboxes();
    }, this.config.cleanupInterval);

    // Don't keep process alive for cleanup
    this.cleanupIntervalId.unref();
  }

  /**
   * Clean up idle sandboxes
   */
  private async cleanupIdleSandboxes(): Promise<void> {
    const now = Date.now();
    const maxIdleTime = this.config.maxIdleTime!;

    const idleSandboxes = Array.from(this.lastActivity.entries())
      .filter(([_, lastActive]) => now - lastActive > maxIdleTime)
      .map(([id]) => id);

    for (const id of idleSandboxes) {
      try {
        await this.destroySandbox(id, { cleanup: true });
        this.emit('sandbox_cleaned_up', { id, reason: 'idle' });
      } catch (error) {
        console.error(`Error cleaning up sandbox ${id}:`, error);
      }
    }
  }

  /**
   * Update last activity time for a sandbox
   */
  private updateActivity(id: string): void {
    this.lastActivity.set(id, Date.now());
  }

  /**
   * Shutdown the manager (cleanup all sandboxes)
   */
  async shutdown(options: { cleanup?: boolean } = {}): Promise<void> {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }

    await this.destroyAll(options);
    this.removeAllListeners();
  }
}
