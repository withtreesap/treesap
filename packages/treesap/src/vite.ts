import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  build,
  defineConfig,
  mergeConfig,
  type Plugin,
  type PluginOption,
  type UserConfig,
  type ViteDevServer,
} from "vite";
import { sendNodeResponse, toWebRequest } from "./node.ts";

interface ManifestEntry {
  file: string;
  src?: string;
  css?: string[];
}

export interface TreesapVitePluginOptions {
  appEntry: string;
  appFactoryExport?: string;
  spaBase?: string;
  spaIndexHtml?: string;
  spaEntryModule?: string;
}

export interface DefineTreesapConfigOptions {
  appEntry: string;
  appFactoryExport?: string;
  serverEntry?: string;
  browserEntry?: string;
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
      `Treesap app factory "${exportName}" in ${entry} did not return an object with fetch().`
    );
  }

  return app as { fetch(request: Request): Response | Promise<Response> };
}

function resolveConfigRoot(viteConfig?: UserConfig) {
  return path.resolve(viteConfig?.root ?? process.cwd());
}

function createTreesapSharedConfig(options: DefineTreesapConfigOptions): UserConfig {
  const root = resolveConfigRoot(options.vite);

  return mergeConfig(
    {
      appType: "custom",
      root,
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
  return mergeConfig(createTreesapSharedConfig(options), {
    base: "/",
    plugins: [
      treesap({
        appEntry: options.appEntry,
        appFactoryExport: options.appFactoryExport,
      }),
      ...(options.plugins ?? []),
    ],
  });
}

function createTreesapClientBuildConfig(
  options: DefineTreesapConfigOptions
): UserConfig {
  const root = resolveConfigRoot(options.vite);
  const browserEntry = options.browserEntry ?? "src/www/entry-style.ts";

  return mergeConfig(createTreesapSharedConfig(options), {
    base: "/",
    publicDir: path.resolve(root, "public"),
    plugins: [...(options.plugins ?? [])],
    build: {
      manifest: true,
      outDir: "dist/client",
      emptyOutDir: true,
      rolldownOptions: {
        input: {
          browser: path.resolve(root, browserEntry),
        },
      },
    },
  });
}

function createTreesapServerBuildConfig(
  options: DefineTreesapConfigOptions
): UserConfig {
  return mergeConfig(createTreesapSharedConfig(options), {
    base: "/",
    publicDir: false,
    plugins: [...(options.plugins ?? [])],
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

  return {
    name: "treesap",
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
    return {
      scripts: options.devScripts ?? [],
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
        normalizedSrc === lookupEntry ||
        normalizedSrc?.endsWith(lookupEntry) === true
      );
    })?.[1];

  return {
    scripts: entry?.file ? [normalizePublicPath(entry.file, base)] : [],
    styles: (entry?.css ?? []).map((href) => normalizePublicPath(href, base)),
  };
}
