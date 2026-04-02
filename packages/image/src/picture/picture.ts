import { html } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";

export interface PictureSize {
  suffix: string;
  media?: string;
}

export interface PictureProps {
  src: string;
  format?: "avif" | "webp" | "jpeg" | "png";
  alt: string;
  imgClass?: string;
  width: number;
  height: number;
  sizes?: PictureSize[];
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
}

const DEFAULT_SIZES: PictureSize[] = [
  { suffix: "lg", media: "(min-width: 1024px)" },
  { suffix: "md", media: "(min-width: 640px)" },
  { suffix: "sm" },
];

export function Picture(props: PictureProps): HtmlEscapedString | Promise<HtmlEscapedString> {
  const { src, alt, imgClass, width, height, sizes, loading, decoding } = props;
  const format = props.format ?? "avif";
  const pictureSizes = sizes?.length ? sizes : DEFAULT_SIZES;
  const fallbackSize = pictureSizes[pictureSizes.length - 1];

  if (!src) {
    throw new Error("src is required");
  }

  return html`<picture>
    ${pictureSizes.map(
      (size) => html`<source
        ${size.media ? html`media="${size.media}"` : ""}
        srcset="${src}-${size.suffix}.${format}"
        type="image/${format}"
      />`,
    )}
    <img
      src="${src}-${fallbackSize.suffix}.${format}"
      alt="${alt}"
      class="${imgClass ?? ""}"
      width="${width}"
      height="${height}"
      loading="${loading ?? "lazy"}"
      decoding="${decoding ?? "async"}"
    />
  </picture>`;
}
