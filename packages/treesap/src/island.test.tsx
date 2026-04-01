/** @jsxImportSource hono/jsx */
import { renderToString } from "hono/jsx/dom/server";
import { afterEach, expect, test } from "vitest";
import { Island } from "./island.tsx";

afterEach(() => {
  delete globalThis.__TREESAP_ISLANDS__;
  delete globalThis.__TREESAP_ISLAND_RUNTIME_ENTRY__;
});

test("Island renders sapling-island markup with a module bootstrap", () => {
  globalThis.__TREESAP_ISLANDS__ = {
    counter: "src/islands/counter.ts",
  };
  globalThis.__TREESAP_ISLAND_RUNTIME_ENTRY__ =
    "/virtual/treesap-island-runtime.js";

  const html = renderToString(
    <Island name="counter" loading="visible" timeout={2500}>
      <button type="button">Increment</button>
    </Island>
  );

  expect(html).toContain("<sapling-island");
  expect(html).toContain(
    '<script type="module" src="/@fs/virtual/treesap-island-runtime.js"></script>'
  );
  expect(html).toContain('loading="visible"');
  expect(html).toContain('timeout="2500"');
  expect(html).toContain('data-treesap-island="counter"');
  expect(html).toContain("/src/islands/counter.ts");
  expect(html).toContain("data-treesap-island-root");
  expect(html.indexOf("data-treesap-island-root")).toBeLessThan(html.indexOf("<template>"));
});

test("Island throws when the requested island is not registered", () => {
  expect(() =>
    renderToString(
      <Island name="missing">
        <div>Missing island</div>
      </Island>
    )
  ).toThrow(/is not registered/);
});

test("Island throws when the runtime entry was not injected", () => {
  globalThis.__TREESAP_ISLANDS__ = {
    counter: "src/islands/counter.ts",
  };

  expect(() =>
    renderToString(
      <Island name="counter">
        <div>Counter</div>
      </Island>
    )
  ).toThrow(/runtime is not registered/);
});
