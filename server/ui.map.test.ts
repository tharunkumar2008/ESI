import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Tamil Nadu geographic network view", () => {
  it("keeps geographic, substation, and transformer specification content wired", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

    expect(home).toContain("Tamil Nadu geographic network");
    expect(home).toContain("Tamil Nadu grid map");
    expect(home).toContain("Substation & transformer register");
    expect(home).toContain("TR-07");
    expect(home).toContain("110 / 33 kV");
    expect(home).toContain("ONAN transformer");
    expect(home).toContain("230 / 110 kV");
  });
});
