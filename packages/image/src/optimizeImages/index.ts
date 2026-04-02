import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { optimizeImage } from "wasm-image-optimization";
import type { ImageSize, OptimizeImagesConfig, OutputImageFormat } from "./types.js";

export * from "./types.js";

const DEFAULT_SIZES: ImageSize[] = [
  { suffix: "sm", width: 640 },
  { suffix: "md", width: 1280 },
  { suffix: "lg", width: 1920 },
];

const SUPPORTED_FORMATS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export async function optimizeImages(config: OptimizeImagesConfig): Promise<void> {
  const startTime = performance.now();
  const sizes = config.sizes ?? DEFAULT_SIZES;
  const format = config.format ?? "avif";
  const defaultQuality = config.defaultQuality ?? 85;

  for (const entry of config.entries) {
    const inputStats = await stat(entry.input);
    await mkdir(entry.output, { recursive: true });

    if (inputStats.isDirectory()) {
      for await (const filePath of walkImageFiles(entry.input)) {
        await processImage(
          filePath,
          entry.input,
          entry.output,
          sizes,
          format,
          defaultQuality,
        );
      }
      continue;
    }

    if (inputStats.isFile()) {
      await processImage(
        entry.input,
        dirname(entry.input),
        entry.output,
        sizes,
        format,
        defaultQuality,
      );
    }
  }

  const elapsedTime = (performance.now() - startTime) / 1000;
  console.log(`[image] optimization completed in ${elapsedTime.toFixed(2)}s`);
}

async function* walkImageFiles(rootDirectory: string): AsyncGenerator<string> {
  const entries = await readdir(rootDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(rootDirectory, entry.name);

    if (entry.isDirectory()) {
      yield* walkImageFiles(entryPath);
      continue;
    }

    if (entry.isFile() && SUPPORTED_FORMATS.has(extname(entry.name).toLowerCase())) {
      yield entryPath;
    }
  }
}

async function processImage(
  filePath: string,
  basePath: string,
  outputPath: string,
  sizes: ImageSize[],
  format: OutputImageFormat,
  defaultQuality: number,
): Promise<void> {
  const relativePath = relative(basePath, filePath);
  const baseName = relativePath.replace(/\.[^/.]+$/, "");
  const imageData = await readFile(filePath);

  for (const size of sizes) {
    const outputFilePath = join(outputPath, `${baseName}-${size.suffix}.${format}`);

    if (await fileExists(outputFilePath)) {
      console.log(`[image] skip ${relativePath} -> ${format} (${size.suffix}); output exists`);
      continue;
    }

    try {
      const optimizedImage = await optimizeImage({
        image: imageData,
        width: size.width,
        quality: size.quality ?? defaultQuality,
        format,
      });

      if (!optimizedImage) {
        console.error(
          `[image] failed ${relativePath} (${size.suffix}): no optimized output was generated`,
        );
        continue;
      }

      await mkdir(dirname(outputFilePath), { recursive: true });
      await writeFile(outputFilePath, optimizedImage);
      console.log(`[image] optimized ${relativePath} -> ${format} (${size.suffix})`);
    } catch (error) {
      console.error(`[image] error processing ${relativePath} (${size.suffix})`, error);
    }
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
