import { Download, Search, ShieldCheck } from "lucide-react";
import BrandMark from "./BrandMark";

type TopBarProps = {
  onExport: () => void;
  onSearch: () => void;
};

export default function TopBar({ onExport, onSearch }: TopBarProps) {
  return (
    <header className="topbar">
      <span className="creator-attribution">Built by Jai Kishore G.V</span>
      <div className="topbar-brand">
        <BrandMark />
        <div className="brand-copy"><strong>CaseOps</strong><span>COMPLIANCE OPERATIONS</span></div>
      </div>
      <div className="topbar-context">
        <span className="context-label">WORKSPACE</span><span className="context-value">Investigations</span><span className="topbar-divider" />
        <span className="environment-chip"><span className="status-dot status-dot--green" />Internal review</span>
      </div>
      <div className="topbar-actions">
        <span className="synthetic-pill"><ShieldCheck size={13} strokeWidth={1.8} />Synthetic environment</span>
        <button className="icon-button" type="button" aria-label="Focus event search" title="Search events" onClick={onSearch}><Search size={16} /></button>
        <button className="export-button" type="button" onClick={onExport}><Download size={14} />Export view</button>
        <div className="operator-chip" title="Signed in as Mira Patel"><span className="operator-avatar">MP</span><span className="operator-name">Mira Patel</span><span className="operator-role">Senior analyst</span></div>
      </div>
    </header>
  );
}
