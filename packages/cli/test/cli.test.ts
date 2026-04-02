import { describe, expect, it, vi } from "vitest";
import { runTreesapCli } from "../src/index.js";

const optimizeImages = vi.hoisted(() => vi.fn());

vi.mock("@treesap/image", () => ({
  optimizeImages,
}));

describe("runTreesapCli", () => {
  it("prints root help when no command is provided", async () => {
    const io = createTestIO();

    await expect(runTreesapCli([], io)).resolves.toBe(0);

    expect(io.stdout).toHaveBeenCalledWith(expect.stringContaining("Treesap CLI"));
    expect(optimizeImages).not.toHaveBeenCalled();
  });

  it("runs image optimization with parsed options", async () => {
    const io = createTestIO();

    await expect(
      runTreesapCli(
        [
          "image",
          "optimize",
          "--input",
          "./fixtures/source",
          "--output",
          "./public/images",
          "--format",
          "avif",
          "--size",
          "sm:640",
          "--size",
          "lg:1920@90",
          "--quality",
          "82",
        ],
        io,
      ),
    ).resolves.toBe(0);

    expect(optimizeImages).toHaveBeenCalledWith({
      entries: [
        {
          input: "/workspace/fixtures/source",
          output: "/workspace/public/images",
        },
      ],
      format: "avif",
      sizes: [
        {
          suffix: "sm",
          width: 640,
          quality: undefined,
        },
        {
          suffix: "lg",
          width: 1920,
          quality: 90,
        },
      ],
      defaultQuality: 82,
    });
    expect(io.stdout).toHaveBeenCalledWith(
      "[treesap] optimized images: /workspace/fixtures/source -> /workspace/public/images",
    );
  });

  it("returns a non-zero exit code for invalid image options", async () => {
    const io = createTestIO();

    await expect(
      runTreesapCli(["image", "optimize", "--input", "./fixtures/source"], io),
    ).resolves.toBe(1);

    expect(io.stderr).toHaveBeenCalledWith("Missing required option: --output <path>");
  });
});

function createTestIO() {
  return {
    cwd: "/workspace",
    stdout: vi.fn(),
    stderr: vi.fn(),
  };
}
