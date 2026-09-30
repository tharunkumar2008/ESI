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
import { COOKIE_NAME } from "@shared/const";

type RateWindow = { startedAt: number; count: number };
const rateWindows = new Map<string, RateWindow>();
const RATE_LIMIT = 900;
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

function isSameOriginRequest(req: express.Request): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.get("host");
  } catch {
    return false;
  }
}

function isSecureRequest(req: express.Request): boolean {
  const forwarded = req.headers["x-forwarded-proto"];
  return req.protocol === "https" || forwarded === "https" || (Array.isArray(forwarded) && forwarded.includes("https"));
}

function isSessionRequest(req: express.Request): boolean {
  return Boolean(req.headers.cookie?.includes(`${COOKIE_NAME}=`));
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
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
  app.use(express.json({ limit: "256kb", strict: true }));
  app.use(express.urlencoded({ limit: "128kb", extended: false }));
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Content-Security-Policy", process.env.NODE_ENV === "production"
      ? "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self'; connect-src 'self' https: wss:"
      : "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss:");
    if (isSecureRequest(req)) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
  app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
  app.get("/readyz", async (_req, res) => {
    const databaseReady = await checkDbHealth();
    res.status(databaseReady ? 200 : 503).json({ ok: databaseReady });
  });
  app.use("/api/trpc", (req, res, next) => {
    if (isSessionRequest(req) && req.method !== "GET" && !isSameOriginRequest(req)) {
      res.status(403).json({ error: "Cross-origin mutation blocked" });
      return;
    }
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
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  if (process.env.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
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
