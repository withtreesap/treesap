import { ExecuteResponse, ProcessInfo, ExecOptions } from './sandbox.js';
import { FileInfo, ListFilesOptions } from './file-service.js';
import { ExecEvent, LogEvent } from './stream-service.js';

export interface SandboxClientConfig {
  baseUrl: string;
  sandboxId?: string;
  apiKey?: string;
}

export interface CreateSandboxOptions {
  apiKey?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface CreateSandboxResponse {
  id: string;
  workDir: string;
  createdAt: number;
}

/**
 * Client library for interacting with TreeSap Sandbox API
 */
export class SandboxClient {
  private baseUrl: string;
  private apiKey?: string;
  public readonly id: string;

  constructor(config: SandboxClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.id = config.sandboxId || '';
    this.apiKey = config.apiKey;
  }

  /**
   * Get headers for API requests (includes API key if configured)
   */
  private getHeaders(contentType?: string): Record<string, string> {
    const headers: Record<string, string> = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    return headers;
  }

  /**
   * Create a new sandbox instance
   */
  static async create(baseUrl: string, options: CreateSandboxOptions = {}): Promise<SandboxClient> {
    const url = `${baseUrl.replace(/\/$/, '')}/sandbox`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.apiKey) {
      headers['X-API-Key'] = options.apiKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ env: options.env, timeout: options.timeout }),
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to create sandbox');
    }

    const data = await response.json() as CreateSandboxResponse;

    return new SandboxClient({
      baseUrl,
      sandboxId: data.id,
      apiKey: options.apiKey,
    });
  }

  /**
   * Get existing sandbox by ID
   */
  static fromId(baseUrl: string, sandboxId: string, apiKey?: string): SandboxClient {
    return new SandboxClient({ baseUrl, sandboxId, apiKey });
  }

  // ============================================================================
  // Command Execution
  // ============================================================================

  /**
   * Execute a command and return the complete result
   */
  async exec(command: string, options: ExecOptions = {}): Promise<ExecuteResponse> {
    const url = `${this.baseUrl}/sandbox/${this.id}/exec`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders('application/json'),
      body: JSON.stringify({ command, ...options }),
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to execute command');
    }

    return await response.json() as ExecuteResponse;
  }

  /**
   * Execute a command and return a streaming response
   */
  async execStream(command: string, options: ExecOptions = {}): Promise<ReadableStream> {
    const params = new URLSearchParams({ command });
    if (options.timeout) {
      params.append('timeout', options.timeout.toString());
    }

    const url = `${this.baseUrl}/sandbox/${this.id}/exec-stream?${params}`;

    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to execute command');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  }

  // ============================================================================
  // Process Management
  // ============================================================================

  /**
   * Start a long-running background process
   */
  async startProcess(command: string, options: ExecOptions = {}): Promise<ProcessInfo> {
    const url = `${this.baseUrl}/sandbox/${this.id}/process`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders('application/json'),
      body: JSON.stringify({ command, ...options }),
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to start process');
    }

    return await response.json() as ProcessInfo;
  }

  /**
   * List all processes
   */
  async listProcesses(): Promise<ProcessInfo[]> {
    const url = `${this.baseUrl}/sandbox/${this.id}/process`;

    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to list processes');
    }

    const data = await response.json() as any;
    return data.processes as ProcessInfo[];
  }

  /**
   * Get process information
   */
  async getProcess(processId: string): Promise<ProcessInfo> {
    const url = `${this.baseUrl}/sandbox/${this.id}/process/${processId}`;

    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to get process');
    }

    return await response.json() as ProcessInfo;
  }

  /**
   * Kill a process
   */
  async killProcess(processId: string, signal: string = 'SIGTERM'): Promise<void> {
    const url = `${this.baseUrl}/sandbox/${this.id}/process/${processId}?signal=${signal}`;

    const response = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to kill process');
    }
  }

  /**
   * Kill all processes
   */
  async killAllProcesses(): Promise<void> {
    const processes = await this.listProcesses();
    const runningProcesses = processes.filter((p) => p.status === 'running');

    await Promise.all(
      runningProcesses.map((p) => this.killProcess(p.id).catch(() => {}))
    );
  }

  /**
   * Stream process logs
   */
  async streamProcessLogs(processId: string): Promise<ReadableStream> {
    const url = `${this.baseUrl}/sandbox/${this.id}/process/${processId}/logs`;

    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to stream logs');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  }

  /**
   * Get accumulated process logs (utility method)
   */
  async getProcessLogs(processId: string): Promise<string> {
    const stream = await this.streamProcessLogs(processId);
    const logs: string[] = [];

    for await (const event of parseSSEStream<LogEvent>(stream)) {
      if (event.data) {
        logs.push(event.data);
      }
    }

    return logs.join('');
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  /**
   * List files in a directory
   */
  async listFiles(path: string = '.', options: ListFilesOptions = {}): Promise<FileInfo[]> {
    const params = new URLSearchParams({ path });

    if (options.recursive) {
      params.append('recursive', 'true');
    }
    if (options.pattern) {
      params.append('pattern', options.pattern);
    }
    if (options.includeHidden) {
      params.append('hidden', 'true');
    }

    const url = `${this.baseUrl}/sandbox/${this.id}/files?${params}`;

    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to list files');
    }

    const data = await response.json() as any;
    return data.files as FileInfo[];
  }

  /**
   * Read a file's contents
   */
  async readFile(path: string): Promise<string> {
    const url = `${this.baseUrl}/sandbox/${this.id}/files/${path}`;

    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to read file');
    }

    const data = await response.json() as any;
    return data.content as string;
  }

  /**
   * Write content to a file
   */
  async writeFile(path: string, content: string): Promise<void> {
    const url = `${this.baseUrl}/sandbox/${this.id}/files/${path}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders('application/json'),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to write file');
    }
  }

  /**
   * Delete a file or directory
   */
  async deleteFile(path: string, options: { recursive?: boolean } = {}): Promise<void> {
    const params = new URLSearchParams();
    if (options.recursive) {
      params.append('recursive', 'true');
    }

    const url = `${this.baseUrl}/sandbox/${this.id}/files/${path}?${params}`;

    const response = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to delete file');
    }
  }

  // ============================================================================
  // Environment Variable Management
  // ============================================================================

  /**
   * Set environment variables in the sandbox
   */
  async setEnv(variables: Record<string, string>): Promise<void> {
    const url = `${this.baseUrl}/sandbox/${this.id}/env`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders('application/json'),
      body: JSON.stringify({ variables }),
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to set environment variables');
    }
  }

  /**
   * Get list of environment variable names (not values for security)
   */
  async listEnv(): Promise<string[]> {
    const url = `${this.baseUrl}/sandbox/${this.id}/env`;

    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to list environment variables');
    }

    const data = await response.json() as any;
    return data.variables as string[];
  }

  /**
   * Unset (remove) an environment variable
   */
  async unsetEnv(key: string): Promise<void> {
    const url = `${this.baseUrl}/sandbox/${this.id}/env/${encodeURIComponent(key)}`;

    const response = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to unset environment variable');
    }
  }

  // ============================================================================
  // HTTP Exposure
  // ============================================================================

  /**
   * Expose a sandbox port via HTTP and return the public URL
   */
  async exposeHttp(port: number): Promise<string> {
    const url = `${this.baseUrl}/sandbox/${this.id}/expose`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders('application/json'),
      body: JSON.stringify({ port }),
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to expose HTTP port');
    }

    const data = await response.json() as any;
    return data.url as string;
  }

  /**
   * Get list of exposed HTTP endpoints
   */
  async listExposures(): Promise<Array<{ sandboxId: string; port: number; publicUrl: string }>> {
    const url = `${this.baseUrl}/sandbox/${this.id}/expose`;

    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to list exposures');
    }

    const data = await response.json() as any;
    return data.exposures || [];
  }

  /**
   * Remove HTTP exposure for a specific port (or all if port is undefined)
   */
  async unexposeHttp(port?: number): Promise<void> {
    const params = port ? `?port=${port}` : '';
    const url = `${this.baseUrl}/sandbox/${this.id}/expose${params}`;

    const response = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to unexpose HTTP');
    }
  }

  // ============================================================================
  // Sandbox Management
  // ============================================================================

  /**
   * Get sandbox status
   */
  async getStatus() {
    const url = `${this.baseUrl}/sandbox/${this.id}`;

    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to get status');
    }

    return await response.json() as any;
  }

  /**
   * Destroy the sandbox
   */
  async destroy(options: { cleanup?: boolean } = {}): Promise<void> {
    const params = new URLSearchParams();
    if (options.cleanup) {
      params.append('cleanup', 'true');
    }

    const url = `${this.baseUrl}/sandbox/${this.id}?${params}`;

    const response = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Failed to destroy sandbox');
    }
  }
}

/**
 * Parse Server-Sent Events stream
 * Utility function for consuming SSE streams from exec and logs
 */
export async function* parseSSEStream<T = ExecEvent | LogEvent>(
  stream: ReadableStream
): AsyncGenerator<T> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Split by double newline (SSE event delimiter)
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        if (event.trim()) {
          // Parse SSE format (data: {json})
          const match = event.match(/^data: (.+)$/m);
          if (match) {
            try {
              const data = JSON.parse(match[1]);
              yield data as T;
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
