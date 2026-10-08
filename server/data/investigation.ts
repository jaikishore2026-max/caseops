import type {
  AnalystActionInput,
  AnalystActionResult,
  CaseOpsSnapshot,
  CaseRecord,
  EventRecord,
  RiskBand,
  TimelineItem,
} from "../../shared/caseops";
import { formatINR, formatIndiaDate, formatIndiaDateTime, formatIndiaTime } from "../../shared/caseops";

const EVENT_SEED_COUNT = 1_284;
const LIVE_EVENT_INTERVAL_MS = 60_000;
const CORRELATION_WINDOW_MS = 10 * 60_000;
const MAX_EVENT_COUNT = 5_000;
const analysts = ["Mira Patel", "Jon Chen", "Dina Ali", "Owen Brooks", "Sana Iyer"];

const suspiciousTriggers = [
  "Transfer velocity after beneficiary change",
  "Cross-channel cash-out after credential reset",
  "Repeated payout attempts across new devices",
  "High-value transfer to a recently added payee",
  "Unusual login followed by profile changes",
  "Multiple failed challenges before successful transfer",
  "Outbound amount exceeds account baseline",
];
const ambiguousTriggers = [
  "Sanctions-name near match on secondary beneficiary",
  "Location variance requires analyst context",
  "Device fingerprint partially overlaps a known record",
  "Transfer pattern differs from the 30-day baseline",
  "Beneficiary details require secondary review",
  "Two policy signals fall within the correlation window",
  "Account profile change followed by a sign-in",
  "Counterparty address shares a partial match",
  "Authentication retry pattern is above baseline",
  "Transaction timing is atypical for this account",
  "Cross-account reference needs manual review",
];
const normalTriggers = [
  "Routine limit change with matching authentication",
  "New device confirmed through a step-up challenge",
  "Beneficiary update verified by the account holder",
  "Transfer pattern remains within expected range",
  "Low-confidence alert with no linked exception",
  "Routine profile update; no additional evidence found",
];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const classifyRisk = (score: number): RiskBand => score >= 70 ? "Suspicious" : score >= 40 ? "Ambiguous" : "Normal";

function makeCase(index: number, now: number): CaseRecord {
  const initialRisk: RiskBand = index < 7 ? "Suspicious" : index < 18 ? "Ambiguous" : "Normal";
  const reasons = initialRisk === "Suspicious" ? suspiciousTriggers : initialRisk === "Ambiguous" ? ambiguousTriggers : normalTriggers;
  const baselineRiskScore = initialRisk === "Suspicious" ? 76 + ((index * 7) % 19) : initialRisk === "Ambiguous" ? 44 + ((index * 5) % 25) : 18 + ((index * 3) % 17);
  const id = `CASE-${1042 - index}`;
  const account = `ACC-${String(1842 + (index % 17) * 13).padStart(4, "0")}`;
  const user = `USR-${String(42 + index).padStart(3, "0")}`;
  const device = `DEV-${String(91 + index).padStart(2, "0")}`;
  const policy = index < 7 ? "POL-003" : index < 18 ? "POL-011" : "POL-006";
  const trigger = reasons[index % reasons.length];
  const status: CaseRecord["status"] = index === 0 ? "Open" : index % 6 === 0 ? "Escalated" : index % 3 === 0 ? "Under review" : "Open";

  return {
    id,
    risk: initialRisk,
    status,
    analyst: index % 9 === 4 ? "Unassigned" : analysts[index % analysts.length],
    openedAt: formatIndiaDateTime(now - (22 + index * 7) * 60_000),
    updatedAt: formatIndiaDateTime(now - (2 + index * 2) * 60_000),
    exceptions: index === 0 ? 2 : index % 4,
    approvedExceptions: 0,
    baselineRiskScore,
    riskScore: baselineRiskScore,
    windowEventCount: 0,
    linkedEntityCount: 4,
    summary: `${trigger}. Linked activity is reviewed against the account's recent baseline, connected entity records, and applicable policy window.`,
    trigger,
    policies: index === 0 ? ["POL-003 · Transaction velocity", "POL-011 · Beneficiary change"] : [
      `${policy} · ${initialRisk === "Suspicious" ? "Transaction monitoring" : initialRisk === "Ambiguous" ? "Enhanced review" : "Account integrity"}`,
      "POL-006 · Authentication context",
    ],
    linkedEntities: [user, account, device, `TXN-${10427 + index}`],
    factors: [{ label: "Baseline risk", contribution: baselineRiskScore, rationale: `Scenario baseline contributes ${baselineRiskScore} points` }],
  };
}

