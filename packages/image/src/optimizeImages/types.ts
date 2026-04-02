export interface ImageSize {
  suffix: string;
  width: number;
  quality?: number;
}

export type OutputImageFormat = "avif" | "webp" | "jpeg" | "png";

export interface OptimizeImagesConfig {
  entries: Array<{
    input: string;
    output: string;
  }>;
  sizes?: ImageSize[];
  format?: OutputImageFormat;
  defaultQuality?: number;
}
