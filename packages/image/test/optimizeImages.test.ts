import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { optimizeImages } from "../src/index.js";
import { readJpegSize } from "./jpeg-size.js";

const fixturesDirectory = fileURLToPath(new URL("./fixtures", import.meta.url));
const landscapeFixture = join(fixturesDirectory, "landscape-test.jpg");
const portraitFixture = join(fixturesDirectory, "portrait-test.jpg");

describe("optimizeImages", () => {
  const temporaryDirectories: string[] = [];

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    await Promise.all(
      temporaryDirectories.splice(0).map((directoryPath) =>
        rm(directoryPath, { recursive: true, force: true }),
      ),
    );
  });

  it("optimizes landscape and portrait fixtures with custom sizes", async () => {
    const outputDirectory = await createTemporaryDirectory(temporaryDirectories);

    await optimizeImages({
      entries: [
        {
          input: fixturesDirectory,
          output: outputDirectory,
        },
      ],
      sizes: [{ suffix: "card", width: 320, quality: 80 }],
      format: "jpeg",
      defaultQuality: 75,
    });

    const landscapeOutput = join(outputDirectory, "landscape-test-card.jpeg");
    const portraitOutput = join(outputDirectory, "portrait-test-card.jpeg");
    const landscapeSize = readJpegSize(await readFile(landscapeOutput));
    const portraitSize = readJpegSize(await readFile(portraitOutput));

    expect(landscapeSize.width).toBe(320);
    expect(landscapeSize.width).toBeGreaterThan(landscapeSize.height);
    expect(portraitSize.width).toBe(320);
    expect(portraitSize.height).toBeGreaterThan(portraitSize.width);
  });

  it("supports a single image input file", async () => {
    const outputDirectory = await createTemporaryDirectory(temporaryDirectories);

    await optimizeImages({
      entries: [
        {
          input: portraitFixture,
          output: outputDirectory,
        },
      ],
      sizes: [{ suffix: "sm", width: 240 }],
      format: "jpeg",
    });

    const outputPath = join(outputDirectory, "portrait-test-sm.jpeg");
    const outputSize = readJpegSize(await readFile(outputPath));

    expect(outputSize.width).toBe(240);
    expect(outputSize.height).toBeGreaterThan(outputSize.width);
  });

  it("skips outputs that already exist", async () => {
    const outputDirectory = await createTemporaryDirectory(temporaryDirectories);

    await optimizeImages({
      entries: [
        {
          input: landscapeFixture,
          output: outputDirectory,
        },
      ],
      sizes: [{ suffix: "sm", width: 240 }],
      format: "jpeg",
    });

    const outputPath = join(outputDirectory, "landscape-test-sm.jpeg");
    const beforeStats = await stat(outputPath);

    await optimizeImages({
      entries: [
        {
          input: landscapeFixture,
          output: outputDirectory,
        },
      ],
      sizes: [{ suffix: "sm", width: 240 }],
      format: "jpeg",
    });

    const afterStats = await stat(outputPath);

    expect(afterStats.mtimeMs).toBe(beforeStats.mtimeMs);
    expect(console.log).toHaveBeenCalledWith(
      "[image] skip landscape-test.jpg -> jpeg (sm); output exists",
    );
  });
});

async function createTemporaryDirectory(trackedDirectories: string[]): Promise<string> {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "treesap-image-"));
  trackedDirectories.push(temporaryDirectory);
  return temporaryDirectory;
}
