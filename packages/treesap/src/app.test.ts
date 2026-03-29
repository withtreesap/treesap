import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { createApp, createRouter } from "./app.ts";
import { serveStatic } from "./middleware/serve-static.ts";

test("root routes stay exact while sibling routes and trailing slashes still resolve", async () => {
  const app = createApp();

  app.get("/", (ctx) => ctx.text("home"));
  app.get("/terms", (ctx) => ctx.text("terms"));

  const rootResponse = await app.fetch("http://treesap.test/");
  expect(await rootResponse.text()).toBe("home");
  expect(rootResponse.status).toBe(200);

  const termsResponse = await app.fetch("http://treesap.test/terms");
  expect(await termsResponse.text()).toBe("terms");
  expect(termsResponse.status).toBe(200);

  const trailingSlashResponse = await app.fetch("http://treesap.test/terms/");
  expect(await trailingSlashResponse.text()).toBe("terms");
  expect(trailingSlashResponse.status).toBe(200);
});

test("mounted routers preserve named params", async () => {
  const app = createApp();
  const users = createRouter();

  users.get("/:userId", (ctx) => ctx.text(String(ctx.req.param("userId"))));

  app.route("/users", users);

  const response = await app.fetch("http://treesap.test/users/alice");

  expect(response.status).toBe(200);
  expect(await response.text()).toBe("alice");
});

test("middleware ordering wraps route handlers predictably", async () => {
  const app = createApp();
  const order: string[] = [];

  app.use("*", async (_ctx, next) => {
    order.push("global:before");
    const response = await next();
    order.push("global:after");
    return response;
  });

  app.use("/users/*", async (_ctx, next) => {
    order.push("users:before");
    const response = await next();
    order.push("users:after");
    return response;
  });

  app.get("/users/:userId", (ctx) => {
    order.push("handler");
    return ctx.text(String(ctx.req.param("userId")));
  });

  const response = await app.fetch("http://treesap.test/users/alice");

  expect(response.status).toBe(200);
  expect(await response.text()).toBe("alice");
  expect(order).toEqual([
    "global:before",
    "users:before",
    "handler",
    "users:after",
    "global:after",
  ]);
});

test("custom notFound handlers run after matching middleware", async () => {
  const app = createApp();

  app.use("*", async (ctx, next) => {
    ctx.header("x-treesap", "middleware");
    return next();
  });

  app.notFound((ctx) => ctx.text(`missing:${ctx.url.pathname}`, { status: 404 }));

  const response = await app.fetch("http://treesap.test/missing");

  expect(response.status).toBe(404);
  expect(response.headers.get("x-treesap")).toBe("middleware");
  expect(await response.text()).toBe("missing:/missing");
});

test("html responses default to must-revalidate caching", async () => {
  const app = createApp();

  app.get("/", (ctx) => ctx.html("<h1>Hello</h1>"));

  const response = await app.fetch("http://treesap.test/");

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe(
    "public, max-age=0, must-revalidate"
  );
});

test("explicit html cache headers are preserved", async () => {
  const app = createApp();

  app.get("/", (ctx) =>
    ctx.html("<h1>Hello</h1>", {
      headers: {
        "Cache-Control": "private, no-store",
      },
    })
  );

  const response = await app.fetch("http://treesap.test/");

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});

test("static middleware serves in-root files and ignores path traversal", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "treesap-static-"));
  const publicDir = path.join(tempDir, "public");

  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(tempDir, "secret.txt"), "secret");
  await writeFile(path.join(publicDir, "hello.txt"), "hello");

  try {
    const app = createApp();
    app.use("/*", serveStatic({ root: publicDir }));
    app.notFound((ctx) => ctx.text("missing", { status: 404 }));

    const fileResponse = await app.fetch("http://treesap.test/hello.txt");
    expect(fileResponse.status).toBe(200);
    expect(await fileResponse.text()).toBe("hello");

    const blockedResponse = await app.fetch("http://treesap.test/%2e%2e/secret.txt");
    expect(blockedResponse.status).toBe(404);
    expect(await blockedResponse.text()).toBe("missing");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("createApp serves files from public automatically", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "treesap-public-"));
  const publicDir = path.join(tempDir, "public");

  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, "robots.txt"), "User-agent: *");

  try {
    const app = createApp({ rootDir: tempDir });

    const response = await app.fetch("http://treesap.test/robots.txt");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=UTF-8");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=604800, stale-while-revalidate=86400"
    );
    expect(await response.text()).toBe("User-agent: *");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("public files win over routes when both exist", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "treesap-public-route-"));
  const publicDir = path.join(tempDir, "public");

  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, "hello.txt"), "from-public");

  try {
    const app = createApp({ rootDir: tempDir });
    app.get("/hello.txt", (ctx) => ctx.text("from-route"));

    const response = await app.fetch("http://treesap.test/hello.txt");

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("from-public");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("public serving can be disabled per app", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "treesap-no-public-"));
  const publicDir = path.join(tempDir, "public");

  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, "hello.txt"), "from-public");

  try {
    const app = createApp({ rootDir: tempDir, publicDir: false });
    app.notFound((ctx) => ctx.text(`missing:${ctx.url.pathname}`, { status: 404 }));

    const response = await app.fetch("http://treesap.test/hello.txt");

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("missing:/hello.txt");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("createApp falls back to dist/client when public is absent", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "treesap-dist-client-"));
  const clientDir = path.join(tempDir, "dist", "client");

  await mkdir(clientDir, { recursive: true });
  await writeFile(path.join(clientDir, "robots.txt"), "built-client");

  try {
    const app = createApp({ rootDir: tempDir });
    const response = await app.fetch("http://treesap.test/robots.txt");

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("built-client");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("built hashed assets get immutable cache headers", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "treesap-immutable-"));
  const clientAssetsDir = path.join(tempDir, "dist", "client", "assets");

  await mkdir(clientAssetsDir, { recursive: true });
  await writeFile(
    path.join(clientAssetsDir, "app-abcdef12.css"),
    "body { color: red; }"
  );

  try {
    const app = createApp({ rootDir: tempDir });
    const response = await app.fetch("http://treesap.test/assets/app-abcdef12.css");

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable"
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
