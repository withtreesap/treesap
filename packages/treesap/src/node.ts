import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Readable } from "node:stream";

export async function toWebRequest(req: IncomingMessage) {
  const protocol = req.headers["x-forwarded-proto"] ?? "http";
  const host = req.headers.host ?? "localhost:8080";
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : (Readable.toWeb(req) as ReadableStream<Uint8Array>);

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers: req.headers as HeadersInit,
    body,
  };

  if (body) {
    init.duplex = "half";
  }

  return new Request(url, init);
}

export async function sendNodeResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const stream = Readable.fromWeb(response.body as any);
  stream.on("error", (error) => {
    res.destroy(error);
  });
  stream.pipe(res);
}

export function serve(options: {
  fetch: (request: Request) => Response | Promise<Response>;
  port: number;
}) {
  const server = createServer(async (req, res) => {
    try {
      const request = await toWebRequest(req);
      const response = await options.fetch(request);
      await sendNodeResponse(res, response);
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=UTF-8");
      res.end("Internal Server Error");
    }
  });

  server.listen(options.port);
  return server;
}
