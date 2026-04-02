import { describe, expect, it } from "vitest";
import { Picture } from "../src/index.js";

describe("Picture", () => {
  it("renders default responsive sources", () => {
    const markup = String(
      Picture({
        src: "/images/hero",
        alt: "Hero",
        imgClass: "hero-image",
        width: 1920,
        height: 1080,
      }),
    );

    expect(markup).toContain('media="(min-width: 1024px)"');
    expect(markup).toContain('srcset="/images/hero-lg.avif"');
    expect(markup).toContain('media="(min-width: 640px)"');
    expect(markup).toContain('srcset="/images/hero-md.avif"');
    expect(markup).toContain('srcset="/images/hero-sm.avif"');
    expect(markup).toContain('src="/images/hero-sm.avif"');
    expect(markup).toContain('alt="Hero"');
    expect(markup).toContain('class="hero-image"');
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain('decoding="async"');
  });

  it("renders custom sizes in order and uses the last size as the img fallback", () => {
    const markup = String(
      Picture({
        src: "/images/portrait",
        format: "webp",
        alt: "Portrait",
        width: 1200,
        height: 1800,
        sizes: [
          { suffix: "xl", media: "(min-width: 1280px)" },
          { suffix: "md", media: "(min-width: 768px)" },
          { suffix: "base" },
        ],
        loading: "eager",
        decoding: "sync",
      }),
    );

    const xlIndex = markup.indexOf('srcset="/images/portrait-xl.webp"');
    const mdIndex = markup.indexOf('srcset="/images/portrait-md.webp"');
    const baseIndex = markup.indexOf('srcset="/images/portrait-base.webp"');

    expect(xlIndex).toBeGreaterThan(-1);
    expect(mdIndex).toBeGreaterThan(xlIndex);
    expect(baseIndex).toBeGreaterThan(mdIndex);
    expect(markup).toContain('media="(min-width: 1280px)"');
    expect(markup).toContain('media="(min-width: 768px)"');
    expect(markup).toContain('src="/images/portrait-base.webp"');
    expect(markup).toContain('loading="eager"');
    expect(markup).toContain('decoding="sync"');
  });

  it("throws when src is empty", () => {
    expect(() =>
      Picture({
        src: "",
        alt: "Missing image",
        width: 100,
        height: 100,
      }),
    ).toThrowError("src is required");
  });
});
