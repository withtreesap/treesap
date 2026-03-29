import { existsSync } from "node:fs";
import path from "node:path";
import { Context } from "./context.ts";
import { serveStatic } from "./middleware/serve-static.ts";
import { compilePath, joinPaths, type CompiledPath } from "./path.ts";

export type Next = () => Promise<Response>;
export type HandlerResult = Response | void | Promise<Response | void>;
export type Handler = (ctx: Context, next: Next) => HandlerResult;

export interface CreateAppOptions {
  rootDir?: string;
  publicDir?: string | false;
}

function isProductionRuntime() {
  const viteEnv = (import.meta as ImportMeta & {
    env?: { PROD?: boolean };
  }).env;

  return viteEnv?.PROD === true || process.env.NODE_ENV === "production";
}

function resolveDefaultPublicRoot(rootDir: string) {
  const builtClientDir = path.resolve(rootDir, "dist/client");
  const sourcePublicDir = path.resolve(rootDir, "public");

  if (isProductionRuntime() && existsSync(builtClientDir)) {
    return builtClientDir;
  }

  if (existsSync(sourcePublicDir)) {
    return sourcePublicDir;
  }

  if (existsSync(builtClientDir)) {
    return builtClientDir;
  }

  return null;
}

interface MiddlewareRecord {
  path: string;
  matcher: CompiledPath;
  handler: Handler;
}

interface RouteRecord {
  path: string;
  methods: string[];
  matcher: CompiledPath;
  handlers: Handler[];
}

function applyResponseDefaults(response: Response) {
  const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (
    !contentType.startsWith("text/html") ||
    response.headers.has("Cache-Control")
  ) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function composeHandlers(
  handlers: Handler[],
  ctx: Context,
  finalNext: Next
) {
  let index = -1;

  async function dispatch(position: number): Promise<Response> {
    if (position <= index) {
      throw new Error("next() called multiple times");
    }

    index = position;

    const handler = handlers[position];
    if (!handler) {
      return finalNext();
    }

    let downstream: Response | undefined;
    const response = await handler(ctx, async () => {
      downstream = await dispatch(position + 1);
      return downstream;
    });

    if (response) {
      return response;
    }

    if (downstream) {
      return downstream;
    }

    return new Response(null, { status: 204 });
  }

  return dispatch(0);
}

export class ServerApp {
  private readonly frameworkMiddlewares: MiddlewareRecord[] = [];
  private readonly middlewares: MiddlewareRecord[] = [];
  private readonly routes: RouteRecord[] = [];
  private notFoundHandler: Handler = (ctx) =>
    ctx.text("Not Found", { status: 404 });

  constructor(options: CreateAppOptions = {}) {
    if (options.publicDir === false) {
      return;
    }

    const rootDir = path.resolve(options.rootDir ?? process.cwd());
    const staticRoot =
      typeof options.publicDir === "string"
        ? path.resolve(rootDir, options.publicDir)
        : resolveDefaultPublicRoot(rootDir);

    if (!staticRoot || !existsSync(staticRoot)) {
      return;
    }

    this.frameworkMiddlewares.push({
      path: "/*",
      matcher: compilePath("/*"),
      handler: serveStatic({ root: staticRoot }),
    });
  }

  use(pathOrHandler: string | Handler, ...handlers: Handler[]) {
    const path = typeof pathOrHandler === "string" ? pathOrHandler : "*";
    const list =
      typeof pathOrHandler === "string"
        ? handlers
        : [pathOrHandler, ...handlers];

    for (const handler of list) {
      this.middlewares.push({
        path,
        matcher: compilePath(path),
        handler,
      });
    }

    return this;
  }

  on(methods: string[] | readonly string[], path: string, ...handlers: Handler[]) {
    this.routes.push({
      path,
      methods: [...methods].map((method) => method.toUpperCase()),
      matcher: compilePath(path),
      handlers,
    });

    return this;
  }

  get(path: string, ...handlers: Handler[]) {
    return this.on(["GET"], path, ...handlers);
  }

  post(path: string, ...handlers: Handler[]) {
    return this.on(["POST"], path, ...handlers);
  }

  patch(path: string, ...handlers: Handler[]) {
    return this.on(["PATCH"], path, ...handlers);
  }

  delete(path: string, ...handlers: Handler[]) {
    return this.on(["DELETE"], path, ...handlers);
  }

  route(prefix: string, child: ServerApp) {
    child.middlewares.forEach((record) => {
      this.middlewares.push({
        path: joinPaths(prefix, record.path),
        matcher: compilePath(joinPaths(prefix, record.path)),
        handler: record.handler,
      });
    });

    child.routes.forEach((record) => {
      this.routes.push({
        path: joinPaths(prefix, record.path),
        methods: [...record.methods],
        matcher: compilePath(joinPaths(prefix, record.path)),
        handlers: [...record.handlers],
      });
    });

    return this;
  }

  mount(prefix: string, child: ServerApp) {
    return this.route(prefix, child);
  }

  notFound(handler: Handler) {
    this.notFoundHandler = handler;
    return this;
  }

  async fetch(request: Request | string | URL, init?: RequestInit) {
    const normalizedRequest =
      request instanceof Request ? request : new Request(request, init);
    const url = new URL(normalizedRequest.url);
    const method = normalizedRequest.method.toUpperCase();

    const middlewareStack = this.middlewares
      .filter((record) => record.matcher.test(url.pathname))
      .concat(
        this.frameworkMiddlewares.filter((record) =>
          record.matcher.test(url.pathname)
        )
      )
      .map((record) => record.handler);

    const route = this.routes.find((record) => {
      if (!record.methods.includes(method) && !record.methods.includes("ALL")) {
        return false;
      }

      return Boolean(record.matcher.test(url.pathname));
    });

    const params = route?.matcher.test(url.pathname)?.params ?? {};
    const ctx = new Context(normalizedRequest, params);
    const notFound: Next = async () => {
      const response = await this.notFoundHandler(
        ctx,
        async () => new Response(null, { status: 404 })
      );
      if (response instanceof Response) {
        return response;
      }

      return new Response(null, { status: 404 });
    };

    if (!route) {
      const response = await composeHandlers(middlewareStack, ctx, notFound);
      return applyResponseDefaults(response);
    }

    const handlers = [...middlewareStack, ...route.handlers];
    const response = await composeHandlers(handlers, ctx, notFound);
    return applyResponseDefaults(response);
  }
}

export function createApp(options?: CreateAppOptions) {
  return new ServerApp(options);
}

export function createRouter() {
  return new ServerApp({ publicDir: false });
}