type EventSeed = Omit<EventRecord, "id" | "timestamp" | "time" | "activity" | "amountInr"> & {
  activityLabel: string;
  amountInr?: number;
};

const eventSeeds: EventSeed[] = [
  { entity: "USR-042", activityLabel: "Correlation threshold exceeded for outbound velocity", policy: "POL-003", risk: "Suspicious", correlation: "Matched", caseId: "CASE-1042", reference: "TXN-10427" },
  { entity: "ACC-1842", activityLabel: "Step-up challenge completed successfully", policy: "POL-006", risk: "Normal", correlation: "Matched", caseId: "CASE-1042", reference: "AUTH-2184" },
  { entity: "USR-119", activityLabel: "Beneficiary name screening returned a close match", policy: "POL-011", risk: "Ambiguous", correlation: "Review", caseId: "CASE-1035", reference: "PAY-8821" },
  { entity: "ACC-2091", activityLabel: "Profile address updated; prior address retained", policy: "POL-006", risk: "Ambiguous", correlation: "Review", caseId: "CASE-1039", reference: "PRF-5108" },
  { entity: "TXN-10431", activityLabel: "Outbound transfer queued for beneficiary review", amountInr: 8_450, policy: "POL-003", risk: "Suspicious", correlation: "Matched", caseId: "CASE-1042", reference: "ACC-9081" },
  { entity: "ACC-1842", activityLabel: "New beneficiary added to account", policy: "POL-011", risk: "Suspicious", correlation: "Matched", caseId: "CASE-1042", reference: "ACC-9081" },
  { entity: "TXN-10427", activityLabel: "Outbound transfer initiated", amountInr: 8_450, policy: "POL-003", risk: "Suspicious", correlation: "Matched", caseId: "CASE-1042", reference: "ACC-9081" },
  { entity: "DEV-91", activityLabel: "First-seen device registered for USR-042", policy: "POL-006", risk: "Suspicious", correlation: "Matched", caseId: "CASE-1042", reference: "ACC-1842" },
  { entity: "USR-042", activityLabel: "Multi-factor credential reset completed", policy: "POL-006", risk: "Suspicious", correlation: "Matched", caseId: "CASE-1042", reference: "ACC-1842" },
  { entity: "ACC-1842", activityLabel: "Beneficiary details verified by account holder", policy: "POL-011", risk: "Ambiguous", correlation: "Review", caseId: "CASE-1042", reference: "USR-042" },
  { entity: "USR-113", activityLabel: "Password reset requested from known network", policy: "POL-006", risk: "Ambiguous", correlation: "Review", caseId: "CASE-1039", reference: "DEV-77" },
  { entity: "TXN-10419", activityLabel: "Scheduled transfer reviewed against baseline", amountInr: 2_100, policy: "POL-003", risk: "Normal", correlation: "Matched", caseId: "CASE-1039", reference: "ACC-2091" },
  { entity: "DEV-77", activityLabel: "Device trust challenge passed", policy: "POL-006", risk: "Normal", correlation: "Matched", caseId: "CASE-1041", reference: "USR-043" },
  { entity: "ACC-2191", activityLabel: "Beneficiary bank details updated", policy: "POL-011", risk: "Ambiguous", correlation: "Review", caseId: "CASE-1037", reference: "USR-045" },
  { entity: "TXN-10415", activityLabel: "International transfer held for policy check", amountInr: 1_280, policy: "POL-003", risk: "Suspicious", correlation: "Matched", caseId: "CASE-1040", reference: "ACC-1873" },
  { entity: "USR-052", activityLabel: "Login from recognized device", policy: "POL-006", risk: "Normal", correlation: "No match", caseId: null, reference: "DEV-106" },
];

const entities = ["USR-042", "ACC-1842", "DEV-91", "TXN-10427", "USR-058", "ACC-1973", "DEV-104", "TXN-10451"];
const genericActivities: Array<{ label: string; amountInr?: number }> = [
  { label: "Login from recognized network" },
  { label: "Beneficiary details updated" },
  { label: "Outbound transfer initiated", amountInr: 1_240 },
  { label: "Step-up challenge completed" },
  { label: "New device registered for account" },
  { label: "Profile detail change reviewed" },
  { label: "Transfer held for policy check", amountInr: 2_100 },
  { label: "Authentication retry above baseline" },
];
const policies = ["POL-003", "POL-006", "POL-011", "POL-014"];

