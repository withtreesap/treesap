import { Hono } from "@hono/hono";
import { Treesap } from "@treesap/treesap";
import type { APIRoute } from 'astro';
import type { Collection } from "@treesap/treesap";

export const app = new Hono().basePath("/api");
export const kv = await Deno.openKv();

export const treesap = new Treesap({
  app,
  db: kv,
});

export const ALL: APIRoute = (context) => treesap.fetch(context.request);

export type App = typeof app;
