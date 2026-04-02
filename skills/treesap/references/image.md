# Treesap Image + CLI Reference

## Library API

Use `@treesap/image` when editing app code directly.

```ts
import { Picture, optimizeImages } from "@treesap/image";
```

Optimize files/directories:

```ts
await optimizeImages({
  entries: [
    {
      input: "src/images/gallery",
      output: "public/images/gallery",
    },
  ],
  sizes: [
    { suffix: "sm", width: 640, quality: 80 },
    { suffix: "md", width: 1280, quality: 85 },
    { suffix: "lg", width: 1920, quality: 90 },
  ],
  format: "avif",
  defaultQuality: 85,
});
```

Render responsive markup:

```ts
const markup = Picture({
  src: "/images/home/hero",
  alt: "Hero image",
  width: 1920,
  height: 1080,
  sizes: [
    { suffix: "lg", media: "(min-width: 1024px)" },
    { suffix: "md", media: "(min-width: 640px)" },
    { suffix: "sm" },
  ],
});
```

Ensure `Picture` suffixes and `optimizeImages` suffixes stay aligned.

## CLI

Use `treesap image optimize` when the CLI is installed and a shell workflow is appropriate.

```sh
treesap image optimize \
  --input ./src/images \
  --output ./public/images \
  --format avif \
  --size sm:640 \
  --size md:1280 \
  --size lg:1920@90 \
  --quality 85
```

If the binary is unavailable, check for a package script first. Use `npx @treesap/cli --help` only when network/package-install side effects are acceptable for the user.

## Gotchas

- `optimizeImages` currently skips outputs that already exist by filename; stale variants may persist if source images change.
- Errors during optimization are logged, so verify command output and generated files before assuming success.
- Prefer AVIF by default; use WebP/JPEG/PNG only for explicit compatibility requirements.
