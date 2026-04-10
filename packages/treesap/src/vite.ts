import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  build,
  defineConfig,
  mergeConfig,
  type Plugin,
  type PluginOption,
  type UserConfig,
  type ViteDevServer,
} from "vite";
import { sendNodeResponse, toWebRequest, type FetchApp } from "./node.ts";

interface ManifestEntry {
  file: string;
  src?: string;
  css?: string[];
}

export interface TreesapIslandsOptions {
  entries: Record<string, string>;
}

interface NormalizedTreesapIslandEntry {
  name: string;
  entry: string;
  absolutePath: string;
}

interface TreesapRuntimeEntry {
  entry: string;
  absolutePath: string;
}

export interface TreesapVitePluginOptions {
  appEntry: string;
  appFactoryExport?: string;
  appEntryPath?: string;
  browserEntry?: string;
  islands?: NormalizedTreesapIslandEntry[];
  islandRuntimeEntry?: TreesapRuntimeEntry;
  spaBase?: string;
  spaIndexHtml?: string;
  spaEntryModule?: string;
}

export interface DefineTreesapConfigOptions {
  appEntry: string;
  appFactoryExport?: string;
  serverEntry?: string;
  browserEntry?: string;
  islands?: TreesapIslandsOptions;
  plugins?: PluginOption[];
  vite?: UserConfig;
}

function resolveRuntimeMode() {
  const viteEnv = (import.meta as ImportMeta & {
    env?: { PROD?: boolean };
  }).env;

  if (viteEnv?.PROD === true || process.env.NODE_ENV === "production") {
    return "production";
  }

  return "development";
}

function normalizePublicPath(href: string, base: string) {
  if (href.startsWith("/")) {
    return href;
  }

  return `${base.replace(/\/$/, "")}/${href}`;
}

