import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { checkDbHealth, closeDb } from "../db";
import { serveStatic, setupVite } from "./vite";

type RateWindow = { startedAt: number; count: number };
const rateWindows = new Map<string, RateWindow>();
const RATE_LIMIT = 2400;
const RATE_WINDOW_MS = 60_000;

function requestKey(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedIp = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined;
  return forwardedIp || req.ip || req.socket.remoteAddress || "unknown";
}

function allowRequest(req: express.Request): boolean {
  const now = Date.now();
  const key = requestKey(req);
  const current = rateWindows.get(key);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateWindows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= RATE_LIMIT;
}

function pruneRateWindows() {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [key, window] of Array.from(rateWindows.entries())) {
    if (window.startedAt < cutoff) rateWindows.delete(key);
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.requestTimeout = 30_000;
  server.maxConnections = Number(process.env.MAX_CONNECTIONS ?? 1000);
  app.use(express.json({ limit: "1mb", strict: true }));
  app.use(express.urlencoded({ limit: "1mb", extended: false }));
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });
  app.get("/healthz", (_req, res) => res.status(200).json({ ok: true, service: "esi" }));
  app.get("/readyz", async (_req, res) => {
    const databaseReady = await checkDbHealth();
    res.status(databaseReady ? 200 : 503).json({ ok: databaseReady, database: databaseReady ? "ready" : "unavailable" });
  });
  app.use("/api/trpc", (req, res, next) => {
    if (!allowRequest(req)) {
      res.setHeader("Retry-After", "60");
      res.status(429).json({ error: "Rate limit exceeded" });
      return;
    }
    next();
  });
  const pruneTimer = setInterval(pruneRateWindows, RATE_WINDOW_MS);
  pruneTimer.unref();
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
  const shutdown = async (signal: string) => {
    console.log(`[Server] ${signal} received; draining connections`);
    clearInterval(pruneTimer);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeDb();
    process.exit(0);
  };
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

startServer().catch(console.error);