function formatActivity(label: string, amountInr?: number): string {
  return amountInr === undefined ? label : `${label} · ${formatINR(amountInr)}`;
}

function buildInitialEvent(index: number, now: number, cases: CaseRecord[]): EventRecord {
  const ageMs = index < eventSeeds.length
    ? index * 26_000
    : eventSeeds.length * 26_000 + (index - eventSeeds.length) * 18_000;
  const timestamp = new Date(now - ageMs).toISOString();
  const id = `EVT-${String(24_001 + index).padStart(5, "0")}`;

  if (index < eventSeeds.length) {
    const { activityLabel, amountInr, ...seed } = eventSeeds[index];
    return { id, timestamp, time: formatIndiaTime(timestamp), ...seed, amountInr, activity: formatActivity(activityLabel, amountInr) };
  }

  const caseRecord = index % 5 === 0 ? undefined : cases[(index * 7) % cases.length];
  const risk: RiskBand = caseRecord?.risk ?? (index % 9 === 0 ? "Suspicious" : index % 4 === 0 ? "Ambiguous" : "Normal");
  const policy = policies[index % policies.length];
  const activity = genericActivities[index % genericActivities.length];
  return {
    id,
    timestamp,
    time: formatIndiaTime(timestamp),
    entity: entities[index % entities.length],
    activity: formatActivity(activity.label, activity.amountInr),
    amountInr: activity.amountInr,
    policy,
    risk,
    correlation: caseRecord ? (risk === "Ambiguous" ? "Review" : "Matched") : "No match",
    caseId: caseRecord?.id ?? null,
    reference: `TXN-${10427 + index}`,
  };
}

function buildLiveEvent(sequence: number, timestampMs: number, cases: CaseRecord[]): EventRecord {
  const caseRecord = cases[sequence % cases.length];
  const amountInr = [3_400, 8_450, 12_500, 1_280, 100_000][sequence % 5];
  const labels = [
    "Outbound transfer reviewed against the live policy window",
    "Transfer velocity signal refreshed",
    "Beneficiary change correlated with account activity",
    "Scheduled transfer reviewed against baseline",
    "High-value transaction held for analyst review",
  ];
  const timestamp = new Date(timestampMs).toISOString();
  const index = EVENT_SEED_COUNT + sequence;
  const entity = entities[(sequence + 1) % entities.length];
  const reference = `TXN-${10_427 + index}`;
  const caseId = sequence % 4 === 0 ? null : caseRecord.id;
  const hasEntityLink = caseRecord.linkedEntities.includes(entity) || caseRecord.linkedEntities.includes(reference);
  const risk: RiskBand = sequence % 5 === 0 ? "Suspicious" : sequence % 3 === 0 ? "Ambiguous" : caseRecord.risk;

  return {
    id: `EVT-${String(24_001 + index).padStart(5, "0")}`,
    timestamp,
    time: formatIndiaTime(timestamp),
    entity,
    activity: formatActivity(labels[sequence % labels.length], amountInr),
    amountInr,
    policy: policies[sequence % policies.length],
    risk,
    correlation: caseId || hasEntityLink ? (risk === "Ambiguous" ? "Review" : "Matched") : "No match",
    caseId,
    reference,
  };
}

function buildEventVolume(events: EventRecord[], now: number): number[] {
  const buckets = Array<number>(6).fill(0);
  for (const event of events) {
    const ageHours = Math.floor((now - Date.parse(event.timestamp)) / 3_600_000);
    if (ageHours >= 0 && ageHours < buckets.length) buckets[buckets.length - 1 - ageHours] += 1;
  }
  return buckets;
}

const actionMessages: Record<AnalystActionInput["action"], string> = {
  assign: "Assigned to Mira Patel",
  escalate: "Escalated for senior review",
  clear: "Case marked cleared",
  "add-note": "Analyst note added",
  "request-review": "Secondary review requested",
  close: "Case closed",
  "approve-exception": "Exception approved; risk score adjusted",
};
const actionStatuses: Partial<Record<AnalystActionInput["action"], CaseRecord["status"]>> = {
  escalate: "Escalated",
  clear: "Cleared",
  "request-review": "Under review",
  close: "Closed",
};
const actionLabels: Record<AnalystActionInput["action"], string> = {
  assign: "Case assigned",
  escalate: "Case escalated",
  clear: "Case cleared",
  "add-note": "Analyst note added",
  "request-review": "Human review requested",
  close: "Case closed",
  "approve-exception": "Exception approved",
};