function resolveDefaultManifestPath() {
  const candidates = [
    path.resolve(process.cwd(), "dist/client/.vite/manifest.json"),
    path.resolve(process.cwd(), "static/.vite/manifest.json"),
    path.resolve(process.cwd(), "static/app/.vite/manifest.json"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

function normalizeManifestLookupPath(entry: string) {
  const normalized = path.posix.normalize(entry.replaceAll("\\", "/"));
  return normalized
    .replace(/^\/+/, "")
    .replace(/^(\.\.\/)+/, "")
    .replace(/^\.\//, "");
}

function stripQuery(id: string) {
  return id.replace(/\?.*$/, "");
}

function createDevEntryScriptPath(entry: string) {
  if (path.isAbsolute(entry)) {
    return `/@fs/${entry.replaceAll("\\", "/").replace(/^\/+/, "")}`;
  }

  return `/${normalizeManifestLookupPath(entry)}`;
}

function normalizeSpaBase(base: string) {
  if (!base.startsWith("/")) {
    return `/${base}`;
  }

  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function isFileRequest(pathname: string) {
  const lastSegment = pathname.split("/").at(-1) ?? "";
  return lastSegment.includes(".");
}

export function isViteRequest(pathname: string) {
  return (
    pathname === "/@vite/client" ||
    pathname.startsWith("/@") ||
    pathname.startsWith("/@fs/") ||
    pathname.startsWith("/@id/") ||
    pathname.startsWith("/@vite/") ||
    pathname.startsWith("/node_modules/") ||
    pathname.startsWith("/src/")
  );
}

function maybeRewriteSpaAssetRequest(url: string, spaBase: string) {
  const currentUrl = new URL(url, "http://treesap.local");
  if (!currentUrl.pathname.startsWith(`${spaBase}/`)) {
    return null;
  }

  const strippedPathname = currentUrl.pathname.slice(spaBase.length) || "/";

  if (!isViteRequest(strippedPathname) && !isFileRequest(strippedPathname)) {
    return null;
  }

  currentUrl.pathname = strippedPathname;
  return `${currentUrl.pathname}${currentUrl.search}`;
}

function isSpaShellRequest(pathname: string, spaBase: string) {
  if (pathname === spaBase || pathname === `${spaBase}/`) {
    return true;
  }

  if (!pathname.startsWith(`${spaBase}/`)) {
    return false;
  }

  const suffix = pathname.slice(spaBase.length + 1);
  return suffix.length > 0 && !suffix.split("/").at(-1)?.includes(".");
}

async function renderSpaShell(
  server: ViteDevServer,
  pathname: string,
  options: Required<Pick<TreesapVitePluginOptions, "spaIndexHtml" | "spaEntryModule">>
) {
  const templatePath = path.resolve(server.config.root, options.spaIndexHtml);
  const template = (await readFile(templatePath, "utf-8")).replace(
    "./main.tsx",
    options.spaEntryModule
  );
  return server.transformIndexHtml(pathname, template);
}

async function loadTreesapApp(server: ViteDevServer, entry: string, exportName: string) {
  const module = await server.ssrLoadModule(entry);
  const createApp = module[exportName];

  if (typeof createApp !== "function") {
    throw new Error(
      `Treesap could not find exported app factory "${exportName}" in ${entry}.`
    );
  }

  const app = await createApp();
  if (!app || typeof app.fetch !== "function") {
    throw new Error(
      `Treesap app factory "${exportName}" in ${entry} did not return a fetch-compatible app. Return Treesap's createApp() result or any object with fetch(), such as a Hono app.`
    );
  }

  return app as FetchApp;
}

function resolveConfigRoot(viteConfig?: UserConfig) {
  return path.resolve(viteConfig?.root ?? process.cwd());
}

function resolveBrowserEntry(options: DefineTreesapConfigOptions) {
  const root = resolveConfigRoot(options.vite);
  const browserEntry = options.browserEntry ?? "src/treesap-client.ts";
  const absolutePath = path.resolve(root, browserEntry);

  if (!existsSync(absolutePath)) {
    if (options.browserEntry) {
      throw new Error(
        `Treesap could not find browserEntry "${options.browserEntry}". Check the path or update defineTreesapConfig({ browserEntry }).`
      );
    }

    throw new Error(
      'Treesap could not find the default browser entry "src/treesap-client.ts". Set browserEntry in defineTreesapConfig(...) if your client entry lives elsewhere.'
    );
  }

  return {
    entry: normalizeManifestLookupPath(browserEntry),
    absolutePath,
  };
}

function resolveAppEntry(options: DefineTreesapConfigOptions) {
  const root = resolveConfigRoot(options.vite);

  return path.resolve(root, options.appEntry);
}

function resolveIslandEntries(
  options: DefineTreesapConfigOptions
): NormalizedTreesapIslandEntry[] {
  const root = resolveConfigRoot(options.vite);
  const rawEntries = options.islands?.entries ?? {};

  return Object.entries(rawEntries).map(([name, entry]) => {
    const normalizedName = name.trim();
    const normalizedEntry = entry.trim();

    if (!normalizedName) {
      throw new Error("Treesap islands entries must have a non-empty name.");
    }

    if (!normalizedEntry) {
      throw new Error(
        `Treesap island "${normalizedName}" must point to a non-empty entry path.`
      );
    }

    return {
      name: normalizedName,
      entry: normalizeManifestLookupPath(normalizedEntry),
      absolutePath: path.resolve(root, normalizedEntry),
    };
  });
}

function resolveIslandRuntimeEntry(
  options: DefineTreesapConfigOptions
): TreesapRuntimeEntry {
  const root = resolveConfigRoot(options.vite);
  const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(runtimeDir, "island-runtime.js"),
    path.resolve(runtimeDir, "island-runtime.ts"),
  ];

  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) {
    throw new Error("Treesap could not resolve its island runtime module.");
  }

  return {
    entry: normalizeManifestLookupPath(path.relative(root, resolved)),
    absolutePath: resolved,
  };
}

function resolveOptionalSpaEntry(options: DefineTreesapConfigOptions) {
  const root = resolveConfigRoot(options.vite);
  const defaultSpaEntry = path.resolve(root, "src/app/main.tsx");

  if (!existsSync(defaultSpaEntry)) {
    return null;
  }

  return {
    entry: "src/app/main.tsx",
    absolutePath: defaultSpaEntry,
  };
}

function createClientBuildInputs(options: DefineTreesapConfigOptions) {
  const browserEntry = resolveBrowserEntry(options);
  const islandEntries = resolveIslandEntries(options);
  const spaEntry = resolveOptionalSpaEntry(options);

  const input: Record<string, string> = {
    browser: browserEntry.absolutePath,
  };

  if (spaEntry) {
    input["spa"] = spaEntry.absolutePath;
  }

  islandEntries.forEach((island) => {
    input[`island-${island.name}`] = island.absolutePath;
  });

  if (islandEntries.length > 0) {
    input["treesap-island-runtime"] = resolveIslandRuntimeEntry(options).absolutePath;
  }

  return input;
}

function createTreesapDefineConfig(options: DefineTreesapConfigOptions) {
  const islandEntries = Object.fromEntries(
    resolveIslandEntries(options).map((entry) => [entry.name, entry.entry])
  );

  return {
    "globalThis.__TREESAP_ISLANDS__": JSON.stringify(islandEntries),
  };
}

function createTreesapSharedConfig(options: DefineTreesapConfigOptions): UserConfig {
  const root = resolveConfigRoot(options.vite);

  return mergeConfig(
    {
      appType: "custom",
      root,
      define: createTreesapDefineConfig(options),
      ssr: {
        noExternal: ["hono"],
      },
    },
    {
      ...(options.vite ?? {}),
      plugins: undefined,
    }
  );
}

function createTreesapDevConfig(options: DefineTreesapConfigOptions): UserConfig {
  const browserEntry = resolveBrowserEntry(options);

  return mergeConfig(createTreesapSharedConfig(options), {
    base: "/",
    plugins: [
      treesap({
        appEntry: options.appEntry,
        appFactoryExport: options.appFactoryExport,
        appEntryPath: resolveAppEntry(options),
        browserEntry: browserEntry.entry,
        islands: resolveIslandEntries(options),
        islandRuntimeEntry: resolveIslandRuntimeEntry(options),
      }),
      ...(options.plugins ?? []),
    ],
  });
}

function createTreesapClientBuildConfig(
  options: DefineTreesapConfigOptions
): UserConfig {
  const root = resolveConfigRoot(options.vite);
  const browserEntry = resolveBrowserEntry(options);

  return mergeConfig(createTreesapSharedConfig(options), {
    base: "/",
    publicDir: path.resolve(root, "public"),
    plugins: [
      treesap({
        appEntry: options.appEntry,
        appFactoryExport: options.appFactoryExport,
        appEntryPath: resolveAppEntry(options),
        browserEntry: browserEntry.entry,
        islands: resolveIslandEntries(options),
        islandRuntimeEntry: resolveIslandRuntimeEntry(options),
      }),
      ...(options.plugins ?? []),
    ],
    build: {
      manifest: true,
      outDir: "dist/client",
      emptyOutDir: true,
      rolldownOptions: {
        input: createClientBuildInputs(options),
        preserveEntrySignatures: "exports-only",
      },
    },
  });
}

function createTreesapServerBuildConfig(
  options: DefineTreesapConfigOptions
): UserConfig {
  const browserEntry = resolveBrowserEntry(options);

  return mergeConfig(createTreesapSharedConfig(options), {
    base: "/",
    publicDir: false,
    plugins: [
      treesap({
        appEntry: options.appEntry,
        appFactoryExport: options.appFactoryExport,
        appEntryPath: resolveAppEntry(options),
        browserEntry: browserEntry.entry,
        islands: resolveIslandEntries(options),
        islandRuntimeEntry: resolveIslandRuntimeEntry(options),
      }),
      ...(options.plugins ?? []),
    ],
    build: {
      ssr: options.serverEntry ?? "src/main.tsx",
      target: "node22",
      outDir: "dist/server",
      sourcemap: true,
      emptyOutDir: false,
      rolldownOptions: {
        external: [
          "fs",
          "path",
          "url",
          "module",
          "crypto",
          "stream",
          /^node:/,
        ],
        output: {
          format: "esm",
        },
      },
    },
    oxc: {
      jsx: {
        runtime: "automatic",
        importSource: "hono/jsx",
      },
    },
  });
}

export function treesap(options: TreesapVitePluginOptions): Plugin {
  const spaBase = normalizeSpaBase(options.spaBase ?? "/app");
  const appFactoryExport = options.appFactoryExport ?? "createServerApp";
  const spaIndexHtml = options.spaIndexHtml ?? "src/app/index.html";
  const spaEntryModule = options.spaEntryModule ?? "/src/app/main.tsx";
  const appEntryPath = options.appEntryPath ? path.resolve(options.appEntryPath) : null;
  const islandEntries = options.islands ?? [];
  const islandRuntimeEntry = options.islandRuntimeEntry ?? null;

  return {
    name: "treesap",
    transform(code, id) {
      const hasBrowserEntry = Boolean(options.browserEntry);
      const hasIslands = islandEntries.length > 0;

      if (!hasBrowserEntry && !hasIslands) {
        return null;
      }

      const moduleId = path.resolve(stripQuery(id));
      const injectedGlobals = [
        hasIslands
          ? `globalThis.__TREESAP_ISLANDS__ = ${JSON.stringify(
              Object.fromEntries(islandEntries.map((entry) => [entry.name, entry.entry]))
            )};`
          : null,
        hasBrowserEntry
          ? `globalThis.__TREESAP_BROWSER_ENTRY__ = ${JSON.stringify(
              normalizeManifestLookupPath(options.browserEntry)
            )};`
          : null,
        hasIslands && islandRuntimeEntry
          ? `globalThis.__TREESAP_ISLAND_RUNTIME_ENTRY__ = ${JSON.stringify(
              islandRuntimeEntry.entry
            )};`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      if (appEntryPath && moduleId === appEntryPath) {
        const alreadyInjected =
          (!hasIslands || code.includes("globalThis.__TREESAP_ISLANDS__")) &&
          (!hasBrowserEntry || code.includes("globalThis.__TREESAP_BROWSER_ENTRY__")) &&
          (!hasIslands ||
            code.includes("globalThis.__TREESAP_ISLAND_RUNTIME_ENTRY__"));

        if (alreadyInjected) {
          return null;
        }

        return {
          code: `${injectedGlobals}\n${code}`,
          map: null,
        };
      }

      return null;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rewrittenUrl = maybeRewriteSpaAssetRequest(req.url ?? "/", spaBase);
        if (rewrittenUrl) {
          req.url = rewrittenUrl;
        }

        const pathname = new URL(req.url ?? "/", "http://treesap.local").pathname;

        try {
          if (isViteRequest(pathname)) {
            next();
            return;
          }

          if (isSpaShellRequest(pathname, spaBase)) {
            const html = await renderSpaShell(server, pathname, {
              spaIndexHtml,
              spaEntryModule,
            });
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html; charset=UTF-8");
            res.end(html);
            return;
          }

          const app = await loadTreesapApp(server, options.appEntry, appFactoryExport);
          const request = await toWebRequest(req);
          const response = await app.fetch(request);
          await sendNodeResponse(res, response);
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          console.error(error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain; charset=UTF-8");
          res.end("Internal Server Error");
        }
      });
    },
  };
}

export function defineTreesapConfig(options: DefineTreesapConfigOptions) {
  return defineConfig(({ command }) => {
    if (command === "serve") {
      return createTreesapDevConfig(options);
    }

    return {
      ...createTreesapSharedConfig(options),
      base: "/",
      publicDir: false,
      builder: {
        async buildApp(builder) {
          await build({
            ...createTreesapClientBuildConfig(options),
            configFile: false,
          });

          await build({
            ...createTreesapServerBuildConfig(options),
            configFile: false,
          });

          Object.values(builder.environments).forEach((environment) => {
            environment.isBuilt = true;
          });
        },
      },
    };
  });
}

export function getViteEntryAssets(options: {
  entry: string;
  mode?: string;
  devScripts?: string[];
  devStyles?: string[];
  manifestPath?: string;
  base?: string;
}) {
  const mode = options.mode ?? resolveRuntimeMode();
  if (mode !== "production") {
    const scripts = Array.from(
      new Set([
        ...(options.devScripts ?? []),
        createDevEntryScriptPath(options.entry),
      ])
    );

    return {
      scripts,
      styles: options.devStyles ?? [],
    };
  }

  const manifestPath = options.manifestPath ?? resolveDefaultManifestPath();
  const base = options.base ?? "/";

  if (!existsSync(manifestPath)) {
    return {
      scripts: [] as string[],
      styles: [] as string[],
    };
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as Record<
    string,
    ManifestEntry
  >;
  const lookupEntry = normalizeManifestLookupPath(options.entry);

  const entry =
    manifest[options.entry] ??
    Object.entries(manifest).find(([key, value]) => {
      const normalizedKey = normalizeManifestLookupPath(key);
      const normalizedSrc = value.src
        ? normalizeManifestLookupPath(value.src)
        : undefined;

      return (
        normalizedKey === lookupEntry ||
        normalizedKey.endsWith(lookupEntry) ||
        lookupEntry.endsWith("/" + normalizedKey) ||
        normalizedSrc === lookupEntry ||
        normalizedSrc?.endsWith(lookupEntry) === true ||
        (normalizedSrc != null && lookupEntry.endsWith("/" + normalizedSrc))
      );
    })?.[1];

  return {
    scripts: entry?.file ? [normalizePublicPath(entry.file, base)] : [],
    styles: (entry?.css ?? []).map((href) => normalizePublicPath(href, base)),
  };
}

function getRegisteredBrowserEntry() {
  return globalThis.__TREESAP_BROWSER_ENTRY__ ?? null;
}

export function getViteBrowserAssets(options?: {
  mode?: string;
  manifestPath?: string;
  base?: string;
  devStyles?: string[];
}) {
  const entry = getRegisteredBrowserEntry();
  if (!entry) {
    throw new Error(
      "Treesap browser entry is not registered. Set browserEntry in defineTreesapConfig(...) or restart Vite."
    );
  }

  return getViteEntryAssets({
    entry,
    mode: options?.mode,
    manifestPath: options?.manifestPath,
    base: options?.base,
    devScripts: ["/@vite/client"],
    devStyles: options?.devStyles ?? [],
  });
}

export function getViteModuleAsset(options: {
  entry: string;
  mode?: string;
  manifestPath?: string;
  base?: string;
}) {
  return (
    getViteEntryAssets({
      entry: options.entry,
      mode: options.mode,
      manifestPath: options.manifestPath,
      base: options.base,
      devScripts: [createDevEntryScriptPath(options.entry)],
      devStyles: [],
    }).scripts[0] ?? null
  );
}
