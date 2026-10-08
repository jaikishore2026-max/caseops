# CaseOps — Compliance Investigation Workbench

CaseOps is a synthetic compliance-investigation workbench with a server-owned event feed, a 10-minute sliding correlation window, explainable weighted risk scoring, and an en-IN INR formatter. It is a demonstration system: it does not connect to real accounts, a live external provider, or a durable database.

## Local development

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm dev
```

The development server listens on `PORT` (default 3000). The client requests `caseops.snapshot` through tRPC every 30 seconds; the backend generates one new synthetic event per minute. `caseops.applyAction` records analyst actions and exception approvals in server memory. Server-memory state resets after a process restart and is not shared across server replicas.

## Build and serve

```sh
pnpm build
pnpm start
```

`pnpm build` compiles the Vite client and bundles the Express/tRPC server. The managed Server capability is enabled for Preview; managed Database remains disabled. The site has not been published.

## Data and scoring

 The backend store is in `server/data/investigation.ts`, shared API contracts and INR/time formatters are in `shared/caseops.ts`, and tRPC endpoints are in `server/routers.ts`. Events are correlated against case-linked entity/reference nodes over a rolling 10-minute window. The score factors show signed point contributions from scenario baseline, event velocity, entity graph links, policy signals, and approved-exception deductions. Positive contributions are capped at 100 before exception deductions are applied. Scores are classified as Normal (<40), Ambiguous (40–69), or Suspicious (70+). Ambiguous open cases are routed to human review; each approved exception subtracts up to 18 points (to a floor of zero), up to the case's declared exception count, and adds an audit entry.

All monetary values use Indian grouping and INR, e.g. `₹1,00,000`. The top bar credits **Built by Jai Kishore G.V**. Do not configure live customer data or external providers without an approved data contract.
