import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { AnalystAction, CaseRecord, CaseStatus, EventRecord, RiskBand, TimelineItem } from "@shared/caseops";
import { formatIndiaTime } from "@shared/caseops";
import ActionDialog from "@/components/ops/ActionDialog";
import CaseInspector from "@/components/ops/CaseInspector";
import CaseQueue from "@/components/ops/CaseQueue";
import EventTable from "@/components/ops/EventTable";
import InvestigationTimeline from "@/components/ops/InvestigationTimeline";
import MetricStrip from "@/components/ops/MetricStrip";
import TopBar from "@/components/ops/TopBar";

type DialogAction = Extract<AnalystAction, "escalate" | "clear" | "close" | "add-note" | "approve-exception">;
const emptyCases: CaseRecord[] = [];
const emptyEvents: EventRecord[] = [];
const emptyAudit: Record<string, TimelineItem[]> = {};
const zeroVolume = [0, 0, 0, 0, 0, 0];

export default function Home() {
  const snapshotQuery = trpc.caseops.snapshot.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const utils = trpc.useUtils();
  const [selectedCaseId, setSelectedCaseId] = useState("CASE-1042");
  const [selectedEventId, setSelectedEventId] = useState("EVT-24001");
  const [caseRiskFilter, setCaseRiskFilter] = useState<"All" | RiskBand>("All");
  const [caseStatusFilter, setCaseStatusFilter] = useState<"All" | Extract<CaseStatus, "Open" | "Under review" | "Escalated">>("All");
  const [caseSearch, setCaseSearch] = useState("");
  const [dialogAction, setDialogAction] = useState<DialogAction | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const snapshot = snapshotQuery.data;
  const cases = snapshot?.cases ?? emptyCases;
  const events = snapshot?.events ?? emptyEvents;
  const auditEntries = snapshot?.auditEntries ?? emptyAudit;
  const selectedCase = cases.find((record) => record.id === selectedCaseId) ?? cases[0];
  const selectedEvent = events.find((event) => event.id === selectedEventId);

  const filteredCases = useMemo(() => cases.filter((record) => {
    if (record.status === "Cleared" || record.status === "Closed") return false;
    if (caseRiskFilter !== "All" && record.risk !== caseRiskFilter) return false;
    if (caseStatusFilter !== "All" && record.status !== caseStatusFilter) return false;
    return true;
  }), [cases, caseRiskFilter, caseStatusFilter]);

  const visibleCases = useMemo(() => {
    const needle = caseSearch.trim().toLowerCase();
    if (!needle) return filteredCases;
    return filteredCases.filter((record) => [record.id, record.trigger, record.analyst, ...record.linkedEntities]
      .some((field) => field.toLowerCase().includes(needle)));
  }, [filteredCases, caseSearch]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!selectedCase) return [];
    const eventItems = events
      .filter((event) => event.correlationWindowActive && event.correlatedCaseIds?.includes(selectedCase.id))
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
      .slice(-8)
      .map((event): TimelineItem => ({
        timestamp: event.timestamp,
        time: event.time,
        label: event.correlation === "Review" ? "Manual review required" : event.risk === "Suspicious" ? "Weighted policy signal" : "Event correlated",
        detail: `${event.activity} · ${event.reference}`,
        kind: event.risk === "Suspicious" ? "signal" : "event",
        tone: event.risk,
      }));
    return [...eventItems, ...(auditEntries[selectedCase.id] ?? [])]
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
      .slice(-8);
  }, [events, auditEntries, selectedCase?.id]);

  const mutation = trpc.caseops.applyAction.useMutation({
    onSuccess: async (result) => {
      const adjustment = result.scoreAdjustment ? ` · −${result.scoreAdjustment} score points` : "";
      setActionMessage(`${result.message}${adjustment} · ${formatIndiaTime(result.timestamp)}`);
      toast.success(`${result.caseId} · ${result.message}`);
      await utils.caseops.snapshot.invalidate();
    },
    onError: (error) => {
      toast.error(`Action not saved · ${error.message}`);
    },
  });

  function exportView() {
    const rows = [
      ["event_id", "timestamp", "entity", "activity", "amount_inr", "policy", "risk", "correlation", "case_id", "matched_case_ids", "reference"],
      ...events.map((event) => [event.id, event.timestamp, event.entity, event.activity, event.amountInr ?? "", event.policy, event.risk, event.correlation, event.caseId ?? "", event.correlatedCaseIds?.join("|") ?? "", event.reference]),
    ];
    const csv = rows.map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "caseops-synthetic-event-view.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function updateSelectedCase(action: AnalystAction, note?: string) {
    if (!selectedCase) return;
    setActionMessage("");
    mutation.mutate({ caseId: selectedCase.id, action, ...(note ? { note } : {}) });
  }

  function handleAction(action: AnalystAction) {
    if (action === "assign" || action === "request-review") updateSelectedCase(action);
    else setDialogAction(action);
  }

  function confirmDialog(note?: string) {
    if (!dialogAction) return;
    updateSelectedCase(dialogAction, note);
    setDialogAction(null);
  }

  function focusEventSearch() {
    document.querySelector<HTMLInputElement>(".event-search input")?.focus();
  }

  function resetCaseFilters() {
    setCaseRiskFilter("All");
    setCaseStatusFilter("All");
    setCaseSearch("");
  }

  if (!snapshot || !selectedCase) {
    return (
      <div className="app-shell">
        <TopBar onExport={exportView} onSearch={focusEventSearch} />
        <main className="workspace-main"><section className="panel snapshot-state" role="status" aria-live="polite">
          <strong>{snapshotQuery.isError ? "Synthetic feed unavailable" : "Connecting to synthetic feed"}</strong>
          <span>{snapshotQuery.isError ? snapshotQuery.error.message : "Loading event, case, and audit snapshots…"}</span>
          <button type="button" className="export-button" onClick={() => void snapshotQuery.refetch()}>Retry connection</button>
        </section></main>
      </div>
    );
  }

  const activeCaseCount = cases.filter((record) => record.status !== "Cleared" && record.status !== "Closed").length;
  return (
    <div className="app-shell">
      <TopBar onExport={exportView} onSearch={focusEventSearch} />
      <main className="workspace-main">
        <div className="workspace-breadcrumb"><span>Risk operations</span><span className="crumb-separator">/</span><strong>Investigation workbench</strong><span className="breadcrumb-spacer" /><span className="snapshot-state-label"><i className={`status-dot status-dot--${snapshotQuery.isError ? "amber" : "green"}`} />{snapshotQuery.isError ? "Snapshot stale" : snapshotQuery.isFetching ? "Refreshing" : "Live synthetic feed"}</span><span className="breadcrumb-time mono">{formatIndiaTime(snapshot.snapshotAt)}</span></div>
        <MetricStrip cases={cases} eventCount={events.length} eventVolume={snapshot.eventVolume ?? zeroVolume} snapshotAt={snapshot.snapshotAt} correlationWindow={snapshot.correlationWindow} />
        <div className="workbench-grid">
          <CaseQueue
            cases={visibleCases}
            selectedId={selectedCase.id}
            onSelect={(id) => { setSelectedCaseId(id); setActionMessage(""); }}
            riskFilter={caseRiskFilter}
            onRiskFilter={setCaseRiskFilter}
            statusFilter={caseStatusFilter}
            onStatusFilter={setCaseStatusFilter}
            searchValue={caseSearch}
            onSearch={setCaseSearch}
            totalCases={filteredCases.length}
            onClear={resetCaseFilters}
          />
          <div className="center-column">
            <EventTable events={events} selectedId={selectedEvent?.id ?? selectedEventId} onSelect={setSelectedEventId} snapshotAt={snapshot.snapshotAt} />
            <InvestigationTimeline
              caseId={selectedCase.id}
              items={timelineItems}
            />
          </div>
          <CaseInspector record={selectedCase} selectedEvent={selectedEvent} onAction={handleAction} actionMessage={actionMessage} actionPending={mutation.isPending} />
        </div>
        <footer className="workspace-footer"><span>{snapshot.scenarioLabel} · synthetic records only</span><span>{events.length.toLocaleString("en-US")} events · {activeCaseCount} active cases · 30s polling · last updated {formatIndiaTime(snapshot.snapshotAt)}</span></footer>
      </main>
      <ActionDialog action={dialogAction} caseId={selectedCase.id} pending={mutation.isPending} onConfirm={confirmDialog} onClose={() => { if (!mutation.isPending) setDialogAction(null); }} />
    </div>
  );
}
