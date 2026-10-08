export type RiskBand = "Suspicious" | "Ambiguous" | "Normal";
export type CaseStatus = "Open" | "Under review" | "Escalated" | "Cleared" | "Closed";
export type EventCorrelation = "Matched" | "Review" | "No match";
export type AnalystAction = "assign" | "escalate" | "clear" | "add-note" | "request-review" | "close" | "approve-exception";

export type RiskFactor = {
  label: string;
  contribution: number;
  rationale: string;
};

export type CaseRecord = {
  id: string;
  risk: RiskBand;
  status: CaseStatus;
  analyst: string;
  openedAt: string;
  updatedAt: string;
  exceptions: number;
  approvedExceptions: number;
  baselineRiskScore: number;
  riskScore: number;
  windowEventCount: number;
  linkedEntityCount: number;
  summary: string;
  trigger: string;
  policies: string[];
  linkedEntities: string[];
  factors: RiskFactor[];
};

export type EventRecord = {
  id: string;
  timestamp: string;
  time: string;
  entity: string;
  activity: string;
  amountInr?: number;
  policy: string;
  risk: RiskBand;
  correlation: EventCorrelation;
  caseId: string | null;
  correlatedCaseIds?: string[];
  correlationWindowActive?: boolean;
  reference: string;
};

export type TimelineItem = {
  timestamp: string;
  time: string;
  label: string;
  detail: string;
  kind: "signal" | "event" | "analyst";
  tone?: RiskBand;
};

export type CaseOpsSnapshot = {
  snapshotAt: string;
  scenarioDate: string;
  scenarioLabel: string;
  correlationWindow: string;
  cases: CaseRecord[];
  events: EventRecord[];
  auditEntries: Record<string, TimelineItem[]>;
  eventVolume: number[];
};

export type AnalystActionInput = {
  caseId: string;
  action: AnalystAction;
  note?: string;
};

export type AnalystActionResult = {
  caseId: string;
  action: AnalystAction;
  message: string;
  timestamp: string;
  scoreAdjustment?: number;
};

const indiaCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const indiaDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const indiaTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const indiaDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatINR(amount: number): string {
  return indiaCurrency.format(amount);
}

export function formatIndiaDate(value: string | number | Date): string {
  return indiaDate.format(toDate(value));
}

export function formatIndiaTime(value: string | number | Date): string {
  return indiaTime.format(toDate(value));
}

export function formatIndiaDateTime(value: string | number | Date): string {
  const date = toDate(value);
  return `${formatIndiaDate(date)} · ${indiaDateTime.format(date)}`;
}
