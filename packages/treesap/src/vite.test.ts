import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, expect, test, vi } from "vitest";
import { getViteEntryAssets } from "./vite.ts";

beforeEach(() => {
  vi.unstubAllGlobals();
});

test("getViteEntryAssets resolves manifest entries from root-relative paths", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "treesap-vite-assets-"));
  const manifestDir = path.join(tempDir, "dist", "client", ".vite");

  await mkdir(manifestDir, { recursive: true });
  await writeFile(
    path.join(manifestDir, "manifest.json"),
    JSON.stringify({
      "src/www/entry-style.ts": {
        file: "assets/wwwStyle.js",
        src: "src/www/entry-style.ts",
        css: ["assets/wwwStyle.css"],
      },
    })
  );

  const previousCwd = process.cwd();
  process.chdir(tempDir);

  try {
    const assets = getViteEntryAssets({
      entry: "src/www/entry-style.ts",
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
      "src/www/entry-style.ts": {
        file: "assets/wwwStyle.js",
        src: "src/www/entry-style.ts",
        css: ["assets/wwwStyle.css"],
      },
    })
  );

  const previousCwd = process.cwd();
  process.chdir(tempDir);

  try {
    const assets = getViteEntryAssets({
      entry: "../www/entry-style.ts",
      mode: "production",
    });

    expect(assets.styles).toEqual(["/assets/wwwStyle.css"]);
    expect(assets.scripts).toEqual(["/assets/wwwStyle.js"]);
  } finally {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  }
});
