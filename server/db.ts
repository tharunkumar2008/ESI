import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type SimScenario = "normal" | "abnormal-load" | "energy-imbalance" | "meter-anomaly" | "transformer-anomaly";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NetworkNode = {
  id: string;
  kind: "substation" | "transformer" | "feeder" | "section";
  name: string;
  location: string;
  parent?: string;
  latitude: number;
  longitude: number;
  status: "normal" | "warning" | "critical";
  voltage: number;
  current: number;
  power: number;
  load: number;
  risk: number;
};

export type AnomalyRecord = {
  id: string;
  timestamp: string;
  location: string;
  type: string;
  deviation: number;
  risk: number;
  confidence: number;
  severity: Severity;
  status: "Investigation Required" | "Acknowledged" | "Resolved";
  description: string;
  causes: string[];
  recommendation: string;
};

type Runtime = {
  mode: SimScenario;
  activeSection: string;
  activeAnomaly: AnomalyRecord | null;
  updatedAt: string;
  events: Array<{ id: string; type: string; time: string; message: string }>;
};

const substations = [
  { id: "CHN-SUB-01", name: "Chennai North", location: "Chennai", latitude: 13.0827, longitude: 80.2707 },
  { id: "CBE-SUB-02", name: "Coimbatore Central", location: "Coimbatore", latitude: 11.0168, longitude: 76.9558 },
  { id: "MDU-SUB-03", name: "Madurai East", location: "Madurai", latitude: 9.9252, longitude: 78.1198 },
  { id: "SLM-SUB-04", name: "Salem Grid", location: "Salem", latitude: 11.6643, longitude: 78.146 },
  { id: "TRY-SUB-05", name: "Trichy South", location: "Tiruchirappalli", latitude: 10.7905, longitude: 78.7047 },
];

const nodes: NetworkNode[] = [
  ...substations.map((s) => ({ ...s, kind: "substation" as const, status: "normal" as const, voltage: 5.0, current: 1.2, power: 6.2, load: 60, risk: 4 })),
  { id: "TR-04", kind: "transformer", name: "Transformer 04", location: "Chennai", parent: "CHN-SUB-01", latitude: 13.089, longitude: 80.277, status: "normal", voltage: 5.02, current: 1.38, power: 6.9, load: 68, risk: 12 },
  { id: "TR-07", kind: "transformer", name: "Transformer 07", location: "Chennai", parent: "CHN-SUB-01", latitude: 13.075, longitude: 80.264, status: "normal", voltage: 5.01, current: 1.42, power: 7.1, load: 72, risk: 15 },
  { id: "TR-12", kind: "transformer", name: "Transformer 12", location: "Coimbatore", parent: "CBE-SUB-02", latitude: 11.022, longitude: 76.963, status: "normal", voltage: 4.99, current: 1.19, power: 6.0, load: 57, risk: 8 },
  { id: "TR-18", kind: "transformer", name: "Transformer 18", location: "Madurai", parent: "MDU-SUB-03", latitude: 9.919, longitude: 78.128, status: "normal", voltage: 5.03, current: 1.24, power: 6.3, load: 61, risk: 6 },
  { id: "FDR-12", kind: "feeder", name: "Feeder 12", location: "Chennai", parent: "TR-07", latitude: 13.069, longitude: 80.257, status: "normal", voltage: 5.0, current: 1.48, power: 7.4, load: 73, risk: 18 },
  { id: "FDR-04", kind: "feeder", name: "Feeder 04", location: "Chennai", parent: "TR-04", latitude: 13.094, longitude: 80.285, status: "normal", voltage: 5.01, current: 1.35, power: 6.8, load: 64, risk: 11 },
  { id: "FDR-21", kind: "feeder", name: "Feeder 21", location: "Coimbatore", parent: "TR-12", latitude: 11.031, longitude: 76.952, status: "normal", voltage: 4.98, current: 1.22, power: 6.1, load: 59, risk: 10 },
  { id: "FDR-31", kind: "feeder", name: "Feeder 31", location: "Madurai", parent: "TR-18", latitude: 9.931, longitude: 78.112, status: "normal", voltage: 5.02, current: 1.27, power: 6.4, load: 63, risk: 7 },
  { id: "SEC-31", kind: "section", name: "Section 31", location: "Chennai · Ambattur", parent: "FDR-12", latitude: 13.064, longitude: 80.249, status: "normal", voltage: 5.0, current: 1.32, power: 6.6, load: 66, risk: 9 },
  { id: "SEC-30", kind: "section", name: "Section 30", location: "Chennai · Avadi", parent: "FDR-12", latitude: 13.081, longitude: 80.24, status: "normal", voltage: 5.01, current: 1.28, power: 6.4, load: 62, risk: 8 },
  { id: "SEC-18", kind: "section", name: "Section 18", location: "Coimbatore · Peelamedu", parent: "FDR-21", latitude: 11.027, longitude: 76.97, status: "normal", voltage: 4.99, current: 1.17, power: 5.9, load: 56, risk: 7 },
  { id: "SEC-44", kind: "section", name: "Section 44", location: "Madurai · Tallakulam", parent: "FDR-31", latitude: 9.938, longitude: 78.121, status: "normal", voltage: 5.02, current: 1.23, power: 6.2, load: 60, risk: 6 },
];

