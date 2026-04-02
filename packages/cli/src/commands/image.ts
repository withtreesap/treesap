import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { optimizeImages, type ImageSize, type OutputImageFormat } from "@treesap/image";
import type { CliIO } from "../index.js";

const VALID_FORMATS = new Set<OutputImageFormat>(["avif", "webp", "jpeg", "png"]);

export interface ImageOptimizeCommandOptions {
  input: string;
  output: string;
  format?: OutputImageFormat;
  sizes?: ImageSize[];
  defaultQuality?: number;
}

export async function runImageCommand(argv: string[], io: CliIO): Promise<number> {
  const [subcommand, ...subcommandArgs] = argv;

  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    io.stdout(renderImageHelp());
    return 0;
  }

  if (subcommand !== "optimize") {
    io.stderr(`Unknown image command: ${subcommand}`);
    io.stdout(renderImageHelp());
    return 1;
  }

  try {
    const options = parseImageOptimizeArgs(subcommandArgs, io.cwd);

    if (!options) {
      io.stdout(renderImageOptimizeHelp());
      return 0;
    }

    await optimizeImages({
      entries: [
        {
          input: options.input,
          output: options.output,
        },
      ],
      format: options.format,
      sizes: options.sizes,
      defaultQuality: options.defaultQuality,
    });

    io.stdout(`[treesap] optimized images: ${options.input} -> ${options.output}`);
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

export function parseImageOptimizeArgs(
  argv: string[],
  cwd: string,
): ImageOptimizeCommandOptions | null {
  const parsed = parseArgs({
    args: argv,
    strict: true,
    allowPositionals: false,
    options: {
      help: {
        type: "boolean",
        short: "h",
      },
      input: {
        type: "string",
        short: "i",
      },
      output: {
        type: "string",
        short: "o",
      },
      format: {
        type: "string",
        short: "f",
      },
      size: {
        type: "string",
        short: "s",
        multiple: true,
      },
      quality: {
        type: "string",
        short: "q",
      },
    },
  });

  if (parsed.values.help) {
    return null;
  }

  const input = parsed.values.input;
  const output = parsed.values.output;

  if (!input) {
    throw new Error("Missing required option: --input <path>");
  }

  if (!output) {
    throw new Error("Missing required option: --output <path>");
  }

  return {
    input: resolve(cwd, input),
    output: resolve(cwd, output),
    format: parseFormat(parsed.values.format),
    sizes: parseSizeSpecs(parsed.values.size),
    defaultQuality: parseQuality(parsed.values.quality),
  };
}

export function renderImageHelp(): string {
  return `Treesap Image Commands

Usage:
  treesap image <command> [options]

Commands:
  optimize         Generate optimized image variants

Examples:
  treesap image optimize --input ./src/images --output ./public/images`;
}

export function renderImageOptimizeHelp(): string {
  return `Treesap Image Optimize

Usage:
  treesap image optimize --input <path> --output <path> [options]

Options:
  -i, --input <path>     Source image file or directory
  -o, --output <path>    Output directory
  -f, --format <format>  avif | webp | jpeg | png
  -s, --size <spec>      Size variant as suffix:width or suffix:width@quality
  -q, --quality <n>      Default quality, 1-100
  -h, --help             Show help

Examples:
  treesap image optimize --input ./src/images --output ./public/images
  treesap image optimize --input ./src/hero.jpg --output ./public/images --format avif --size sm:640 --size md:1280 --size lg:1920@90`;
}

function parseFormat(format: string | undefined): OutputImageFormat | undefined {
  if (!format) {
    return undefined;
  }

  if (!VALID_FORMATS.has(format as OutputImageFormat)) {
    throw new Error(`Invalid image format: ${format}`);
  }

  return format as OutputImageFormat;
}

function parseSizeSpecs(sizeSpecs: string[] | undefined): ImageSize[] | undefined {
  if (!sizeSpecs?.length) {
    return undefined;
  }

  return sizeSpecs.map((sizeSpec) => {
    const match = /^([a-zA-Z0-9_-]+):([0-9]+)(?:@([0-9]+))?$/.exec(sizeSpec);

    if (!match) {
      throw new Error(`Invalid size spec: ${sizeSpec}. Expected suffix:width or suffix:width@quality`);
    }

    const width = Number(match[2]);
    const quality = match[3] ? Number(match[3]) : undefined;

    if (width <= 0) {
      throw new Error(`Invalid width in size spec: ${sizeSpec}`);
    }

    if (quality !== undefined && (quality < 1 || quality > 100)) {
      throw new Error(`Invalid quality in size spec: ${sizeSpec}`);
    }

    return {
      suffix: match[1],
      width,
      quality,
    };
  });
}

function parseQuality(quality: string | undefined): number | undefined {
  if (!quality) {
    return undefined;
  }

  const parsedQuality = Number(quality);

  if (!Number.isInteger(parsedQuality) || parsedQuality < 1 || parsedQuality > 100) {
    throw new Error(`Invalid quality: ${quality}. Expected an integer from 1 to 100`);
  }

  return parsedQuality;
}
