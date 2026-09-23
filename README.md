# ESI — Electric Signature Intelligence

> Every electrical network has a signature. ESI understands when that signature changes.

ESI is a full-stack research and hackathon prototype for electricity-distribution monitoring and anomaly intelligence. It learns a normal electric signature for network entities, compares current telemetry with that baseline, calculates a transparent prototype risk score, and localizes suspicious behaviour from substation to transformer, feeder, and section.

## Prototype boundary

ESI ships with simulated network data and a controlled simulation centre. It is **not connected to a live electricity distribution grid**, does not claim official deployment by any utility, and does not independently establish electricity theft. Findings use terms such as **Possible Electricity Theft**, **Potential Tampering**, **Suspicious Electrical Pattern**, and **Investigation Required**. Real deployment would require validated utility data, cybersecurity controls, regulatory approval, field verification, and integration with authorized systems.

For hardware demonstrations, use low-voltage DC components only. Never connect development-board circuitry directly to 230V AC mains.

## What is implemented

The current application includes a dark control-centre interface, live backend-driven dashboard metrics, a signature comparison view, anomaly review queue with detail drawer, energy balance intelligence, network hierarchy, transformer and feeder cards, simulated network map, alert centre, simulation centre, reports export, settings and safety notices. The backend exposes typed tRPC procedures for the dashboard, live readings, network, signatures, anomalies, energy, simulation, alerts, reports, hardware status, and hardware readings.

The simulation actions update the live application state and execute the prototype analysis pipeline:

1. Generate an altered electrical reading pattern.
2. Compare it with the learned normal electric signature.
3. Calculate deviation, confidence, and risk using multiple signals.
4. Classify the possible anomaly category.
5. Localize the affected route to `TR-07 → FDR-12 → SEC-31`.
6. Update dashboard metrics, map nodes, alert cards, and investigation guidance.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Lucide, Recharts |
| App server | Express, tRPC 11, TypeScript |
| Persistence schema | Drizzle ORM, MySQL/TiDB-compatible tables |
| Auth foundation | Manus OAuth session infrastructure |
| Prototype analysis | Deterministic signature comparison and transparent multi-signal risk engine; the production extension point is `server/db.ts` where Isolation Forest-backed Python services can be connected |
| Runtime | Node.js 22, pnpm |

## Project structure

```text
client/
  src/
    pages/Home.tsx              # control-centre experience and feature views
    index.css                   # ESI dark theme and motion tokens
    App.tsx                     # application shell and route wiring
server/
  db.ts                         # synthetic network state and intelligence services
  routers.ts                    # typed ESI tRPC API procedures
  esi.intelligence.test.ts     # pipeline tests
  _core/                        # WebDev runtime and auth infrastructure
drizzle/
  schema.ts                     # users, topology, readings, signatures, anomalies, alerts
  migrations/                   # generated schema migration
hardware/esp32/README.md        # low-voltage hardware integration guide
docs/ARCHITECTURE.md            # implementation notes and extension points
```

## Installation and running

```bash
pnpm install
pnpm drizzle-kit generate
pnpm dev
```

The WebDev runtime starts the server and Vite client together. The development preview is exposed by the project environment. For a production build:

```bash
pnpm run build
pnpm start
```

Useful verification commands:

```bash
pnpm exec tsc --noEmit
pnpm test
```

## Demo walkthrough

1. Open the Executive dashboard and confirm `SYSTEM ONLINE` and `SIMULATED DATA`.
2. Open **Simulation Centre**.
3. Run **Simulate potential meter tampering**. The UI will show a deviation, risk score, critical route, and investigation recommendation.
4. Visit **Anomaly Intelligence** for the detailed evidence signals and possible causes.
5. Open **Live Network Map** to inspect the highlighted `SEC-31` route.
6. Run **Normal operation** to reset the prototype state.

The default simulated operating state is normal with approximately 95% network health and no critical alerts.

## API procedures

The implementation uses typed tRPC procedures under `esi` rather than ad-hoc browser fetch wrappers.

| Procedure | Purpose |
|---|---|
| `esi.summary` | Dashboard metrics, health, imbalance, hardware state |
| `esi.live` | Latest section telemetry and load history |
| `esi.network` | Nodes and hierarchy from substation to section |
| `esi.signatures` | Electric Signature features and deviations |
| `esi.signatureHistory` | Historical chart series |
| `esi.anomalies` | Prioritized anomaly queue |
| `esi.events` | Intelligence activity stream |
| `esi.energy` | Energy supplied, accounted, difference, and opportunities |
| `esi.reports` | Report summary data |
| `esi.simulate` | Execute normal or abnormal scenarios |
| `esi.acknowledge` / `esi.resolve` | Update anomaly workflow state |
| `esi.hardwareStatus` | ESP32 connection status |
| `esi.hardwareReading` | Accept a low-voltage prototype reading |