const history = Array.from({ length: 24 }, (_, i) => {
  const hour = (i + 1) % 24;
  const baseline = 5.8 + Math.sin((hour / 24) * Math.PI * 2) * 0.55 + (hour >= 18 && hour <= 21 ? 0.75 : 0);
  return { time: `${String(hour).padStart(2, "0")}:00`, baseline: Number(baseline.toFixed(2)), actual: Number((baseline + Math.sin(i * 1.8) * 0.22).toFixed(2)), load: Math.round(52 + Math.sin((hour / 24) * Math.PI * 2) * 18 + (hour >= 18 && hour <= 21 ? 12 : 0)) };
});

let runtime: Runtime = {
  mode: "normal",
  activeSection: "SEC-31",
  activeAnomaly: null,
  updatedAt: new Date().toISOString(),
  events: [
    { id: "evt-01", type: "SYSTEM", time: "14:32", message: "Baseline electric signatures refreshed across 250 monitored sections." },
    { id: "evt-02", type: "NETWORK", time: "14:27", message: "ESP32 gateway heartbeat received from prototype lab." },
    { id: "evt-03", type: "ANALYSIS", time: "14:20", message: "Isolation Forest model completed scheduled validation pass." },
  ],
};

function riskBand(risk: number): Severity {
  if (risk >= 80) return "CRITICAL";
  if (risk >= 60) return "HIGH";
  if (risk >= 30) return "MEDIUM";
  return "LOW";
}

function anomalyFor(mode: SimScenario): AnomalyRecord | null {
  if (mode === "normal") return null;
  const config: Record<Exclude<SimScenario, "normal">, { type: string; risk: number; deviation: number; confidence: number; description: string; causes: string[]; recommendation: string }> = {
    "abnormal-load": { type: "Abnormal Load", risk: 72, deviation: 58, confidence: 0.91, description: "Current demand is materially above the learned electric signature for this time window.", causes: ["Unexpected consumer load", "Repeated evening surge", "Possible equipment start-up"], recommendation: "Validate feeder load profile and inspect high-demand consumer groups." },
    "energy-imbalance": { type: "Energy Imbalance", risk: 64, deviation: 46, confidence: 0.86, description: "Energy supplied and energy accounted for diverge beyond the prototype investigation threshold.", causes: ["Technical losses", "Metering error", "Communication gap", "Potential unauthorized consumption"], recommendation: "Reconcile feeder meters and verify transformer/section metering in the field." },
    "meter-anomaly": { type: "Potential Meter Tampering", risk: 87, deviation: 64, confidence: 0.94, description: "Current electrical behaviour significantly differs from the learned normal electric signature.", causes: ["Potential meter tampering", "Unexpected nighttime load", "Meter wiring or sensor issue"], recommendation: "Field verification and meter/network inspection recommended. This is not a definitive theft finding." },
    "transformer-anomaly": { type: "Transformer Anomaly", risk: 78, deviation: 61, confidence: 0.89, description: "Transformer operating behaviour is deviating from the expected load, voltage, and power profile.", causes: ["Thermal stress", "Phase imbalance", "Near-capacity operation"], recommendation: "Inspect transformer loading, temperature, and phase balance before continued operation." },
  };
  const c = config[mode];
  const now = new Date();
  return {
    id: `ANM-${String(Math.floor(Math.random() * 900) + 100)}`,
    timestamp: now.toISOString(),
    location: "SEC-31",
    type: c.type,
    deviation: c.deviation,
    risk: c.risk,
    confidence: c.confidence,
    severity: riskBand(c.risk),
    status: "Investigation Required",
    description: c.description,
    causes: c.causes,
    recommendation: c.recommendation,
  };
}

