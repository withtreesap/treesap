---
name: treesap
description: Build, modify, debug, and review Treesap apps and Treesap package integrations. Use this skill whenever the user asks to create or update a Treesap SSR app, Hono/JSX routes, Vite config, islands, static middleware, package exports, or Treesap CLI image optimization workflows, even if they do not explicitly mention "Treesap docs" or a specific package name.
---

# Treesap

## Workflow

1. Inspect the target app/package first: read `package.json`, `vite.config.ts`, server app entrypoints, and existing route/layout/island files before editing.
2. For SSR app, Hono, Vite, middleware, and islands work, read [references/framework.md](references/framework.md).
3. For image optimization or CLI workflows, read [references/image.md](references/image.md).
4. Follow the package’s current source style and import conventions. Prefer local examples already in the repo over inventing new app structure.
5. Run the narrowest relevant package checks before handing off: package-local `npm test`, `npm run build`, or app-level Vite commands.

## Guardrails

- Treat Treesap as Node + Vite + Hono, not Deno.
- Use `treesap` for framework runtime imports and `treesap/vite` for Vite plugin/build helpers.
- Prefer AVIF for optimized responsive image outputs unless the user asks for another format.
- Before using the `treesap` CLI, check whether the binary is installed (`treesap --help`) or package scripts/npx wrappers already exist in the repo.
- Preserve existing user edits in the workspace; avoid broad refactors unless requested.
