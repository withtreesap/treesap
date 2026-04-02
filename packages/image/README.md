# @treesap/image

Node image optimization utilities and responsive `<picture>` markup for Treesap apps.

## Installation

```sh
npm install @treesap/image
```

## optimizeImages

```ts
import { optimizeImages } from "@treesap/image";

await optimizeImages({
  entries: [
    {
      input: "src/images/gallery",
      output: "public/images/gallery",
    },
    {
      input: "src/images/hero.jpg",
      output: "public/images/home",
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

## Picture

```ts
import { Picture } from "@treesap/image";

const markup = Picture({
  src: "/images/home/hero",
  alt: "Hero image",
  width: 1920,
  height: 1080,
});
```

### Custom sizes

```ts
const markup = Picture({
  src: "/images/home/hero",
  alt: "Hero image",
  width: 2400,
  height: 1350,
  sizes: [
    { suffix: "xl", media: "(min-width: 1280px)" },
    { suffix: "md", media: "(min-width: 768px)" },
    { suffix: "sm" },
  ],
});
```

`Picture` expects optimized variants to exist at:

- `{src}-sm.{format}`
- `{src}-md.{format}`
- `{src}-lg.{format}`

## Supported input formats

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- AVIF (`.avif`)

## Output format

Optimized images are written as:

```txt
{original-name}-{size-suffix}.{format}
```

## API

```ts
interface ImageSize {
  suffix: string;
  width: number;
  quality?: number;
}

type OutputImageFormat = "avif" | "webp" | "jpeg" | "png";

interface OptimizeImagesConfig {
  entries: Array<{
    input: string;
    output: string;
  }>;
  sizes?: ImageSize[];
  format?: OutputImageFormat;
  defaultQuality?: number;
}
```