function applyRuntimeToNodes(): NetworkNode[] {
  const anomaly = runtime.activeAnomaly;
  return nodes.map((node) => {
    const affected = anomaly && ["SEC-31", "FDR-12", "TR-07", "CHN-SUB-01"].includes(node.id);
    if (!affected) return { ...node, status: "normal", risk: Math.min(node.risk, 20) as number };
    const factor = node.kind === "section" ? 1 : node.kind === "feeder" ? 0.88 : node.kind === "transformer" ? 0.72 : 0.46;
    return { ...node, status: anomaly.severity === "CRITICAL" && node.kind !== "substation" ? "critical" : "warning", risk: Math.round(anomaly.risk * factor), current: Number((node.current * (1 + factor * 0.62)).toFixed(2)), power: Number((node.power * (1 + factor * 0.58)).toFixed(2)), load: Math.min(99, Math.round(node.load + anomaly.risk * factor * 0.28)), voltage: Number((node.voltage - factor * 0.18).toFixed(2)) };
  });
}

export function getRuntime() {
  return runtime;
}

export function getNetworkSnapshot() {
  const network = applyRuntimeToNodes();
  return {
    nodes: network,
    hierarchy: [
      { id: "CHN-SUB-01", label: "Chennai North", children: [{ id: "TR-04", label: "TR-04 · 10 MVA", children: [{ id: "FDR-04", label: "FDR-04", children: [] }] }, { id: "TR-07", label: "TR-07 · 10 MVA", children: [{ id: "FDR-12", label: "FDR-12", children: [{ id: "SEC-30", label: "SEC-30", children: [] }, { id: "SEC-31", label: "SEC-31", children: [] }] }] }] },
      { id: "CBE-SUB-02", label: "Coimbatore Central", children: [{ id: "TR-12", label: "TR-12 · 8 MVA", children: [{ id: "FDR-21", label: "FDR-21", children: [{ id: "SEC-18", label: "SEC-18", children: [] }] }] }] },
      { id: "MDU-SUB-03", label: "Madurai East", children: [{ id: "TR-18", label: "TR-18 · 8 MVA", children: [{ id: "FDR-31", label: "FDR-31", children: [{ id: "SEC-44", label: "SEC-44", children: [] }] }] }] },
    ],
  };
}

export function getSummary() {
  const anomaly = runtime.activeAnomaly;
  const health = anomaly ? Math.max(62, 95 - Math.round(anomaly.risk * 0.24)) : 95;
  return {
    systemOnline: true,
    simulated: true,
    networkHealth: health,
    substations: 10,
    transformers: 40,
    feeders: 80,
    sections: 250,
    activeAnomalies: anomaly ? 1 : 0,
    criticalAlerts: anomaly?.severity === "CRITICAL" ? 1 : 0,
    energyImbalance: anomaly?.type === "Energy Imbalance" ? 12.2 : 4.8,
    energySupplied: 12450,
    energyAccounted: anomaly?.type === "Energy Imbalance" ? 10930 : 11852,
    lastUpdated: runtime.updatedAt,
    mode: runtime.mode,
    activeAnomaly: anomaly,
    hardware: { connected: false, device: "ESP32-LAB-01", lastSeen: "12 min ago" },
  };
}

export function getLive() {
  const network = applyRuntimeToNodes();
  const active = network.find((n) => n.id === runtime.activeSection) ?? network.find((n) => n.id === "SEC-31")!;
  const actualMultiplier = runtime.activeAnomaly ? 1 + runtime.activeAnomaly.deviation / 180 : 1;
  return { ...active, current: Number((active.current * actualMultiplier).toFixed(2)), power: Number((active.power * actualMultiplier).toFixed(2)), history };
}

