import type { Handler } from "../app.ts";
import type { Context } from "../context.ts";

interface CorsOptions {
  origin?:
    | string
    | ((
        origin: string | undefined,
        ctx: Context
      ) => string | undefined | Promise<string | undefined>);
  allowHeaders?: string[];
  allowMethods?: string[];
  credentials?: boolean;
}

export function cors(options: CorsOptions = {}): Handler {
  return async (ctx, next) => {
    const requestOrigin = ctx.req.header("origin");
    const resolvedOrigin =
      typeof options.origin === "function"
        ? await options.origin(requestOrigin, ctx)
        : options.origin ?? requestOrigin;

    const headers = new Headers();

    if (resolvedOrigin) {
      headers.set("Access-Control-Allow-Origin", resolvedOrigin);
      headers.append("Vary", "Origin");
    }

    if (options.credentials) {
      headers.set("Access-Control-Allow-Credentials", "true");
    }

    if (options.allowHeaders?.length) {
      headers.set("Access-Control-Allow-Headers", options.allowHeaders.join(", "));
    }

    if (options.allowMethods?.length) {
      headers.set("Access-Control-Allow-Methods", options.allowMethods.join(", "));
    }

    if (ctx.request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers,
      });
    }

    const response = await next();
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
