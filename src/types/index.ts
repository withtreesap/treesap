import { Hono } from "@hono/hono";

export interface TreesapOptions {
  app: Hono;
  db: Deno.Kv;
}

export interface Collection {
  slug: string;
  label: string;
  fields: Field[];
}

export interface Field {
  name: string;
  type: string;
  label: string;
  value: string;
}

export interface Global {
  slug: string;
  label: string;
  fields: Field[];
}

export interface CmsNavData {
  type: "collection" | "global";
  slug: string;
  label: string;
}       