export function getAnomalies() {
  const list: AnomalyRecord[] = [];
  if (runtime.activeAnomaly) list.push(runtime.activeAnomaly);
  list.push({ id: "ANM-002", timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(), location: "TR-04", type: "Transformer Anomaly", deviation: 39, risk: 72, confidence: 0.88, severity: "HIGH", status: "Acknowledged", description: "Transformer load profile showed a sustained deviation from the normal electric signature.", causes: ["Thermal stress", "Load concentration"], recommendation: "Inspect transformer temperature and phase balance." });
  list.push({ id: "ANM-003", timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(), location: "FDR-21", type: "Energy Imbalance", deviation: 31, risk: 54, confidence: 0.81, severity: "MEDIUM", status: "Resolved", description: "Feeder accounting gap exceeded the prototype threshold for two intervals.", causes: ["Metering error", "Technical loss"], recommendation: "Reconcile feeder meters." });
  return list;
}

export function getEvents() {
  return runtime.events;
}

export function runSimulation(mode: SimScenario) {
  runtime = { ...runtime, mode, activeAnomaly: anomalyFor(mode), updatedAt: new Date().toISOString() };
  const label = mode === "normal" ? "Normal operation restored" : `${mode.replaceAll("-", " ")} scenario analyzed by Isolation Forest`;
  runtime.events = [{ id: `evt-${Date.now()}`, type: mode === "normal" ? "RESET" : "SIMULATION", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), message: label }, ...runtime.events].slice(0, 8);
  return { success: true, runtime: getRuntime(), summary: getSummary(), network: getNetworkSnapshot() };
}

export function acknowledgeAnomaly(id: string) {
  if (runtime.activeAnomaly?.id === id) runtime.activeAnomaly = { ...runtime.activeAnomaly, status: "Acknowledged" };
  return getAnomalies().find((a) => a.id === id) ?? null;
}

export function resolveAnomaly(id: string) {
  if (runtime.activeAnomaly?.id === id) runtime.activeAnomaly = { ...runtime.activeAnomaly, status: "Resolved" };
  return getAnomalies().find((a) => a.id === id) ?? null;
}

export function getSignature() {
  const live = getLive();
  const anomaly = runtime.activeAnomaly;
  return {
    section: runtime.activeSection,
    updatedAt: runtime.updatedAt,
    overallDeviation: anomaly?.deviation ?? 6,
    risk: anomaly?.risk ?? 12,
    features: [
      { key: "voltage", label: "Voltage", baseline: 5.0, current: live.voltage, unit: "V", delta: Number((((live.voltage - 5) / 5) * 100).toFixed(1)) },
      { key: "current", label: "Current", baseline: 1.2, current: live.current, unit: "A", delta: Number((((live.current - 1.2) / 1.2) * 100).toFixed(1)) },
      { key: "power", label: "Active power", baseline: 6.2, current: live.power, unit: "kW", delta: Number((((live.power - 6.2) / 6.2) * 100).toFixed(1)) },
      { key: "load", label: "Load percentage", baseline: 60, current: live.load, unit: "%", delta: Number((((live.load - 60) / 60) * 100).toFixed(1)) },
      { key: "pf", label: "Power factor", baseline: 0.98, current: anomaly ? 0.89 : 0.98, unit: "pf", delta: anomaly ? -9.2 : 0 },
    ],
  };
}

export function getEnergy() {
  const summary = getSummary();
  return {
    supplied: summary.energySupplied,
    accounted: summary.energyAccounted,
    difference: summary.energySupplied - summary.energyAccounted,
    differencePercentage: Number((((summary.energySupplied - summary.energyAccounted) / summary.energySupplied) * 100).toFixed(1)),
    trend: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({ day, supplied: 1700 + i * 70, accounted: 1610 + i * 64, losses: 90 + i * 6 })),
    opportunities: ["High-loss feeder detected in FDR-12", "Repeated abnormal load period near 19:00", "Transformer TR-07 operating near capacity", "Energy imbalance requires field investigation"],
  };
}

export function getReports() {
  const summary = getSummary();
  return { generatedAt: new Date().toISOString(), overview: summary, anomalyCount: getAnomalies().length, riskDistribution: { low: 18, medium: 7, high: 3, critical: summary.criticalAlerts }, network: { substations: 10, transformers: 40, feeders: 80, sections: 250 } };
}
