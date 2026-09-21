import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("ESI institutional branding layer", () => {
  it("keeps the watermark, slogan, text-first brand lockup, and founder signature wired", () => {
    const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

    expect(css).toContain("/manus-storage/uatmdmrEOXUC_a38bdaeb.png");
    expect(css).toContain("Tamil institutional slogan banner");
    expect(css).toContain("ESI text-first product wordmark");
    expect(css).toContain("Founder signature");
    expect(home).toContain("வாழ்க தமிழ், வாழ்க பாரதம்!!");
    expect(home).toContain('className="esi-wordmark"');
    expect(home).toContain('className="founder-signature hidden lg:flex"');
    expect(home).toContain("THARUN KUMAR");
    expect(home).toContain('lang="ta"');
    expect(home).toContain("not an official endorsement");
  });
});
