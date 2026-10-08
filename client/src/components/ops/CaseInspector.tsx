import { useState } from "react";
import { Check, CircleAlert, FileText, Fingerprint, Link2, MessageSquarePlus, ShieldAlert, UserRound, UsersRound } from "lucide-react";
import type { AnalystAction, CaseRecord, EventRecord, RiskBand } from "@shared/caseops";
export type { AnalystAction } from "@shared/caseops";

type CaseInspectorProps = {
  record: CaseRecord;
  selectedEvent: EventRecord | undefined;
  onAction: (action: AnalystAction) => void;
  actionMessage: string;
  actionPending: boolean;
};

function riskTone(risk: RiskBand) {
  return risk === "Suspicious" ? "red" : risk === "Ambiguous" ? "amber" : "green";
}

export default function CaseInspector({ record, selectedEvent, onAction, actionMessage, actionPending }: CaseInspectorProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "evidence">("overview");
  const tone = riskTone(record.risk);
  const isInactive = record.status === "Cleared" || record.status === "Closed";
  const cannotApproveMore = record.approvedExceptions >= record.exceptions;
  const actionDisabled = isInactive || actionPending;

  return (
    <aside className="panel inspector-panel" aria-labelledby="inspector-title">
      <div className="inspector-topline"><span className="eyebrow">INVESTIGATION SUMMARY</span></div>
      <div className="inspector-title-row">
        <div><h2 className="mono inspector-case-id" id="inspector-title">{record.id}</h2><span className="inspector-date">Opened {record.openedAt}</span></div>
        <span className={`risk-label risk-label--${record.risk.toLowerCase()}`}><i className={`status-dot status-dot--${tone}`} />{record.risk}</span>
      </div>
      <div className="case-state-line"><span className={`status-dot status-dot--${record.status === "Escalated" ? "red" : record.status === "Under review" ? "amber" : record.status === "Cleared" ? "green" : "gray"}`} />{record.status}<span className="state-divider">·</span>Assigned to <strong>{record.analyst}</strong></div>
      <div className="risk-score-block">
        <div className="risk-score-main"><span>Risk assessment</span><strong className={`score-value score-value--${tone}`}>{record.riskScore}<small>/100</small></strong></div>
        <div className="score-track"><span className={`score-fill score-fill--${tone}`} style={{ width: `${record.riskScore}%` }} /></div>
        <p>{record.trigger}</p>
        <div className="score-window-note">Weighted from {record.windowEventCount} events and {record.linkedEntityCount} linked nodes in the 10-minute window.</div>
      </div>
      <div className="inspector-tabs" role="tablist" aria-label="Case detail sections">
        <button type="button" role="tab" aria-selected={activeTab === "overview"} className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Overview</button>
        <button type="button" role="tab" aria-selected={activeTab === "evidence"} className={activeTab === "evidence" ? "active" : ""} onClick={() => setActiveTab("evidence")}>Evidence <span className="tab-count">{record.exceptions}</span></button>
      </div>
      {activeTab === "overview" ? (
        <div className="inspector-content">
          <div className="summary-copy">{record.summary}</div>
          <section className="inspector-section">
            <div className="section-title"><span>Risk factors</span><span className="muted-label">WEIGHTED · 10 MIN</span></div>
            <div className="factor-formula-note">Signed points · positive inputs cap at 100 before approved exceptions are deducted.</div>
            <div className="factor-list">
              {record.factors.map((factor) => {
                const points = factor.contribution;
                const sign = points > 0 ? "+" : points < 0 ? "−" : "";
                return <div className="factor-row" key={factor.label}>
                  <div className="factor-main"><span>{factor.label}</span><strong className="mono">{sign}{Math.abs(points)} pt</strong></div>
                  <div className="factor-track"><span className={`score-fill score-fill--${points < 0 ? "green" : tone}`} style={{ width: `${Math.min(100, Math.abs(points))}%` }} /></div>
                  <span className="factor-note">{factor.rationale}</span>
                </div>;
              })}
            </div>
          </section>
          <section className="inspector-section">
            <div className="section-title"><span>Matched policies</span><span className="muted-label">{record.policies.length} RULES</span></div>
            <div className="policy-list">{record.policies.map((policy) => <div className="policy-row" key={policy}><ShieldAlert size={14} /><span>{policy}</span><span className="policy-state">Matched</span></div>)}</div>
          </section>
          <section className="inspector-section linked-section">
            <div className="section-title"><span>Linked entities</span><span className="muted-label">{record.linkedEntityCount} NODES</span></div>
            <div className="entity-chip-list">{record.linkedEntities.map((entity, index) => <span className="entity-chip mono" key={entity}>{index % 4 === 0 ? <UserRound size={12} /> : index % 4 === 1 ? <UsersRound size={12} /> : index % 4 === 2 ? <Fingerprint size={12} /> : <Link2 size={12} />}{entity}</span>)}</div>
          </section>
          {selectedEvent && <div className="selected-event-note"><span className="muted-label">SELECTED EVENT</span><strong className="mono">{selectedEvent.id}</strong><span>{selectedEvent.activity}</span></div>}
        </div>
      ) : (
        <div className="inspector-content evidence-content">
          <div className="evidence-count-row"><div><span className="eyebrow">EVIDENCE REVIEW</span><strong>{record.approvedExceptions} of {record.exceptions} exceptions approved</strong></div><span className="review-check"><Check size={14} />Reviewed</span></div>
          <div className="evidence-record"><span className="evidence-icon"><FileText size={15} /></span><div><strong>Account activity bundle</strong><span className="mono">{record.linkedEntities[1]} · {record.updatedAt.split("· ")[1]}</span></div><span className="evidence-state">Linked</span></div>
          <div className="evidence-record"><span className="evidence-icon"><Fingerprint size={15} /></span><div><strong>Device and session record</strong><span className="mono">{record.linkedEntities[2]} · {record.updatedAt.split("· ")[1]}</span></div><span className="evidence-state">Reviewed</span></div>
          {selectedEvent && <div className="evidence-record"><span className="evidence-icon"><CircleAlert size={15} /></span><div><strong>Selected event</strong><span className="mono">{selectedEvent.id} · {selectedEvent.time}</span></div><span className="evidence-state">{selectedEvent.correlation}</span></div>}
          <div className="no-evidence"><span className="status-dot status-dot--gray" />No additional evidence found</div>
          <p className="evidence-footnote">Evidence references are synthetic and included for review-flow demonstration only.</p>
        </div>
      )}
      <div className="action-area">
        <div className="section-title"><span>Analyst action</span><span className="muted-label">SERVER DEMO</span></div>
        {actionMessage && <div className="action-message"><Check size={13} />{actionMessage}</div>}
        <div className="action-grid">
          <button type="button" onClick={() => onAction("assign")} disabled={actionDisabled}><UserRound size={14} />Assign to me</button>
          <button type="button" onClick={() => onAction("escalate")} disabled={actionDisabled}><ShieldAlert size={14} />Escalate</button>
          <button type="button" onClick={() => onAction("add-note")} disabled={actionDisabled}><MessageSquarePlus size={14} />Add note</button>
          <button type="button" onClick={() => onAction("request-review")} disabled={actionDisabled}><CircleAlert size={14} />Request review</button>
          <button type="button" className="action-exception" onClick={() => onAction("approve-exception")} disabled={actionDisabled || cannotApproveMore}><Check size={14} />Approve exception</button>
          <button type="button" className="action-clear" onClick={() => onAction("clear")} disabled={actionDisabled}><Check size={14} />Clear case</button>
          <button type="button" className="action-close" onClick={() => onAction("close")} disabled={actionDisabled}>Close case</button>
        </div>
        <div className="local-disclaimer">Synthetic actions live in server memory and reset when the server restarts.</div>
      </div>
    </aside>
  );
}
