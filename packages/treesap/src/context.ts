import { renderToString } from "hono/jsx/dom/server";
import type { Child } from "hono/jsx";

export type Renderable = Child | string;
export type Renderer = (
  content: Renderable,
  ctx: Context,
  init?: ResponseInit
) => Response | Promise<Response>;

function applyResponseDefaults(
  base: { headers: Headers; status?: number },
  init?: ResponseInit
) {
  const headers = new Headers(base.headers);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return {
    status: init?.status ?? base.status,
    headers,
  };
}

export class Context {
  readonly url: URL;
  readonly var = new Map<string, unknown>();
  readonly res = {
    headers: new Headers(),
    status: undefined as number | undefined,
  };

  private renderer?: Renderer;
  private readonly params: Record<string, string>;

  readonly req: {
    raw: Request;
    url: string;
    json: <T = unknown>() => Promise<T>;
    text: () => Promise<string>;
    formData: () => Promise<FormData>;
    param: (name?: string) => string | Record<string, string> | undefined;
    header: (name: string) => string | undefined;
    query: (name?: string) => string | Record<string, string> | undefined;
  };

  constructor(readonly request: Request, params: Record<string, string> = {}) {
    this.url = new URL(request.url);
    this.params = params;
    this.req = {
      raw: request,
      url: request.url,
      json: <T = unknown>() => request.json() as Promise<T>,
      text: () => request.text(),
      formData: () => request.formData(),
      param: (name?: string) => {
        if (!name) {
          return { ...this.params };
        }

        return this.params[name];
      },
      header: (name: string) => request.headers.get(name) ?? undefined,
      query: (name?: string) => {
        if (!name) {
          return Object.fromEntries(this.url.searchParams.entries());
        }

        return this.url.searchParams.get(name) ?? undefined;
      },
    };
  }

  set<T>(key: string, value: T) {
    this.var.set(key, value);
  }

  get<T>(key: string) {
    return this.var.get(key) as T;
  }

  status(code: number) {
    this.res.status = code;
  }

  header(name: string, value: string) {
    this.res.headers.set(name, value);
  }

  json(data: unknown, init?: ResponseInit) {
    const responseInit = applyResponseDefaults(this.res, init);
    responseInit.headers.set("Content-Type", "application/json; charset=UTF-8");
    return new Response(JSON.stringify(data), responseInit);
  }

  text(value: string, init?: ResponseInit) {
    const responseInit = applyResponseDefaults(this.res, init);
    responseInit.headers.set("Content-Type", "text/plain; charset=UTF-8");
    return new Response(value, responseInit);
  }

  html(value: string, init?: ResponseInit) {
    const responseInit = applyResponseDefaults(this.res, init);
    responseInit.headers.set("Content-Type", "text/html; charset=UTF-8");
    return new Response(value, responseInit);
  }

  redirect(location: string, status = 302) {
    const responseInit = applyResponseDefaults(this.res, { status });
    responseInit.headers.set("Location", location);
    return new Response(null, responseInit);
  }

  setRenderer(renderer: Renderer) {
    this.renderer = renderer;
  }

  render(content: Renderable, init?: ResponseInit) {
    if (this.renderer) {
      return this.renderer(content, this, init);
    }

    if (typeof content === "string") {
      return this.html(content, init);
    }

    return this.html(renderToString(content), init);
  }
}
