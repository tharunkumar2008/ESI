import { describe, expect, it } from "vitest";
import { getEnergy, getNetworkSnapshot, getSignature, getSummary, runSimulation } from "./db";

describe("ESI intelligence pipeline", () => {
  it("starts in normal operation with a stable signature", () => {
    runSimulation("normal");
    const summary = getSummary();
    const signature = getSignature();
    expect(summary.mode).toBe("normal");
    expect(summary.activeAnomalies).toBe(0);
    expect(signature.overallDeviation).toBeLessThan(10);
    expect(signature.risk).toBeLessThan(30);
  });

  it("creates a potential meter anomaly and localizes the affected route", () => {
    runSimulation("meter-anomaly");
    const summary = getSummary();
    const network = getNetworkSnapshot();
    const affected = new Map(network.nodes.map((node) => [node.id, node]));
    expect(summary.activeAnomaly?.type).toBe("Potential Meter Tampering");
    expect(summary.activeAnomaly?.risk).toBe(87);
    expect(summary.activeAnomaly?.status).toBe("Investigation Required");
    expect(affected.get("SEC-31")?.status).toBe("critical");
    expect(affected.get("FDR-12")?.status).toBe("critical");
    expect(affected.get("TR-07")?.status).toBe("critical");
  });

  it("updates the energy balance when the energy imbalance scenario runs", () => {
    runSimulation("energy-imbalance");
    const energy = getEnergy();
    expect(energy.difference).toBeGreaterThan(0);
    expect(energy.differencePercentage).toBeGreaterThan(8);
    expect(getSummary().activeAnomaly?.type).toBe("Energy Imbalance");
  });
});
