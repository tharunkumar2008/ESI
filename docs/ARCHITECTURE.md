# ESI Architecture

## Data flow

```text
Low-voltage sensors / synthetic generator
                ↓
        Reading normalization
                ↓
     Electric Signature baseline
                ↓
   Deviation + confidence features
                ↓
       Transparent risk model
                ↓
  Anomaly category and localization
                ↓
    Dashboard, alerts, reports, map
```

## Current implementation

The WebDev project runs a React/Vite client and an Express/tRPC server in one managed process. `server/db.ts` contains the synthetic network topology, baseline readings, live state, simulation scenarios, anomaly records, risk-band mapping, signature features, and energy-balance calculations. `server/routers.ts` exposes the typed application contract consumed by the client through `client/src/lib/trpc.ts`.

The active demo state is deliberately fast and deterministic enough for a hackathon demonstration. `drizzle/schema.ts` defines the persistence boundary for users, topology, readings, signatures, anomalies, alerts, simulation events, and runtime state. A production implementation can replace the in-memory runtime functions with repository methods backed by the existing schema and then connect a Python analysis service for Isolation Forest, seasonal profiles, rolling z-scores, and validated utility baselines.

## Localization

Every network node carries a parent relationship. The demonstration route `CHN-SUB-01 → TR-07 → FDR-12 → SEC-31` is used for the controlled anomaly scenarios so judges can observe the full localization workflow.

## Safety and language

ESI deliberately avoids definitive theft claims. The UI and reports use possible-anomaly terminology and retain a human investigation step. Energy imbalance can have technical, metering, communications, transformer, estimation, or unauthorized-consumption causes; it is not automatically theft.
