import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Most ESI telemetry reads are intentionally public in the prototype. Do
  // not spend a JWT verification cycle (or emit a warning) when no credentials
  // were sent. Authenticated routes still use the normal SDK path.
  const hasSessionCookie = Boolean(opts.req.headers.cookie?.includes(`${COOKIE_NAME}=`));
  const hasBearerToken = typeof opts.req.headers.authorization === "string" && opts.req.headers.authorization.startsWith("Bearer ");
  if (hasSessionCookie || hasBearerToken) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
