# Treesap Framework Reference

## Package Mental Model

- `treesap` provides the Node SSR runtime, router/app helpers, middleware, and `Island`.
- `treesap/vite` provides `defineTreesapConfig()` and browser asset helpers.
- Server apps can use Treesap's `createApp()` or any Fetch-compatible app such as `Hono`.
- Island hydration is explicit: register island client entries in Vite config and render matching `<Island name="...">` wrappers from server JSX.

## Vite Config

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

Use `browserEntry` explicitly when the client entry is not `src/treesap-client.ts`.

## Server App

```ts
import { renderToString } from "hono/jsx/dom/server";
import { createApp } from "treesap";

export function createServerApp() {
  const app = createApp();

  app.use("*", async (ctx, next) => {
    ctx.setRenderer(async (content, currentCtx, init) => {
      const markup = typeof content === "string" ? content : renderToString(content);
      return currentCtx.html(`<!DOCTYPE html>${markup}`, init);
    });
    return next();
  });

  app.get("/", (ctx) => ctx.render(<h1>Hello</h1>));
  return app;
}
```

## Hono Server App

```tsx
/** @jsxImportSource hono/jsx */
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";

export function createServerApp() {
  const app = new Hono();
  app.use("/*", jsxRenderer());
  app.get("/", (c) => c.render(<h1>Hello from Hono</h1>));
  app.get("/api/health", (c) => c.json({ ok: true }));
  return app;
}
```

## Browser Assets in Layouts

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

## Islands

Server render:

```tsx
/** @jsxImportSource hono/jsx */
import { Island } from "treesap";

export function CounterSection() {
  return (
    <Island name="counter" loading="visible">
      <button type="button" data-island-increment="">
        Increment
      </button>
      <span data-island-count="">0</span>
    </Island>
  );
}
```

Client entry:

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

## Production Notes

- Build with `vite build`, then run the server bundle with `node dist/server/main.js`.
- In production Hono apps, mount static middleware for `dist/client` yourself.
- Existing examples under `examples/site/` are a reliable source of app structure and conventions.
