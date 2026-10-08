# CaseOps outcomes

## [x] 1. Operational shell and synthetic scenario identity
- The website feels like a functional internal compliance investigation tool built by an engineering team, not an AI startup landing page, Dribbble concept, or cyberpunk game interface.
- Prioritize information over decoration: compact panels, sharp or slightly rounded corners, thin borders, clear tables, dense information, small status indicators, realistic timestamps, consistent spacing, functional controls, subtle hover states, simple useful charts, and practical empty space.
- Avoid excessive glassmorphism, giant gradient text, purple/blue gradient backgrounds, excessive neon, floating glowing cards, unnecessary AI sparkles, "AI-powered" labels everywhere, generic stock illustrations, huge rounded cards, excessive animations, fake futuristic HUD elements, meaningless charts, and overly perfect symmetrical layouts. If an element looks impressive but does not help investigation, remove it.
- Use white/gray for normal information, green for normal/cleared, amber for ambiguous, red for Suspicious risk, and one subtle accent color; do not make everything glow.
- Keep a persistent synthetic-data disclosure and scenario label, including “Synthetic dataset: Scenario 02”; no screen implies connection to real accounts or real-world events.
- Use believable identifiers such as USR-042, ACC-1842, TXN-10427, DEV-91, CASE-1042, and POL-003, with realistic dates/times and event descriptions.

## [x] 2. Operational overview and investigation workspace
- Show a compact operational header with initial ACTIVE CASES 24, SUSPICIOUS 7, AMBIGUOUS 11, and EVENTS TODAY 1,284; update counts from the live snapshot rather than freezing them.
- Give most of the screen space to investigation/event data; the event table and investigation timeline visually dominate the dashboard.
- Include dataset context, correlation window, and a realistic live last-updated timestamp, plus practical details such as “Showing 1–20 of 1284 events”, “Replay speed: 1×”, “Synthetic dataset: Scenario 02”, “Correlation window: 10 min”, “No additional evidence found”, and reviewed-exception counts.
- Include simple useful operational charts and status breakdowns limited to investigation-relevant risk and event-volume trends.

## [x] 3. Event correlation and controls
- Center the investigation workspace on a dominant event table with synthetic identifiers, timestamps, entities, event descriptions, policy references, risk levels, and correlation statuses.
- Provide practical table operations including search, filters, sortable columns, row selection, pagination text such as “Showing 1–20 of 1284 events”, and subtle hover and selected states.
- Display every matched case ID for active-window graph correlations, including secondary graph matches when an event has a direct case ID; label expired records outside the 10-minute window without presenting active links.
- Show a chronological investigation timeline with event descriptions; Replay advances/highlights entries, Pause freezes the current entry, the selected speed changes the step interval, and Reset restores the replay cursor and speed.
- Use deterministic, explainable terminology: “Correlation threshold exceeded.”, “Investigation Summary”, “Risk Assessment”, “Analyst Action”, and “Evidence”; avoid “AI Insight”, “Smart Risk Detection”, “AI Recommendation”, and “Magic.”

## [x] 4. Case review and evidence
- Provide a case queue for synthetic investigations such as CASE-1042, with severity, status, assigned analyst, opened/updated times, exception counts, and concise deterministic trigger reasons.
- Provide a detailed case view containing Investigation Summary, Risk Assessment, matched policy references, linked synthetic accounts/devices/transactions, and explicit correlation rationale.
- Provide an evidence panel for linked records and review outcomes, including clear states such as “No additional evidence found” and reviewed-exception counts.

## [x] 5. Analyst actions and audit trail
- Provide Analyst Action controls for assigning, escalating, clearing, adding notes, requesting review, and closing a case, with confirmation and visible audit-friendly state changes.
- Ensure case-action changes are visibly reflected in the selected case and its chronology so an analyst can see what changed.

## [x] 6. INR currency and Indian-number formatting
- Scan frontend UI components, mock data, backend schemas, and database seed/migration files for USD/dollar currency references; replace display values or labels with INR (₹).
- Format displayed monetary values with Indian grouping (for example ₹1,00,000) using `Intl.NumberFormat` with locale `en-IN`, currency `INR`, and `maximumFractionDigits: 0` wherever currency is formatted.
- Update monetary table cells, dashboards, tooltips, and chart labels wherever monetary values appear.

## [x] 7. Server-backed dynamic synthetic snapshot
- Move case and event data out of the browser's static data module and expose a backend snapshot endpoint returning cases, events, audit entries, event-volume data, and a live server timestamp.
- Keep the sample dataset clearly synthetic; do not imply connection to a real external provider or real accounts when none was specified.
- Keep managed Database disabled; disclose that in-memory demo state resets when the server restarts or a separate server instance handles a request.

## [x] 8. Automatic refresh and server-side analyst actions
- Fetch the snapshot through the existing typed tRPC/TanStack Query stack and refetch automatically every 30 seconds, updating metrics, event rows, queue data, timeline, and last-updated timestamp.
- Generate new synthetic events on the backend on a 60-second cadence, with current timestamps and INR-formatted amounts where present.
- Send analyst actions to a backend mutation and refresh the snapshot so case state and audit entries update from the server response.

## [x] 9. Minimal creator attribution and clean branding
- Place the unobtrusive text “Built by Jai Kishore G.V” at the very top of the application dashboard.
- Remove organization/team-name references from rendered UI content, headers, footers, and page metadata; use only the CaseOps product identity and the requested creator attribution.

## [x] 10. Sliding-window entity correlation, dynamic scoring, and exception review
- Feed incoming synthetic mixed events into a rolling 10-minute correlation window; match both explicit case IDs and event entity/reference IDs against linked-case entity graphs, including events without a preassigned case ID.
- Return all matching case IDs only while each event timestamp is within the active window; keep older events in the stream history but do not correlate them or include them in a case chronology.
- Recalculate explainable weighted risk scores from recent event velocity, linked entities/references, policy signals, and approved exceptions; use the risk categories Normal, Suspicious, and Ambiguous, with Suspicious at 70+, Ambiguous from 40–69, and Normal below 40.
- Show risk-factor bars as the actual signed score-point contributions applied by the formula, including negative approved-exception points; do not display percentages produced by a different weighting formula.
- Apply positive factors in the fixed order baseline, 10-minute velocity, entity graph, then policy signals; limit each to remaining capacity up to 100, show only applied points (and identify cap-limited potential in its rationale), then subtract approved-exception points with a floor at zero.
- Allow an analyst to approve up to the case's exception count; each approved exception lowers the score by up to 18 points, immediately refreshes the live score, and creates a visible audit entry.
- Route cases classified Ambiguous to human review and reflect that review state in the live case queue and chronology.

## [x] 11. Functional mixed-event replay
- Replay starts at the first displayed timeline entry and advances the active entry at a cadence determined by the selected speed.
- Pause stops the cursor on its active entry; Reset returns the cursor to the beginning and restores the default speed; timeline highlight and progress reflect actual replay position.
- Continue accepting live snapshot updates while replay controls remain operable.