export function createCaseOpsStore(startAt = Date.now()) {
  const cases = Array.from({ length: 24 }, (_, index) => makeCase(index, startAt));
  const events = Array.from({ length: EVENT_SEED_COUNT }, (_, index) => buildInitialEvent(index, startAt, cases));
  const auditEntries: Record<string, TimelineItem[]> = {};
  let lastLiveEventAt = startAt;
  let liveSequence = 0;

  function appendDueEvents(now: number) {
    const dueCount = Math.max(0, Math.floor((now - lastLiveEventAt) / LIVE_EVENT_INTERVAL_MS));
    for (let due = 1; due <= dueCount; due += 1) {
      const eventAt = lastLiveEventAt + due * LIVE_EVENT_INTERVAL_MS;
      events.unshift(buildLiveEvent(liveSequence, eventAt, cases));
      liveSequence += 1;
    }
    if (dueCount > 0) lastLiveEventAt += dueCount * LIVE_EVENT_INTERVAL_MS;
    if (events.length > MAX_EVENT_COUNT) events.length = MAX_EVENT_COUNT;
  }

  function recalculateCaseScores(now: number): Map<string, string[]> {
    const cutoff = now - CORRELATION_WINDOW_MS;
    const windowEvents = new Map<string, EventRecord[]>();
    const casesByEntity = new Map<string, Set<string>>();
    const caseIds = new Set(cases.map((record) => record.id));
    const correlatedCaseIds = new Map<string, string[]>();

    for (const record of cases) {
      for (const entity of record.linkedEntities) {
        const links = casesByEntity.get(entity) ?? new Set<string>();
        links.add(record.id);
        casesByEntity.set(entity, links);
      }
    }

    for (const event of events) {
      const matches = new Set<string>();
      if (event.caseId && caseIds.has(event.caseId)) matches.add(event.caseId);
      for (const entityId of [event.entity, event.reference]) {
        for (const caseId of casesByEntity.get(entityId) ?? []) matches.add(caseId);
      }
      const eventTime = Date.parse(event.timestamp);
      if (eventTime < cutoff || eventTime > now) {
        correlatedCaseIds.set(event.id, []);
        continue;
      }
      const matchingIds = [...matches];
      correlatedCaseIds.set(event.id, matchingIds);
      for (const caseId of matchingIds) {
        const list = windowEvents.get(caseId) ?? [];
        list.push(event);
        windowEvents.set(caseId, list);
      }
    }

    for (let index = 0; index < cases.length; index += 1) {
      const record = cases[index];
      const recent = windowEvents.get(record.id) ?? [];
      const graphNodes = new Set(record.linkedEntities);
      const graphEdges = new Set<string>();
      for (const event of recent) {
        graphNodes.add(event.entity);
        graphNodes.add(event.reference);
        graphEdges.add(`${event.entity}→${event.reference}`);
      }
      const suspiciousSignals = recent.filter((event) => event.risk === "Suspicious").length;
      const ambiguousSignals = recent.filter((event) => event.risk === "Ambiguous").length;
      const velocityPotential = Math.min(24, recent.length * 4);
      const entityPotential = Math.min(20, Math.max(0, graphNodes.size - 2) * 2 + graphEdges.size * 2);
      const signalPotential = Math.min(18, suspiciousSignals * 5 + ambiguousSignals * 3);
      let remainingCapacity = 100;
      const applyPositivePoints = (potential: number) => {
        const applied = Math.min(remainingCapacity, potential);
        remainingCapacity -= applied;
        return applied;
      };
      const baselineContribution = applyPositivePoints(record.baselineRiskScore);
      const velocityContribution = applyPositivePoints(velocityPotential);
      const entityContribution = applyPositivePoints(entityPotential);
      const signalContribution = applyPositivePoints(signalPotential);
      const weightedRisk = baselineContribution + velocityContribution + entityContribution + signalContribution;
      const appliedApprovalAdjustment = Math.min(weightedRisk, record.approvedExceptions * 18);
      const riskScore = weightedRisk - appliedApprovalAdjustment;
      const risk = classifyRisk(riskScore);
      const status = risk === "Ambiguous" && record.status === "Open" ? "Under review" : record.status;
      const linkedEntities = [...graphNodes].slice(0, 8);
      const factors: CaseRecord["factors"] = [
        { label: "Baseline risk", contribution: baselineContribution, rationale: `Scenario baseline · +${baselineContribution} applied points` },
        { label: "10-minute velocity", contribution: velocityContribution, rationale: `${recent.length} linked event(s) · +${velocityContribution} applied of +${velocityPotential} potential points${velocityContribution < velocityPotential ? " · limited by 100-point cap" : ""}` },
        { label: "Entity graph", contribution: entityContribution, rationale: `${graphNodes.size} linked nodes across ${graphEdges.size} event edge(s) · +${entityContribution} applied of +${entityPotential} potential points${entityContribution < entityPotential ? " · limited by 100-point cap" : ""}` },
        { label: "Policy signals", contribution: signalContribution, rationale: `${suspiciousSignals} Suspicious + ${ambiguousSignals} Ambiguous signal(s) · +${signalContribution} applied of +${signalPotential} potential points${signalContribution < signalPotential ? " · limited by 100-point cap" : ""}` },
        { label: "Approved exceptions", contribution: -appliedApprovalAdjustment, rationale: `${record.approvedExceptions} approved · −${appliedApprovalAdjustment} points` },
      ];
      const updatedAt = status !== record.status ? formatIndiaDateTime(now) : record.updatedAt;
      cases[index] = {
        ...record,
        risk,
        riskScore,
        status,
        updatedAt,
        windowEventCount: recent.length,
        linkedEntityCount: graphNodes.size,
        linkedEntities,
        factors,
      };
    }
    return correlatedCaseIds;
  }

  function getSnapshot(now = Date.now()): CaseOpsSnapshot {
    appendDueEvents(now);
    const correlatedCaseIds = recalculateCaseScores(now);
    const sortedEvents = [...events]
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
      .map((event) => {
        const timestamp = Date.parse(event.timestamp);
        const correlationWindowActive = timestamp >= now - CORRELATION_WINDOW_MS && timestamp <= now;
        const matchedCaseIds = correlationWindowActive ? correlatedCaseIds.get(event.id) ?? [] : [];
        return {
          ...event,
          correlatedCaseIds: matchedCaseIds,
          correlationWindowActive,
          correlation: !correlationWindowActive ? "No match" : event.correlation === "No match" && matchedCaseIds.length > 0 ? "Matched" : event.correlation,
        };
      });
    const snapshotAt = new Date(now).toISOString();
    return {
      snapshotAt,
      scenarioDate: formatIndiaDate(snapshotAt),
      scenarioLabel: "Synthetic dataset: Scenario 02",
      correlationWindow: "10 min",
      cases: structuredClone(cases),
      events: sortedEvents,
      auditEntries: structuredClone(auditEntries),
      eventVolume: buildEventVolume(sortedEvents, now),
    };
  }

  function applyAction(input: AnalystActionInput, now = Date.now()): AnalystActionResult {
    appendDueEvents(now);
    recalculateCaseScores(now);
    const index = cases.findIndex((record) => record.id === input.caseId);
    if (index < 0) throw new Error(`Unknown synthetic case: ${input.caseId}`);
    const current = cases[index];
    if (current.status === "Cleared" || current.status === "Closed") throw new Error("This case is already inactive.");
    if (input.action === "approve-exception" && current.approvedExceptions >= current.exceptions) {
      throw new Error("All exceptions for this case have already been approved.");
    }

    const timestamp = new Date(now).toISOString();
    const message = actionMessages[input.action];
    const scoreAdjustment = input.action === "approve-exception" ? Math.min(18, current.riskScore) : undefined;
    const detail = input.action === "add-note" ? (input.note?.trim() || "Review context recorded")
      : input.action === "approve-exception" ? `Approved exception · risk score reduced by ${scoreAdjustment ?? 0} points`
      : message;
    cases[index] = {
      ...current,
      analyst: input.action === "assign" ? "Mira Patel" : current.analyst,
      status: actionStatuses[input.action] ?? current.status,
      approvedExceptions: current.approvedExceptions + (input.action === "approve-exception" ? 1 : 0),
      updatedAt: formatIndiaDateTime(timestamp),
    };
    const entry: TimelineItem = {
      timestamp,
      time: formatIndiaTime(timestamp),
      label: actionLabels[input.action],
      detail: `Mira Patel · ${detail}`,
      kind: "analyst",
      tone: input.action === "escalate" ? "Suspicious" : undefined,
    };
    auditEntries[input.caseId] = [...(auditEntries[input.caseId] ?? []), entry];

    return { caseId: input.caseId, action: input.action, message, timestamp, scoreAdjustment };
  }

  return { getSnapshot, applyAction };
}

export const caseOpsStore = createCaseOpsStore();
