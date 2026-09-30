import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { acknowledgeAnomaly, getAnomalies, getEnergy, getEvents, getLive, getNetworkSnapshot, getReports, getRuntime, getSignature, getSummary, resolveAnomaly, runSimulation, type SimScenario } from "./db";

const scenarioSchema = z.enum(["normal", "abnormal-load", "potential-theft", "meter-anomaly", "transformer-anomaly", "night-consumption", "energy-imbalance"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  // All operational ESI data is authenticated; only auth.me/logout remain public.
  esi: router({
    summary: protectedProcedure.query(() => getSummary()),
    live: protectedProcedure.query(() => getLive()),
    network: protectedProcedure.query(() => getNetworkSnapshot()),
    signatures: protectedProcedure.query(() => getSignature()),
    signatureHistory: protectedProcedure.query(() => getLive().history),
    anomalies: protectedProcedure.query(() => getAnomalies()),
    events: protectedProcedure.query(() => getEvents()),
    energy: protectedProcedure.query(() => getEnergy()),
    reports: protectedProcedure.query(() => getReports()),
    runtime: protectedProcedure.query(() => getRuntime()),
    simulate: protectedProcedure.input(z.object({ scenario: scenarioSchema })).mutation(({ input }) => runSimulation(input.scenario as SimScenario)),
    acknowledge: protectedProcedure.input(z.object({ id: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/) })).mutation(({ input }) => acknowledgeAnomaly(input.id)),
    resolve: protectedProcedure.input(z.object({ id: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/) })).mutation(({ input }) => resolveAnomaly(input.id)),
    hardwareStatus: protectedProcedure.query(() => ({ connected: false, deviceId: "ESP32-LAB-01", lastSeen: "12 min ago", transport: "Wi-Fi" })),
    hardwareReading: protectedProcedure.input(z.object({ deviceId: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_.:-]+$/), voltage: z.number().finite().min(0).max(1000), current: z.number().finite().min(0).max(10000), power: z.number().finite().min(0).max(100000), energy: z.number().finite().min(0).max(100000000), timestamp: z.string().datetime().optional() })).mutation(({ input }) => ({ accepted: true, reading: input, message: "Hardware reading accepted for prototype analysis." })),
  }),
});

export type AppRouter = typeof appRouter;
