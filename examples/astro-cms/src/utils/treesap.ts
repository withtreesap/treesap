import { Hono } from "@hono/hono";
import { Treesap } from "@treesap/treesap";

export const kv = await Deno.openKv();
const app = new Hono();

export const treesap = new Treesap({
  app,
  db: kv,
});