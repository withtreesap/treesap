/// <reference lib="deno.unstable" />

import { Hono } from "@hono/hono";
import { Treesap } from "@treesap/treesap";

export const app = new Hono().basePath("/api");

export const kv = await Deno.openKv();


export const treesap = new Treesap({
  app,
  db: kv,
});
