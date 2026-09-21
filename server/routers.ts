import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { acknowledgeAnomaly, getAnomalies, getEnergy, getEvents, getLive, getNetworkSnapshot, getReports, getRuntime, getSignature, getSummary, resolveAnomaly, runSimulation, type SimScenario } from "./db";

const scenarioSchema = z.enum(["normal", "abnormal-load", "energy-imbalance", "meter-anomaly", "transformer-anomaly"]);

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
  esi: router({
    summary: publicProcedure.query(() => getSummary()),
    live: publicProcedure.query(() => getLive()),
    network: publicProcedure.query(() => getNetworkSnapshot()),
    signatures: publicProcedure.query(() => getSignature()),
    signatureHistory: publicProcedure.query(() => getLive().history),
    anomalies: publicProcedure.query(() => getAnomalies()),
    events: publicProcedure.query(() => getEvents()),
    energy: publicProcedure.query(() => getEnergy()),
    reports: publicProcedure.query(() => getReports()),
    runtime: publicProcedure.query(() => getRuntime()),
    simulate: publicProcedure.input(z.object({ scenario: scenarioSchema })).mutation(({ input }) => runSimulation(input.scenario as SimScenario)),
    acknowledge: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => acknowledgeAnomaly(input.id)),
    resolve: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => resolveAnomaly(input.id)),
    hardwareStatus: publicProcedure.query(() => ({ connected: false, deviceId: "ESP32-LAB-01", lastSeen: "12 min ago", transport: "Wi-Fi" })),
    hardwareReading: publicProcedure.input(z.object({ deviceId: z.string(), voltage: z.number(), current: z.number(), power: z.number(), energy: z.number(), timestamp: z.string().optional() })).mutation(({ input }) => ({ accepted: true, reading: input, message: "Hardware reading accepted for prototype analysis." })),
  }),
});

export type AppRouter = typeof appRouter;
