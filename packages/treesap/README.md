# Treesap

Treesap is a Vite-first Node SSR framework.

This package provides:

- a small request/response app runtime for Node
- support for any fetch-compatible server app, including Hono
- router and middleware primitives
- static file serving with sensible cache defaults
- a `treesap/vite` entry for Vite dev and production builds
- explicit islands support built on `sapling-island`

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
  browserEntry: "src/treesap-client.ts",
  islands: {
    entries: {
      counter: "src/islands/counter.ts",
    },
  },
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

If your browser entry lives somewhere else, set `browserEntry` explicitly rather than relying on a fixed file location.

## Hono Server App

Treesap only requires that your server factory return an object with `fetch(request)`. That means a `Hono` app works without a second dev server:

```ts
/** @jsxImportSource hono/jsx */
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";

export function createServerApp() {
  const app = new Hono();

  app.use("/*", jsxRenderer());

  app.get("/", (c) => {
    return c.render(<h1>Hello from Hono</h1>);
  });

  app.get("/api/health", (c) => c.json({ ok: true }));

  return app;
}
```

In production, mount your own static middleware for `dist/client`, for example `@hono/node-server/serve-static`.

## Layout Assets

Render your browser assets from server layouts with `getViteBrowserAssets()`:

```tsx
import { getViteBrowserAssets } from "treesap/vite";

export default function BaseLayout(props: { children: string | object }) {
  const browserAssets = getViteBrowserAssets({
    devStyles: ["/src/styles/main.css"],
  });

  return (
    <html>
      <head>
        {browserAssets.styles.map((href) => (
          <link rel="stylesheet" href={href} />
        ))}
        {browserAssets.scripts.map((src) => (
          <script type="module" src={src}></script>
        ))}
      </head>
      <body>{props.children}</body>
    </html>
  );
}
```

Use `devStyles` when you want an eager stylesheet `<link>` during development to avoid a flash of unstyled content before the browser entry module loads.

## Islands

Register island client entries explicitly in `defineTreesapConfig()`:

```ts
import { defineTreesapConfig } from "treesap/vite";

export default defineTreesapConfig({
  appEntry: "src/server/app.tsx",
  browserEntry: "src/treesap-client.ts",
  islands: {
    entries: {
      counter: "src/islands/counter.ts",
    },
  },
});
```

Then render them from server JSX with `Island`:

```tsx
/** @jsxImportSource hono/jsx */
import { Island } from "treesap";

export function CounterSection() {
  return (
    <Island name="counter" loading="visible">
      <div>
        <button type="button" data-island-increment="">
          Increment
        </button>
        <span data-island-count="">0</span>
      </div>
    </Island>
  );
}
```

Island client modules should export a default mount function:

```ts
export default function mount(root: HTMLElement) {
  const button = root.querySelector("[data-island-increment]");
  const output = root.querySelector("[data-island-count]");
  let count = 0;

  button?.addEventListener("click", () => {
    count += 1;
    if (output) {
      output.textContent = String(count);
    }
  });
}
```

Recommended convention: keep island entries in `src/islands/`, but registration is explicit and no filesystem discovery is required.

## Exports

- `treesap`: `createApp`, `createRouter`, `serve`, `Context`, `cors`, `serveStatic`, `Island`
- `treesap/vite`: `defineTreesapConfig`, `getViteBrowserAssets`, `getViteEntryAssets`, `getViteModuleAsset`, `treesap`
