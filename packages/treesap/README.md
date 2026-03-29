# Treesap

Treesap is a Vite-first Node SSR framework.

This package provides:

- a small request/response app runtime for Node
- router and middleware primitives
- static file serving with sensible cache defaults
- a `treesap/vite` entry for Vite dev and production builds

## Install

```bash
npm install treesap vite hono
```

## Vite Config

```ts
import react from "@vitejs/plugin-react";
import { defineTreesapConfig } from "treesap/vite";

export default defineTreesapConfig({
  appEntry: "src/server/app.tsx",
  plugins: [react()],
});
```

## Server App

```ts
import { renderToString } from "hono/jsx/dom/server";
import { createApp } from "treesap";

export function createServerApp() {
  const app = createApp();

  app.get("/", (ctx) => {
    return ctx.html(renderToString(<h1>Hello</h1>));
  });

  return app;
}
```

Build with `vite build`, then run the server bundle with:

```bash
node dist/server/main.js
```

## Exports

- `treesap`: `createApp`, `createRouter`, `serve`, `Context`, `cors`, `serveStatic`
- `treesap/vite`: `defineTreesapConfig`, `getViteEntryAssets`, `treesap`
