import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("security hardening", () => {
  it("keeps operational ESI procedures behind authentication", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(router).toContain("All operational ESI data is authenticated");
    expect(router).toContain("summary: protectedProcedure");
    expect(router).toContain("simulate: protectedProcedure");
    expect(router).toContain("hardwareReading: protectedProcedure");
    expect(router).toContain("z.number().finite().min(0)");
  });

  it("keeps transport and browser-boundary protections enabled", () => {
    const server = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");
    expect(server).toContain('X-Content-Type-Options');
    expect(server).toContain('Content-Security-Policy');
    expect(server).toContain('Strict-Transport-Security');
    expect(server).toContain('X-Frame-Options');
    expect(server).toContain('Cross-origin mutation blocked');
    expect(server).toContain('256kb');
  });
});
