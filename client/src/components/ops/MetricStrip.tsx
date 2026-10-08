import { Activity, Clock3 } from "lucide-react";
import type { CaseRecord } from "@shared/caseops";
import { formatIndiaTime } from "@shared/caseops";

type MetricStripProps = {
  cases: CaseRecord[];
  eventCount: number;
  eventVolume: number[];
  snapshotAt: string;
  correlationWindow: string;
};

export default function MetricStrip({ cases, eventCount, eventVolume, snapshotAt, correlationWindow }: MetricStripProps) {
  const activeCases = cases.filter((record) => record.status !== "Cleared" && record.status !== "Closed");
  const metrics = [
    { label: "ACTIVE CASES", value: activeCases.length, tone: "neutral" },
    { label: "SUSPICIOUS", value: activeCases.filter((record) => record.risk === "Suspicious").length, tone: "risk-suspicious" },
    { label: "AMBIGUOUS", value: activeCases.filter((record) => record.risk === "Ambiguous").length, tone: "risk-ambiguous" },
    { label: "EVENTS TODAY", value: eventCount.toLocaleString("en-US"), tone: "neutral" },
  ];
  const maxVolume = Math.max(1, ...eventVolume);
  const lastUpdated = snapshotAt ? formatIndiaTime(snapshotAt) : "—";

  return (
    <section className="metric-strip" aria-label="Operational overview">
      <div className="metric-list">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span className="metric-label">{metric.label}</span>
            <span className={`metric-value ${metric.tone}`}>{metric.value}</span>
          </div>
        ))}
      </div>
      <div className="metric-context">
        <div className="context-stat"><Clock3 size={14} /><span>Correlation window</span><strong>{correlationWindow}</strong></div>
        <div className="context-stat"><Activity size={14} /><span>Event volume · 6h</span></div>
        <div className="volume-chart" role="img" aria-label={`Event volume by hour for the last six hours: ${eventVolume.join(", ")}`}>
          {eventVolume.map((count, index) => {
            const height = Math.max(8, Math.round((count / maxVolume) * 100));
            return <span key={index} title={`${count.toLocaleString("en-US")} events`} style={{ height: `${height}%` }} />;
          })}
        </div>
        <span className="metric-updated">Last updated <strong>{lastUpdated}</strong></span>
      </div>
    </section>
  );
}
