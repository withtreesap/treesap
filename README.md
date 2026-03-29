# Treesap

Treesap is a monorepo of framework ideas and experiments.

The primary package, [`packages/treesap`](/Users/jaydanurwin/Documents/treefarm/treesap/packages/treesap), is now the Vite-first Node SSR framework. The repo also includes a single reference app in [`examples/site`](/Users/jaydanurwin/Documents/treefarm/treesap/examples/site).

## Packages

- [`packages/treesap`](/Users/jaydanurwin/Documents/treefarm/treesap/packages/treesap): the active Treesap framework package
- [`packages/terminal`](/Users/jaydanurwin/Documents/treefarm/treesap/packages/terminal): legacy terminal-related prototype
- [`packages/sandbox`](/Users/jaydanurwin/Documents/treefarm/treesap/packages/sandbox): legacy sandbox-related prototype

## Example

- [`examples/site`](/Users/jaydanurwin/Documents/treefarm/treesap/examples/site): the reference Treesap website example

## Workspace Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
```

## Treesap Framework

`packages/treesap` provides:

- a small Node request/response runtime
- routing and middleware primitives
- static asset serving with cache defaults
- Vite integration via `treesap/vite`

See [`packages/treesap/README.md`](/Users/jaydanurwin/Documents/treefarm/treesap/packages/treesap/README.md) for package usage.
