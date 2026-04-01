# Treesap Context

## Current Direction

- Treesap is being positioned as a Vite-first, Node-only SSR framework.
- Primary deployment target is plain Node hosting: `vite build`, then `node dist/server/main.js`.
- Platform adapters are a non-goal. Vercel-style function output is not a target.
- Cloud Run is considered compatible because it can run a normal Node server in a container.

## Roadmap Direction Agreed In This Thread

- Focus on the core framework, not legacy packages.
- Prove the framework through `examples/site`.
- Keep deployment zero-adapter for normal Node hosts.
- Treat platform-specific outputs as non-goals.
- Likely near-term roadmap:
  - stabilize runtime and Vite build behavior
  - dogfood with `examples/site`
  - harden production behavior for Node hosting
  - document one blessed deployment path

## Example API Work

- Added minimal API examples to `examples/site`:
  - `GET /api`
  - `GET /api/health`
  - `POST /api/echo`
- Verified the POST echo route works correctly with JSON.
- Note: `examples/` is ignored by the repo root `.gitignore`, so changes there are local-only from git's perspective unless ignore rules change.

## Vite / SSR Issue Resolved

- The example dev SSR failure (`require is not defined` from `picomatch`) came from stale built framework output.
- Root cause:
  - `packages/treesap/src/vite.ts` had been corrected
  - but `packages/treesap/dist/vite.js` still contained `ssr.noExternal = true`
  - the example imports `treesap/vite` from the built `dist` export
- Fixes applied:
  - restored the narrower SSR config to `noExternal: ["hono"]`
  - rebuilt the framework package
  - added `"prepare": "npm run build"` to `packages/treesap/package.json` so local installs rebuild `dist`

## Routing Performance Work Completed

- Initial router shape was linear:
  - middleware filtering by scan
  - route lookup via `this.routes.find(...)`
  - matched route patterns were tested twice
- Implemented low-complexity performance wins:
  - exact static route fast path
  - single-pass route match with cached params
  - per-method route buckets
  - per-method exact-route buckets
  - centralized route registration so mounted routes also populate indexes
- Tests were added for:
  - exact routes beating matching param routes
  - same path resolving differently by method
  - mounted exact routes still resolving correctly

## Routing Benchmark Notes

- Earlier exact-route benchmark before the indexing work was roughly:
  - 10 routes: ~40k req/s
  - 100 routes: ~7k req/s
  - 1,000 routes: ~767 req/s
- After exact-route indexing + method buckets:
  - 10 routes: ~472k req/s
  - 100 routes: ~492k req/s
  - 1,000 routes: ~506k req/s
  - 5,000 routes: ~503k req/s
- Interpretation:
  - exact static routes are now effectively O(1)
  - dynamic routes still use pattern matching fallback
  - current performance is considered acceptable for Treesap’s intended scope

## Release Work Completed

- Bumped `treesap` from `0.2.1` to `0.2.2`
- Verified:
  - `npm run build --workspace treesap`
  - `npm test`
- Publish initially failed with npm auth/ownership behavior, then succeeded after `npm login`

## Islands / Sapling Decision

- `sapling-island` should remain its own standalone primitive.
- Treesap should build on top of it instead of re-implementing the runtime.
- Recommended architecture:
  - `sapling-island` remains the low-level web-component runtime
  - Treesap owns the Vite integration, TS/TSX island entry builds, manifest lookup, prop serialization, and ergonomic API
- Desired user experience:
  - Treesap users should not need to install `sapling-island` separately
  - Treesap users should not think about CDN script tags or raw `<sapling-island>` wiring
  - Sapling can exist independently while Treesap exposes a first-party islands API on top

## Sapling Installation Status

- Installed `sapling-island` into `examples/site`
- Wired it into the example site browser entry and added recommended CSS
- Verified example build passed afterward
- Current installed version in the example workspace: `sapling-island@0.2.3`

## Islands Implementation Progress

- First Treesap-native islands slice is now implemented.
- Current design:
  - explicit registration in `defineTreesapConfig({ islands: { entries } })`
  - no filesystem discovery
  - no props system
  - `Island` server helper rendered from `treesap`
  - island client modules export `default function mount(root: HTMLElement)`
- Vite support now:
  - includes registered island entries in the client build
  - includes a dedicated `treesap-island-runtime` client asset when islands are configured
  - no longer relies on the app browser entry to load `sapling-island`
  - injects island registration and runtime entry globals into the app entry so the externalized `Island` helper can resolve both in dev and production
- The example site now uses:
  - `launchCounter: "src/islands/launch-counter.ts"`
  - `<Island name="launchCounter" loading="visible">...</Island>`
- Verified:
  - `npm test`
  - `npm run build --workspace treesap`
  - `npm run build --workspace @treesap/example-site`

## Islands Bug Fix After 0.3.1

- `0.3.1` still had a design flaw for installed apps:
  - islands depended on the user app's browser entry receiving an injected `treesap/island-runtime` import
  - older templates using `src/www/entry-style.ts` instead of the newer default browser entry would render island markup but never hydrate
- The fix changes the architecture:
  - every `Island` now renders its own module script for the runtime asset
  - the runtime asset is emitted independently in the client build as `treesap-island-runtime-*`
  - the Sapling runtime still injects `sapling-island { display: contents; }` into `document.head`, so no base-layout hook is required
- Package version was bumped to `0.3.2` for this patch.

## Likely Next Step

- Refine the islands API and docs now that the first working slice exists.
- Most likely next work:
  - add tests specifically for `Island` SSR output
  - document the public API and recommended `src/islands/` convention
  - consider whether the inline bootstrap script should stay inline or move to a tiny runtime helper
  - decide whether to bump version after the islands feature lands cleanly
