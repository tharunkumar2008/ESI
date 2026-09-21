import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("ESI institutional branding layer", () => {
  it("keeps the Tamil Nadu emblem watermark and non-endorsement language wired", () => {
    const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

    expect(css).toContain("/manus-storage/uatmdmrEOXUC_a38bdaeb.png");
    expect(css).toContain("Tamil Nadu institutional watermark");
    expect(home).toContain("not an official endorsement");
  });
});
