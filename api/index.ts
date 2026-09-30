import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { COOKIE_NAME } from "../shared/const";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "256kb", strict: true }));
app.use(express.urlencoded({ limit: "128kb", extended: false }));

function sameOrigin(req: express.Request) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.get("host");
  } catch {
    return false;
  }
}

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self'; connect-src 'self' https: wss:");
  if (req.method !== "GET" && req.headers.cookie?.includes(`${COOKIE_NAME}=`) && !sameOrigin(req)) {
    res.status(403).json({ error: "Cross-origin mutation blocked" });
    return;
  }
  next();
});

registerStorageProxy(app);
registerOAuthRoutes(app);
app.use(createExpressMiddleware({ router: appRouter, createContext }));

export default app;
