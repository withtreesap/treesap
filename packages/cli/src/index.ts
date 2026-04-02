import { runImageCommand } from "./commands/image.js";

export interface CliIO {
  cwd: string;
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

export async function runTreesapCli(argv: string[], io: CliIO): Promise<number> {
  const [command, ...commandArgs] = argv;

  if (!command || command === "--help" || command === "-h") {
    io.stdout(renderRootHelp());
    return 0;
  }

  if (command === "--version" || command === "-v") {
    io.stdout("treesap 0.1.0");
    return 0;
  }

  if (command === "image") {
    return runImageCommand(commandArgs, io);
  }

  io.stderr(`Unknown command: ${command}`);
  io.stdout(renderRootHelp());
  return 1;
}

export function renderRootHelp(): string {
  return `Treesap CLI

Usage:
  treesap <command> [options]

Commands:
  image optimize   Optimize responsive image variants

Options:
  -h, --help       Show help
  -v, --version    Show version

Examples:
  treesap image optimize --input ./src/images --output ./public/images
  treesap image optimize --input ./src/hero.jpg --output ./public/images --format avif --size sm:640 --size lg:1920@90`;
}
