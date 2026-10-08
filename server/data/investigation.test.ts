import { describe, expect, it } from "vitest";
import { formatINR } from "../../shared/caseops.js";
import { createCaseOpsStore } from "./investigation.js";

describe("CaseOps synthetic server feed", () => {
  it("formats amounts with INR and Indian digit grouping", () => {
    expect(formatINR(100_000)).toBe("₹1,00,000");
  });

  it("returns current timestamps and appends a synthetic entity-linked event on its minute cadence", () => {
    const startAt = Date.parse("2026-10-08T08:00:00.000Z");
    const store = createCaseOpsStore(startAt);
    const first = store.getSnapshot(startAt);
    const next = store.getSnapshot(startAt + 60_001);

    expect(first.snapshotAt).toBe(new Date(startAt).toISOString());
    expect(first.events).toHaveLength(1_284);
    expect(next.snapshotAt).toBe(new Date(startAt + 60_001).toISOString());
    expect(next.events).toHaveLength(1_285);
    expect(next.events[0].timestamp).toBe(new Date(startAt + 60_000).toISOString());
    expect(next.eventVolume).toHaveLength(6);

    const newEvent = next.events[0];
    expect(newEvent.caseId).toBeNull();
    expect(newEvent.correlationWindowActive).toBe(true);
    expect(newEvent.correlatedCaseIds).toContain("CASE-1042");
    expect(newEvent.correlation).toBe("Matched");
    const multiMatchEvent = next.events.find((event) => event.id === "EVT-24006");
    expect(multiMatchEvent?.correlatedCaseIds).toEqual(expect.arrayContaining(["CASE-1042", "CASE-1025"]));
    const expiredEvent = first.events.find((event) => event.id === "EVT-24052");
    expect(expiredEvent?.correlationWindowActive).toBe(false);
    expect(expiredEvent?.correlatedCaseIds).toEqual([]);
    expect(expiredEvent?.correlation).toBe("No match");
    const caseRecord = next.cases.find((record) => record.id === "CASE-1042");
    const cutoff = startAt + 60_001 - 10 * 60_000;
    const linkedWindowCount = next.events.filter((event) => {
      const timestamp = Date.parse(event.timestamp);
      return timestamp >= cutoff && timestamp <= startAt + 60_001
        && (event.caseId === "CASE-1042" || event.correlatedCaseIds?.includes("CASE-1042"));
    }).length;
    expect(caseRecord?.windowEventCount).toBe(linkedWindowCount);
  });

  it("recalculates weighted risk, displays applied factor points, and records approved-exception deductions", () => {
    const startAt = Date.parse("2026-10-08T08:00:00.000Z");
    const store = createCaseOpsStore(startAt);
    const before = store.getSnapshot(startAt).cases.find((record) => record.id === "CASE-1035");
    store.applyAction({ caseId: "CASE-1035", action: "approve-exception" }, startAt + 1_000);
    const after = store.getSnapshot(startAt + 1_000).cases.find((record) => record.id === "CASE-1035");

    expect(before).toBeDefined();
    expect(after).toBeDefined();
    expect(after!.approvedExceptions).toBe(1);
    expect(after!.riskScore).toBeLessThan(before!.riskScore);
    expect(after!.factors.some((factor) => factor.label === "Entity graph" && factor.contribution > 0)).toBe(true);
    expect(after!.factors.some((factor) => factor.label === "Approved exceptions" && factor.contribution === -18)).toBe(true);
    const positivePoints = after!.factors.filter((factor) => factor.contribution > 0).reduce((sum, factor) => sum + factor.contribution, 0);
    const exceptionPoints = after!.factors.find((factor) => factor.label === "Approved exceptions")?.contribution ?? 0;
    expect(positivePoints).toBeLessThanOrEqual(100);
    expect(after!.riskScore).toBe(Math.max(0, positivePoints + exceptionPoints));
  });

  it("updates status and adds an audit entry for analyst actions", () => {
    const startAt = Date.parse("2026-10-08T08:00:00.000Z");
    const store = createCaseOpsStore(startAt);
    const result = store.applyAction({ caseId: "CASE-1042", action: "escalate" }, startAt + 1_000);
    const snapshot = store.getSnapshot(startAt + 1_000);

    expect(result.message).toBe("Escalated for senior review");
    expect(snapshot.cases.find((record) => record.id === "CASE-1042")?.status).toBe("Escalated");
    expect(snapshot.auditEntries["CASE-1042"]).toHaveLength(1);
    expect(snapshot.auditEntries["CASE-1042"][0].label).toBe("Case escalated");
  });

  it("drops expired events from the sliding window and routes ambiguous cases to review", () => {
    const startAt = Date.parse("2026-10-08T08:00:00.000Z");
    const store = createCaseOpsStore(startAt);
    const initial = store.getSnapshot(startAt);
    const later = store.getSnapshot(startAt + 11 * 60_000);
    const beforeCase = initial.cases.find((record) => record.id === "CASE-1042");
    const afterCase = later.cases.find((record) => record.id === "CASE-1042");

    expect(beforeCase).toBeDefined();
    expect(afterCase).toBeDefined();
    expect(afterCase!.windowEventCount).toBeLessThan(beforeCase!.windowEventCount);

    const reviewStore = createCaseOpsStore(startAt);
    const review = reviewStore.getSnapshot(startAt - 24 * 60 * 60_000).cases.find((record) => record.id === "CASE-1035");
    expect(review?.risk).toBe("Ambiguous");
    expect(review?.status).toBe("Under review");
  });
});
