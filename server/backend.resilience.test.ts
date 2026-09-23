import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("backend concurrency hardening", () => {
  it("keeps pooled database and runtime safeguards enabled", () => {
    const db = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    const server = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");
    const context = readFileSync(resolve(process.cwd(), "server/_core/context.ts"), "utf8");

    expect(db).toContain("createPool");
    expect(db).toContain("connectionLimit");
    expect(db).toContain("checkDbHealth");
    expect(db).toContain("closeDb");
    expect(server).toContain("/healthz");
    expect(server).toContain("/readyz");
    expect(server).toContain("RATE_LIMIT");
    expect(server).toContain("keepAliveTimeout");
    expect(server).toContain("SIGTERM");
    expect(context).toContain("hasSessionCookie");
  });
});
