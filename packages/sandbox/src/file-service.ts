import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import { createReadStream, createWriteStream } from 'fs';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  mtime?: number;
}

export interface ListFilesOptions {
  recursive?: boolean;
  pattern?: string;
  includeHidden?: boolean;
}

export interface ReadFileOptions {
  encoding?: BufferEncoding;
  raw?: boolean;
}

export interface WriteFileOptions {
  encoding?: BufferEncoding;
  mode?: number;
  createDirs?: boolean;
}

/**
 * Service for managing file operations within a sandbox
 * Includes path validation to prevent directory traversal attacks
 */
export class FileService {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  /**
   * Validate and resolve a path within the sandbox
   * Prevents directory traversal attacks
   */
  private resolvePath(filePath: string): string {
    const resolved = path.resolve(this.basePath, filePath);

    // Ensure the resolved path is within basePath
    if (!resolved.startsWith(this.basePath)) {
      throw new Error('Path traversal detected - access denied');
    }

    return resolved;
  }

  /**
   * Read a file's contents
   */
  async readFile(filePath: string, options: ReadFileOptions = {}): Promise<string | Buffer> {
    const resolved = this.resolvePath(filePath);

    if (options.raw) {
      return await fs.readFile(resolved);
    }

    const encoding = options.encoding || 'utf-8';
    return await fs.readFile(resolved, encoding);
  }

  /**
   * Write content to a file
   */
  async writeFile(
    filePath: string,
    content: string | Buffer,
    options: WriteFileOptions = {}
  ): Promise<void> {
    const resolved = this.resolvePath(filePath);

    // Create parent directories if requested
    if (options.createDirs) {
      const dir = path.dirname(resolved);
      await fs.mkdir(dir, { recursive: true });
    }

    const encoding = options.encoding || 'utf-8';
    const writeOptions: any = { encoding };

    if (options.mode) {
      writeOptions.mode = options.mode;
    }

    await fs.writeFile(resolved, content, writeOptions);
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath: string = '.', options: ListFilesOptions = {}): Promise<FileInfo[]> {
    const resolved = this.resolvePath(dirPath);

    const files: FileInfo[] = [];

    const entries = await fs.readdir(resolved, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden files unless requested
      if (!options.includeHidden && entry.name.startsWith('.')) {
        continue;
      }

      // Apply pattern filter if provided
      if (options.pattern && !this.matchPattern(entry.name, options.pattern)) {
        continue;
      }

      const fullPath = path.join(resolved, entry.name);
      const relativePath = path.relative(this.basePath, fullPath);

      const fileInfo: FileInfo = {
        name: entry.name,
        path: relativePath,
        type: entry.isDirectory() ? 'directory' : 'file',
      };

      // Get file stats for size and mtime
      try {
        const stats = await fs.stat(fullPath);
        fileInfo.size = stats.size;
        fileInfo.mtime = stats.mtimeMs;
      } catch {
        // Ignore stat errors
      }

      files.push(fileInfo);

      // Recursively list subdirectories if requested
      if (options.recursive && entry.isDirectory()) {
        const subFiles = await this.listFiles(relativePath, options);
        files.push(...subFiles);
      }
    }

    return files;
  }

  /**
   * Delete a file or directory
   */
  async deleteFile(filePath: string, options: { recursive?: boolean } = {}): Promise<void> {
    const resolved = this.resolvePath(filePath);

    const stats = await fs.stat(resolved);

    if (stats.isDirectory()) {
      await fs.rm(resolved, { recursive: options.recursive, force: true });
    } else {
      await fs.unlink(resolved);
    }
  }

  /**
   * Check if a file or directory exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const resolved = this.resolvePath(filePath);
      await fs.access(resolved);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async stat(filePath: string): Promise<FileInfo> {
    const resolved = this.resolvePath(filePath);
    const stats = await fs.stat(resolved);
    const relativePath = path.relative(this.basePath, resolved);

    return {
      name: path.basename(resolved),
      path: relativePath,
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.size,
      mtime: stats.mtimeMs,
    };
  }

  /**
   * Create a directory
   */
  async mkdir(dirPath: string, options: { recursive?: boolean } = {}): Promise<void> {
    const resolved = this.resolvePath(dirPath);
    await fs.mkdir(resolved, { recursive: options.recursive });
  }

  /**
   * Copy a file or directory
   */
  async copy(
    sourcePath: string,
    destPath: string,
    options: { overwrite?: boolean } = {}
  ): Promise<void> {
    const resolvedSource = this.resolvePath(sourcePath);
    const resolvedDest = this.resolvePath(destPath);

    // Check if destination exists
    if (!options.overwrite) {
      try {
        await fs.access(resolvedDest);
        throw new Error('Destination already exists');
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    }

    await fs.cp(resolvedSource, resolvedDest, { recursive: true });
  }

  /**
   * Move/rename a file or directory
   */
  async move(sourcePath: string, destPath: string): Promise<void> {
    const resolvedSource = this.resolvePath(sourcePath);
    const resolvedDest = this.resolvePath(destPath);

    await fs.rename(resolvedSource, resolvedDest);
  }

  /**
   * Create a readable stream for a file
   */
  createReadStream(filePath: string): Readable {
    const resolved = this.resolvePath(filePath);
    return createReadStream(resolved);
  }

  /**
   * Create a writable stream for a file
   */
  createWriteStream(filePath: string): NodeJS.WritableStream {
    const resolved = this.resolvePath(filePath);
    return createWriteStream(resolved);
  }

  /**
   * Simple glob pattern matching
   */
  private matchPattern(filename: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(filename);
  }

  /**
   * Get the base path of this file service
   */
  getBasePath(): string {
    return this.basePath;
  }
}
