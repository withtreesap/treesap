/** @jsxImportSource hono/jsx */
import type { Renderable } from "./context.ts";
import { getViteModuleAsset } from "./vite.ts";

export interface IslandProps {
  name: string;
  loading?: string;
  timeout?: number | string;
  children: Renderable;
}

function getRegisteredIslandEntries() {
  return globalThis.__TREESAP_ISLANDS__ ?? {};
}

function getIslandRuntimeEntry() {
  return globalThis.__TREESAP_ISLAND_RUNTIME_ENTRY__ ?? null;
}

function createIslandBootstrapScript(name: string, scriptUrl: string) {
  return `
void (async () => {
  const currentScript = document.currentScript;
  const island = currentScript?.closest("sapling-island");
  const root = island?.querySelector("[data-treesap-island-root]");

  if (!(root instanceof HTMLElement)) {
    throw new Error(${JSON.stringify(
      `Treesap island "${name}" could not find its island root.`
    )});
  }

  const module = await import(${JSON.stringify(scriptUrl)});
  const mount = module.default;

  if (typeof mount !== "function") {
    throw new Error(${JSON.stringify(
      `Treesap island "${name}" must export a default mount(root) function.`
    )});
  }

  await mount(root);
})().catch((error) => {
  setTimeout(() => {
    throw error;
  });
});
`.trim();
}

export function Island(props: IslandProps) {
  const islandEntries = getRegisteredIslandEntries();
  const entry = islandEntries[props.name];
  if (!entry) {
    throw new Error(
      `Treesap island "${props.name}" is not registered. Add it to defineTreesapConfig({ islands: { entries: { ... } } }).`
    );
  }

  const scriptUrl = getViteModuleAsset({ entry });
  if (!scriptUrl) {
    throw new Error(
      `Treesap island "${props.name}" could not resolve a built browser asset for "${entry}".`
    );
  }

  const runtimeEntry = getIslandRuntimeEntry();
  if (!runtimeEntry) {
    throw new Error(
      'Treesap islands runtime is not registered. Restart Vite so Treesap can inject its runtime entry.'
    );
  }

  const runtimeScriptUrl = getViteModuleAsset({ entry: runtimeEntry });
  if (!runtimeScriptUrl) {
    throw new Error("Treesap could not resolve its island runtime browser asset.");
  }

  const bootstrapScript = createIslandBootstrapScript(props.name, scriptUrl);

  return (
    <>
      <script type="module" src={runtimeScriptUrl}></script>
      <sapling-island
        loading={props.loading ?? "load"}
        timeout={props.timeout === undefined ? undefined : String(props.timeout)}
      >
        <div data-treesap-island-root="" data-treesap-island={props.name}>
          {props.children}
        </div>
        <template>
          <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />
        </template>
      </sapling-island>
    </>
  );
}
