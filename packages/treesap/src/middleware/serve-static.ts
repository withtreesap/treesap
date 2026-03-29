import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Handler } from "../app.ts";

const MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".css": "text/css; charset=UTF-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".md": "text/markdown; charset=UTF-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=UTF-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=UTF-8",
};

function getContentType(filePath: string) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function hasBuildHash(filePath: string) {
  const extension = path.extname(filePath);
  const basename = path.basename(filePath, extension);
  return /(?:^|[.-])[A-Za-z0-9_-]{8,}$/.test(basename);
}

function getCacheControl(filePath: string, pathname: string) {
  if (path.extname(filePath).toLowerCase() === ".html") {
    return "public, max-age=0, must-revalidate";
  }

  if (pathname.includes("/assets/") && hasBuildHash(filePath)) {
    return "public, max-age=31536000, immutable";
  }

  return "public, max-age=604800, stale-while-revalidate=86400";
}

export function serveStatic(options: {
  root: string;
  cacheControl?:
    | string
    | false
    | ((filePath: string, pathname: string) => string | undefined);
}): Handler {
  const basePath = path.resolve(options.root);

  return async (ctx, next) => {
    if (ctx.req.raw.method !== "GET" && ctx.req.raw.method !== "HEAD") {
      return next();
    }

    const pathname = decodeURIComponent(ctx.url.pathname);
    const relativePath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    const filePath = path.resolve(basePath, relativePath);

    if (filePath !== basePath && !filePath.startsWith(`${basePath}${path.sep}`)) {
      return next();
    }

    try {
      const file = await readFile(filePath);
      const cacheControl =
        typeof options.cacheControl === "function"
          ? options.cacheControl(filePath, pathname)
          : options.cacheControl;

      const headers: Record<string, string> = {
        "Content-Type": getContentType(filePath),
      };

      if (cacheControl !== false) {
        headers["Cache-Control"] = cacheControl ?? getCacheControl(filePath, pathname);
      }

      return new Response(file, {
        headers,
      });
    } catch {
      return next();
    }
  };
}
