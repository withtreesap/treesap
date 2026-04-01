import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, expect, test, vi } from "vitest";
import {
  getViteBrowserAssets,
  getViteEntryAssets,
  getViteModuleAsset,
} from "./vite.ts";

beforeEach(() => {
  vi.unstubAllGlobals();
  delete globalThis.__TREESAP_BROWSER_ENTRY__;
});

test("getViteEntryAssets resolves manifest entries from root-relative paths", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "treesap-vite-assets-"));
  const manifestDir = path.join(tempDir, "dist", "client", ".vite");

  await mkdir(manifestDir, { recursive: true });
  await writeFile(
    path.join(manifestDir, "manifest.json"),
    JSON.stringify({
      "src/treesap-client.ts": {
        file: "assets/wwwStyle.js",
        src: "src/treesap-client.ts",
        css: ["assets/wwwStyle.css"],
      },
    })
  );

  const previousCwd = process.cwd();
  process.chdir(tempDir);

  try {
    const assets = getViteEntryAssets({
      entry: "src/treesap-client.ts",
      mode: "production",
    });

    expect(assets.styles).toEqual(["/assets/wwwStyle.css"]);
    expect(assets.scripts).toEqual(["/assets/wwwStyle.js"]);
  } finally {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("getViteEntryAssets tolerates relative entry paths", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "treesap-vite-relative-"));
  const manifestDir = path.join(tempDir, "dist", "client", ".vite");

  await mkdir(manifestDir, { recursive: true });
  await writeFile(
    path.join(manifestDir, "manifest.json"),
    JSON.stringify({
      "src/treesap-client.ts": {
        file: "assets/wwwStyle.js",
        src: "src/treesap-client.ts",
        css: ["assets/wwwStyle.css"],
      },
    })
  );

  const previousCwd = process.cwd();
  process.chdir(tempDir);

  try {
    const assets = getViteEntryAssets({
      entry: "./src/treesap-client.ts",
      mode: "production",
    });

    expect(assets.styles).toEqual(["/assets/wwwStyle.css"]);
    expect(assets.scripts).toEqual(["/assets/wwwStyle.js"]);
  } finally {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("getViteEntryAssets includes the entry module in development", () => {
  const assets = getViteEntryAssets({
    entry: "src/treesap-client.ts",
    mode: "development",
    devScripts: ["/@vite/client"],
    devStyles: ["/src/styles/main.css"],
  });

  expect(assets.scripts).toEqual(["/@vite/client", "/src/treesap-client.ts"]);
  expect(assets.styles).toEqual(["/src/styles/main.css"]);
});

test("getViteBrowserAssets resolves the registered browser entry in development", () => {
  globalThis.__TREESAP_BROWSER_ENTRY__ = "src/www/treesap-client.ts";

  const assets = getViteBrowserAssets({
    mode: "development",
    devStyles: ["/src/www/styles/main.css"],
  });

  expect(assets.scripts).toEqual(["/@vite/client", "/src/www/treesap-client.ts"]);
  expect(assets.styles).toEqual(["/src/www/styles/main.css"]);
});

test("getViteBrowserAssets throws when the browser entry was not registered", () => {
  expect(() => getViteBrowserAssets()).toThrow(/browser entry is not registered/);
});

test("getViteEntryAssets uses /@fs for absolute dev entries", () => {
  const assets = getViteEntryAssets({
    entry: "/Users/example/project/node_modules/treesap/dist/island-runtime.js",
    mode: "development",
  });

  expect(assets.scripts).toEqual([
    "/@fs/Users/example/project/node_modules/treesap/dist/island-runtime.js",
  ]);
});

test("getViteModuleAsset resolves a single module script from the manifest", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "treesap-vite-module-"));
  const manifestDir = path.join(tempDir, "dist", "client", ".vite");

  await mkdir(manifestDir, { recursive: true });
  await writeFile(
    path.join(manifestDir, "manifest.json"),
    JSON.stringify({
      "src/islands/counter.ts": {
        file: "assets/counter.js",
        src: "src/islands/counter.ts",
      },
    })
  );

  const previousCwd = process.cwd();
  process.chdir(tempDir);

  try {
    const asset = getViteModuleAsset({
      entry: "src/islands/counter.ts",
      mode: "production",
    });

    expect(asset).toBe("/assets/counter.js");
  } finally {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  }
});
