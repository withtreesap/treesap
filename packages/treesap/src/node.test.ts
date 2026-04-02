import { expect, expectTypeOf, test } from "vitest";
import { Hono } from "hono";
import type { FetchApp } from "./node.ts";

test("Hono apps satisfy Treesap's fetch-app contract", async () => {
  const app = new Hono();
  app.get("/api/health", (c) => c.json({ ok: true, runtime: "hono" }));

  expectTypeOf(app).toMatchTypeOf<FetchApp>();

  const response = await app.fetch(new Request("http://treesap.test/api/health"));

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    ok: true,
    runtime: "hono",
  });
});
