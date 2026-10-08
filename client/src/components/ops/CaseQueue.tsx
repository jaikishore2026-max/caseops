import { ChevronDown, Search } from "lucide-react";
import type { CaseRecord, CaseStatus, RiskBand } from "@shared/caseops";

type CaseQueueProps = {
  cases: CaseRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
  riskFilter: "All" | RiskBand;
  onRiskFilter: (filter: "All" | RiskBand) => void;
  statusFilter: "All" | Extract<CaseStatus, "Open" | "Under review" | "Escalated">;
  onStatusFilter: (filter: "All" | Extract<CaseStatus, "Open" | "Under review" | "Escalated">) => void;
  searchValue: string;
  onSearch: (value: string) => void;
  totalCases: number;
  onClear: () => void;
};

export default function CaseQueue({ cases, selectedId, onSelect, riskFilter, onRiskFilter, statusFilter, onStatusFilter, searchValue, onSearch, totalCases, onClear }: CaseQueueProps) {
  return (
    <section className="panel case-queue" aria-labelledby="case-queue-title">
      <div className="panel-heading case-queue-heading">
        <div>
          <div className="eyebrow">CASE MANAGEMENT</div>
          <h2 id="case-queue-title">Active cases <span className="heading-count">{totalCases.toLocaleString("en-US")}</span></h2>
        </div>
        <button className="subtle-icon-button" aria-label="Reset case filters" type="button" onClick={onClear}><span className="more-dots">···</span></button>
      </div>
      <div className="queue-tools">
        <label className="queue-search">
          <Search size={14} aria-hidden="true" />
          <input aria-label="Search cases" placeholder="Find case or entity" value={searchValue} onChange={(event) => onSearch(event.target.value)} />
          <kbd>/</kbd>
        </label>
        <label className="select-wrap queue-filter">
          <select aria-label="Filter cases by risk" value={riskFilter} onChange={(event) => onRiskFilter(event.target.value as "All" | RiskBand)}>
            <option value="All">All risk</option>
            <option value="Suspicious">Suspicious</option>
            <option value="Ambiguous">Ambiguous</option>
            <option value="Normal">Normal</option>
          </select>
          <ChevronDown size={13} aria-hidden="true" />
        </label>
        <label className="select-wrap queue-status">
          <select aria-label="Filter cases by status" value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as "All" | Extract<CaseStatus, "Open" | "Under review" | "Escalated">)}>
            <option value="All">All status</option>
            <option value="Open">Open</option>
            <option value="Under review">Under review</option>
            <option value="Escalated">Escalated</option>
          </select>
          <ChevronDown size={13} aria-hidden="true" />
        </label>
      </div>
      <div className="queue-summary"><span>Showing {cases.length ? "1" : "0"}–{cases.length} of {totalCases.toLocaleString("en-US")} cases</span><span>UPDATED</span></div>
      <div className="case-list">
        {cases.map((record) => (
          <button type="button" className={`case-list-item${selectedId === record.id ? " is-selected" : ""}`} key={record.id} onClick={() => onSelect(record.id)} aria-current={selectedId === record.id ? "true" : undefined}>
            <span className={`case-risk-rule risk-rule--${record.risk.toLowerCase()}`} />
            <span className="case-item-main">
              <span className="case-item-top"><strong className="mono">{record.id}</strong><span className={`risk-label risk-label--${record.risk.toLowerCase()}`}>{record.risk}</span></span>
              <span className="case-trigger">{record.trigger}</span>
              <span className="case-item-meta"><span className="case-status"><i className={`status-dot status-dot--${record.status === "Escalated" ? "red" : record.status === "Under review" ? "amber" : record.status === "Cleared" ? "green" : "gray"}`} />{record.status}</span><span title={record.analyst}>{record.analyst}</span></span>
              <span className="case-item-meta"><span>Opened {record.openedAt.split("· ")[1]} · Updated {record.updatedAt.split("· ")[1]}</span><span>{record.approvedExceptions}/{record.exceptions} ex</span></span>
            </span>
          </button>
        ))}
        {cases.length === 0 && <div className="empty-state small-empty">No cases match this search. Clear a filter to widen the queue.</div>}
      </div>
      <div className="queue-footer"><span><i className="status-dot status-dot--green" />Live synthetic queue</span><button type="button" className="text-button" onClick={onClear}>Reset filters <ChevronDown size={13} /></button></div>
    </section>
  );
}
