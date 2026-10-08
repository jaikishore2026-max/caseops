import { useEffect, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import type { AnalystAction } from "@shared/caseops";

type ActionDialogType = Extract<AnalystAction, "escalate" | "clear" | "close" | "add-note" | "approve-exception">;

type ActionDialogProps = {
  action: ActionDialogType | null;
  caseId: string;
  pending: boolean;
  onConfirm: (note?: string) => void;
  onClose: () => void;
};

const copy: Record<Exclude<ActionDialogType, "add-note">, { title: string; body: string; confirm: string }> = {
  escalate: { title: "Escalate investigation", body: "This will mark the synthetic case as escalated and add an audit entry.", confirm: "Escalate case" },
  clear: { title: "Clear case", body: "Confirm that the current evidence has been reviewed and this case can be marked cleared.", confirm: "Clear case" },
  close: { title: "Close case", body: "This will close the synthetic case. It can no longer receive analyst actions.", confirm: "Close case" },
  "approve-exception": { title: "Approve exception", body: "This approves one review exception, subtracts up to 18 points from the weighted risk score, and records the decision in the audit trail.", confirm: "Approve exception" },
};

export default function ActionDialog({ action, caseId, pending, onConfirm, onClose }: ActionDialogProps) {
  const [note, setNote] = useState("");
  useEffect(() => setNote(""), [action]);
  if (!action) return null;
  const noteMode = action === "add-note";
  const message = noteMode ? null : copy[action];
  const submitDisabled = pending || (noteMode && !note.trim());

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section className="action-dialog" role="dialog" aria-modal="true" aria-labelledby="action-dialog-title">
        <div className="dialog-header"><span className={noteMode ? "dialog-icon dialog-icon--note" : "dialog-icon"}>{noteMode ? <Check size={17} /> : <AlertTriangle size={17} />}</span><button type="button" className="subtle-icon-button" aria-label="Close dialog" onClick={onClose} disabled={pending}><X size={16} /></button></div>
        <h2 id="action-dialog-title">{noteMode ? "Add analyst note" : message?.title}</h2>
        <p className="dialog-case mono">{caseId}</p>
        <p className="dialog-copy">{noteMode ? "Notes are stored in the synthetic server audit trail." : message?.body}</p>
        {noteMode && <label className="note-field"><span>NOTE</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record the review context…" rows={4} autoFocus maxLength={2000} /></label>}
        <div className="dialog-footer"><button type="button" className="dialog-cancel" onClick={onClose} disabled={pending}>Cancel</button><button type="button" className={action === "clear" ? "dialog-confirm dialog-confirm--clear" : "dialog-confirm"} disabled={submitDisabled} onClick={() => onConfirm(note.trim() || undefined)}>{pending ? "Saving…" : noteMode ? "Add note" : message?.confirm}</button></div>
        <div className="dialog-disclaimer">Synthetic data only; server-memory changes reset on restart.</div>
      </section>
    </div>
  );
}
