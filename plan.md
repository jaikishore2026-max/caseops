# CaseOps implementation plan

## Product and implementation

CaseOps is a single-page internal compliance workbench for **AI-15 Adaptive Compliance Investigation & Evidence Engine** workflows. The only feed is a clearly disclosed synthetic Scenario 02 dataset; it is not connected to real accounts or an external provider. Enable the managed Server capability (one-way), keep Database off, and expose a typed tRPC snapshot query and analyst-action mutation. The backend owns the synthetic case/event/audit store in process memory, emits one new mixed event per minute, and returns current server timestamps. The React Query client polls every 30 seconds and refreshes after mutations; no page reload is required. Memory state resets on server restart and is not shared across server replicas.

Correlate events to cases in a 10-minute sliding window using either their explicit case ID or intersections between event entity/reference IDs and each case's linked-entity graph. Return all matched case IDs for events in the active window, including unassigned events; expired events remain in the history table but are no longer correlated or included in a case chronology. Recompute each case score from explainable point contributions applied in a fixed order: scenario baseline, recent-event velocity, distinct linked entities/edges, then policy signals. Each positive factor is limited to the remaining capacity up to 100, and approved-exception deductions are applied after that cap with a floor at zero. Factor bars and labels show these exact signed applied points. Classify **Normal** below 40, **Ambiguous** from 40 through 69, and **Suspicious** from 70 upward. Ambiguous cases route to human review. Analysts can approve up to the case's declared exception count; each approval lowers the score by up to 18 points and adds an audit entry.

Use the existing React 19, TypeScript, Vite, Express, tRPC, TanStack Query, Tailwind CSS 4, and Lucide stack. Format every monetary value through a shared `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })` helper. Put the minimal text attribution “Built by Jai Kishore G.V” at the top of the dashboard and remove team-name references from visible content and metadata. Run with `pnpm dev`; build with `pnpm build`. Do not publish the site.

## Screen and interaction

The screen is an operational workspace: compact masthead and context line, low-height metrics strip, then a three-part investigation bench. The case queue and inspector flank the dominant event stream; a live mixed-event chronology/replay sits beneath it. At narrow widths the sections stack while the selected case remains accessible. Search, severity/status filters, sorting, row selection, pagination, and export remain functional. The event feed, case queue, live volume strip, and timeline all consume the backend snapshot and update during polling. Replay starts at the first displayed entry, Pause freezes the active entry, speed changes the interval between entries, Reset restores the cursor/speed, and the active event plus progress are visible. Case actions—including assigning, escalating, clearing, adding notes, requesting review, closing, and approving an exception—mutate the server store and append an audit entry; disposition changes and exception approvals require confirmation.

Keep all event, person, account, device, policy, and case records synthetic and use short identifiers and current timestamps. Explain window velocity, entity links, matched policies, approved exceptions, and the resulting risk score. No decorative imagery or unneeded charts are planned; the small volume display is computed from actual synthetic events in the recent six-hour window.

## Design direction

- **Design Movement:** restrained compliance-operations terminal, drawing on the information hierarchy of a Bloomberg workstation and enterprise risk/SOC software without game-like or promotional styling.
- **Core Principles:** prioritize scan speed; explain risk and correlation; make changes auditable; keep synthetic status and data freshness visible.
- **Color Philosophy:** neutral white, cool gray, and charcoal carry normal information. Green means normal/cleared, amber means ambiguous/review, and red marks Suspicious. Muted mineral teal is the single brand accent; no gradients or glow effects.
- **Layout Paradigm:** left-to-right investigation bench—case queue, dominant event stream and chronology, selected-case inspector—under a compact operational header.
- **Signature Elements:** custom ledger mark built from three offset rules; thin severity rules and small status dots; tabular numerals/monospaced identifiers.
- **Interaction Philosophy:** direct, predictable controls; filters update immediately; selected records remain obvious; server actions have visible audit outcomes; exception approval is deliberate and score changes are explained.
- **Animation:** no entrance, parallax, ambient, or looping animation. Use short hover/selection transitions and respect reduced-motion preferences.
- **Typography System:** system UI sans for navigation and prose; platform monospace for IDs, timestamps, scores, and counts; compact headings.
- **Brand Essence:** “An explainable investigation bench for compliance analysts.” Personality: precise, composed, accountable.
- **Brand Voice:** concise and operational. Examples: “Correlation threshold exceeded.” “No additional evidence found.”
- **Wordmark & Logo:** CaseOps wordmark beside a custom three-rule ledger glyph.
- **Signature Brand Color:** muted mineral teal `#2f7774`, reserved for active and primary cues.

## Project structure

- `client/src/pages/Home.tsx` — polling, loading/error state, filtering, selection, active-window entity-linked timeline, mutation orchestration, and export.
- `client/src/components/ops/TopBar.tsx` — compact branding and “Built by Jai Kishore G.V” attribution.
- `client/src/components/ops/CaseQueue.tsx` — live case list, risk/status filters, and human-review routing.
- `client/src/components/ops/MetricStrip.tsx` and `EventTable.tsx` — snapshot-derived counts, volume, timestamps, active matched case IDs, and mixed event rows.
- `client/src/components/ops/CaseInspector.tsx` and `ActionDialog.tsx` — signed applied score-point explanations, exception approval, and confirmed analyst actions.
- `client/src/components/ops/InvestigationTimeline.tsx` — polling-fed event/audit chronology with an advancing, speed-controlled replay cursor.
- `shared/caseops.ts` — shared case/event/action types plus Indian-number INR/time formatters.
- `server/data/investigation.ts` — synthetic ingestion store, ten-minute case/entity graph correlation, fixed-order capped risk scoring, server timestamps, event-volume buckets, and analyst/audit actions.
- `server/routers.ts` — typed public synthetic snapshot query and action mutation over tRPC.
- `server/data/investigation.test.ts` — coverage for INR formatting, generated and entity-correlated events, sliding-window expiry, score contributions, exception changes, and audit actions.
- `client/src/pages/ComponentShowcase.tsx` — example currency cells localized with the shared formatter.
- `client/src/ops.css` and `client/src/queue.css` — restrained palette, responsive workbench, and risk/status styling.
- `client/public/manus-routes.json`, `client/public/favicon.svg`, `client/index.html`, and `app.config.ts` — route declaration, icon, page metadata, and project branding.
- `TODO.md` — preserved product criteria and separate implementation outcomes.

The project uses a volatile synthetic backend only: no real provider, account data, authentication, managed database, or durable persistence. The Server feature is enabled one-way only to serve Preview API calls; the website is not published and automatic publication remains disabled. Connect an approved external feed or durable database only after its access and data contract are provided.
