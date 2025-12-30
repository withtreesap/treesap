import { Sandbox, ExecOptions } from './sandbox.js';
import { Readable } from 'stream';

export type ExecEventType = 'start' | 'stdout' | 'stderr' | 'complete' | 'error';

export interface ExecEvent {
  type: ExecEventType;
  data?: string;
  exitCode?: number;
  error?: string;
  timestamp: number;
}

export interface LogEvent {
  type: 'log';
  data: string;
  timestamp: number;
  stream?: 'stdout' | 'stderr';
}

/**
 * Service for creating Server-Sent Events (SSE) streams
 */
export class StreamService {
  /**
   * Create an SSE stream for command execution
   */
  static createExecStream(sandbox: Sandbox, command: string, options: ExecOptions = {}): Readable {
    const stream = new Readable({
      read() {},
    });

    const sendEvent = (event: ExecEvent) => {
      const data = JSON.stringify(event);
      stream.push(`data: ${data}\n\n`);
    };

    // Send start event
    sendEvent({
      type: 'start',
      timestamp: Date.now(),
    });

    // Execute command with streaming
    sandbox
      .exec(command, {
        ...options,
        stream: true,
        onOutput: (outputStream, data) => {
          sendEvent({
            type: outputStream,
            data,
            timestamp: Date.now(),
          });
        },
      })
      .then((result) => {
        // Send complete event
        sendEvent({
          type: 'complete',
          exitCode: result.exitCode,
          timestamp: Date.now(),
        });

        stream.push(null); // End stream
      })
      .catch((error) => {
        // Send error event
        sendEvent({
          type: 'error',
          error: error.message,
          timestamp: Date.now(),
        });

        stream.push(null); // End stream
      });

    return stream;
  }

  /**
   * Create an SSE stream for process logs
   */
  static createProcessLogStream(sandbox: Sandbox, processId: string): Readable {
    const stream = new Readable({
      read() {},
    });

    const sendEvent = (event: LogEvent) => {
      const data = JSON.stringify(event);
      stream.push(`data: ${data}\n\n`);
    };

    // Listen for process output
    const outputListener = (data: any) => {
      if (data.processId === processId) {
        sendEvent({
          type: 'log',
          data: data.data,
          stream: data.stream,
          timestamp: Date.now(),
        });
      }
    };

    const exitListener = (data: any) => {
      if (data.processId === processId) {
        // End stream when process exits
        stream.push(null);
        cleanup();
      }
    };

    // Attach listeners
    sandbox.on('process_output', outputListener);
    sandbox.on('process_exit', exitListener);

    // Cleanup function
    const cleanup = () => {
      sandbox.off('process_output', outputListener);
      sandbox.off('process_exit', exitListener);
    };

    // Cleanup on stream close
    stream.on('close', cleanup);

    return stream;
  }

  /**
   * Helper to parse SSE stream on client side
   * This is exported for client library usage
   */
  static async *parseSSEStream<T = ExecEvent | LogEvent>(
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
}