## Database

The Drizzle schema includes users, substations, transformers, feeders, sections, readings, electric signatures, anomalies, alerts, simulation events, and runtime state. The prototype intelligence layer keeps the active demo state in memory for fast demonstration; the schema is ready for persisting readings, signatures, anomalies, and events in a MySQL/TiDB deployment.

## Risk model

The prototype risk score is normalized from 0–100 using multiple signals: signature deviation, energy imbalance, historical deviation, load abnormality, duration/repetition, and network context. The weights are intentionally transparent and are **not scientifically validated**. A score of 0–29 is low, 30–59 medium, 60–79 high, and 80–100 critical.

## Hardware integration

See [`hardware/esp32/README.md`](hardware/esp32/README.md). The intended payload is:

```json
{
  "device_id": "ESP32-LAB-01",
  "voltage": 5.0,
  "current": 1.2,
  "power": 6.0,
  "energy": 0.04,
  "timestamp": "2026-09-21T14:32:00Z"
}
```

Use a 5V or 12V DC supply, INA219 sensor, DC loads, LEDs, relay, buzzer, and OLED. Do not connect the prototype electronics to mains voltage.

## Future scope

Replace the deterministic demo state with streamed sensor readings, persist 30-day 15-minute telemetry, train Isolation Forest and seasonal baselines on validated utility data, add Leaflet/GIS layers, integrate field-workflow assignments, add PostgreSQL production migrations, and introduce authorized utility access controls.

## Bilingual government-style portal layer

The UI now supports English and Tamil through the language toggle in the top header. Primary navigation, dashboard hero copy, key metrics, feature headings, portal messaging, and the collaboration-readiness settings panel have Tamil translations. The visual system uses a public-service portal treatment: navy institutional navigation, white content surfaces, restrained blue accents, accessibility-minded contrast, a utility-services strip, and a clear simulated-data badge.

The portal includes links to the current public service sites discovered from official utility pages: [TNPDCL](https://www.tnpdcl.org/en/tnpdcl/), [TNEB Ltd](https://www.tnebltd.org/en/tneb/), and [TNPDCL Quick Pay](https://www.tnebnet.org/qwp/qpay). These are external links only. ESI does not claim to be owned, operated, endorsed, or officially integrated with TNEB, TANGEDCO, or TNPDCL without an authorized API, MoU, branding approval, and utility security review.

## Leadership reference card

The dashboard includes a neutral **Leadership reference** card with corrected office titles: **Shri Narendra Modi — Prime Minister of India** and **Thiru C. Joseph Vijay — Chief Minister of Tamil Nadu**. The portraits are displayed as a reference only, with an explicit non-endorsement disclaimer and links to the [Prime Minister of India](https://www.pmindia.gov.in/en/) and [Tamil Nadu government minister list](https://www.tn.gov.in/minister_list.php). This card does not imply government ownership, endorsement, or official integration of ESI.

## Backend concurrency hardening

The server is now hardened for a practical **200 concurrent-user prototype target**, subject to the capacity of the selected WebDev runtime and database tier. The backend uses a reusable MySQL/TiDB connection pool with a configurable `DB_POOL_SIZE` (default 10), bounded request bodies, keep-alive and request timeouts, proxy-aware API throttling, and graceful SIGTERM/SIGINT draining. Anonymous public telemetry reads skip unnecessary session verification work, while authenticated requests continue through the Manus OAuth session path.

Operational probes are available at `/healthz` for process health and `/readyz` for database readiness. The tRPC surface is protected by a per-client rolling request window to prevent runaway traffic; the default is 2,400 requests per minute per client key and can be tuned in `server/_core/index.ts` for a trusted gateway or production rate-limit service. The pool, rate limit, request timeout, and connection settings are intentionally conservative defaults for the prototype and should be load-tested again after connecting real utility data or changing the hosting/database tier.

The 200-request concurrency smoke test completed with **200/200 successful responses** against the public summary endpoint. This validates the current prototype path; it is not a substitute for a sustained production load test with authenticated users, real database traffic, telemetry ingestion, and utility security controls.
