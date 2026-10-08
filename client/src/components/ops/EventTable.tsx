import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Search, SlidersHorizontal } from "lucide-react";
import { formatIndiaTime, type EventRecord, type RiskBand } from "@shared/caseops";

type EventTableProps = {
  events: EventRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
  snapshotAt: string;
};

type SortColumn = "time" | "entity" | "risk";
const PAGE_SIZE = 20;
const riskRank: Record<RiskBand, number> = { Suspicious: 0, Ambiguous: 1, Normal: 2 };

export default function EventTable({ events, selectedId, onSelect, snapshotAt }: EventTableProps) {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"All" | RiskBand>("All");
  const [correlatedOnly, setCorrelatedOnly] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("time");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = events.filter((event) => {
      const matchesQuery = !needle || [event.id, event.entity, event.activity, event.policy, event.caseId, event.reference, ...(event.correlatedCaseIds ?? [])]
        .some((field) => field?.toLowerCase().includes(needle));
      const matchesRisk = riskFilter === "All" || event.risk === riskFilter;
      const matchesCorrelation = !correlatedOnly || event.correlation !== "No match";
      return matchesQuery && matchesRisk && matchesCorrelation;
    });
    return result.sort((a, b) => {
      if (sortColumn === "risk") {
        const compared = riskRank[a.risk] - riskRank[b.risk];
        return descending ? -compared : compared;
      }
      const left = sortColumn === "time" ? a.timestamp : a.entity;
      const right = sortColumn === "time" ? b.timestamp : b.entity;
      const compared = left.localeCompare(right);
      return descending ? -compared : compared;
    });
  }, [events, query, riskFilter, correlatedOnly, sortColumn, descending]);

  useEffect(() => setPage(0), [query, riskFilter, correlatedOnly]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const first = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const last = Math.min((page + 1) * PAGE_SIZE, filtered.length);
  const correlatedCount = events.filter((event) => event.correlation !== "No match").length;
  const thresholdTime = events[0]?.time ?? (snapshotAt ? formatIndiaTime(snapshotAt) : "—");

  function changeSort(column: SortColumn) {
    if (sortColumn === column) setDescending((value) => !value);
    else {
      setSortColumn(column);
      setDescending(column === "time");
    }
  }

  return (
    <section className="panel event-panel" aria-labelledby="event-table-title">
      <div className="panel-heading event-panel-heading">
        <div>
          <div className="eyebrow">EVENT CORRELATION</div>
          <h2 id="event-table-title">Live mixed-event stream <span className="live-tag"><i className="status-dot status-dot--green" />Synthetic · 30s refresh</span></h2>
        </div>
        <div className="threshold-note"><span className="threshold-mark">!</span><span>Correlation threshold exceeded</span><span className="mono threshold-time">{thresholdTime}</span></div>
      </div>
      <div className="table-toolbar">
        <div className="table-tabs" role="tablist" aria-label="Event view">
          <button type="button" className={!correlatedOnly ? "table-tab active" : "table-tab"} onClick={() => setCorrelatedOnly(false)}>All events</button>
          <button type="button" className={correlatedOnly ? "table-tab active" : "table-tab"} onClick={() => setCorrelatedOnly(true)}>Correlated <span className="tab-count">{correlatedCount.toLocaleString("en-US")}</span></button>
        </div>
        <div className="table-controls">
          <label className="event-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events" aria-label="Search events" /><kbd>/</kbd></label>
          <label className="select-wrap risk-select"><SlidersHorizontal size={13} /><select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as "All" | RiskBand)} aria-label="Filter by risk"><option value="All">All risk</option><option value="Suspicious">Suspicious</option><option value="Ambiguous">Ambiguous</option><option value="Normal">Normal</option></select><ChevronDown size={12} /></label>
        </div>
      </div>
      <div className="table-scroll">
        <table className="event-table">
          <thead><tr>
            <th><button type="button" onClick={() => changeSort("time")}>TIME <ChevronsUpDown size={12} /></button></th>
            <th><button type="button" onClick={() => changeSort("entity")}>ENTITY <ChevronsUpDown size={12} /></button></th>
            <th>EVENT / REFERENCE</th>
            <th>POLICY</th>
            <th><button type="button" onClick={() => changeSort("risk")}>RISK <ChevronsUpDown size={12} /></button></th>
            <th>CORRELATION</th>
          </tr></thead>
          <tbody>
            {visible.map((event) => (
              <tr key={event.id} className={selectedId === event.id ? "selected-row" : ""} onClick={() => onSelect(event.id)} aria-selected={selectedId === event.id}>
                <td className="mono time-cell">{event.time}</td>
                <td><span className="mono entity-id">{event.entity}</span><span className="cell-subtext">{event.correlationWindowActive === false ? "Outside 10-min window" : event.correlatedCaseIds?.length ? event.correlatedCaseIds.join(", ") : "Unlinked"}</span></td>
                <td><span className="event-description">{event.activity}</span><span className="cell-subtext mono">{event.id} <span className="ref-divider">/</span> {event.reference}</span></td>
                <td><span className="policy-code mono">{event.policy}</span></td>
                <td><span className={`risk-label risk-label--${event.risk.toLowerCase()}`}><i className={`status-dot status-dot--${event.risk === "Suspicious" ? "red" : event.risk === "Ambiguous" ? "amber" : "green"}`} />{event.risk}</span></td>
                <td><span className={`match-status match-status--${event.correlation.toLowerCase().replace(" ", "-")}`}>{event.correlation}</span></td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={6}><div className="empty-state">No events match these filters. Clear a filter to widen the search.</div></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>Showing <strong>{first}–{last}</strong> of <strong>{filtered.length.toLocaleString("en-US")}</strong> events</span>
        <div className="pagination">
          <span>Page {page + 1} of {pageCount}</span>
          <button type="button" aria-label="Previous page" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0}><ChevronLeft size={15} /></button>
          <button type="button" aria-label="Next page" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={page >= pageCount - 1}><ChevronRight size={15} /></button>
        </div>
      </div>
    </section>
  );
}
