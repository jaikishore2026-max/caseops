import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { TimelineItem } from "@shared/caseops";

type InvestigationTimelineProps = {
  caseId: string;
  items: TimelineItem[];
};

export default function InvestigationTimeline({ caseId, items }: InvestigationTimelineProps) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("1×");
  const [cursorIndex, setCursorIndex] = useState(Math.max(0, items.length - 1));
  const [replayEngaged, setReplayEngaged] = useState(false);
  const playingRef = useRef(playing);
  const replayEngagedRef = useRef(replayEngaged);
  const speedMultiplier = Number(speed.replace("×", "")) || 1;
  const stepDelayMs = Math.max(250, 1_600 / speedMultiplier);

  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { replayEngagedRef.current = replayEngaged; }, [replayEngaged]);

  useEffect(() => {
    setPlaying(false);
    playingRef.current = false;
    setReplayEngaged(false);
    replayEngagedRef.current = false;
    setCursorIndex(Math.max(0, items.length - 1));
  }, [caseId]);

  useEffect(() => {
    if (!playingRef.current && !replayEngagedRef.current) setCursorIndex(Math.max(0, items.length - 1));
  }, [items.length]);

  useEffect(() => {
    if (!playing || items.length === 0) return;
    const timer = window.setTimeout(() => {
      if (cursorIndex >= items.length - 1) setPlaying(false);
      else setCursorIndex(cursorIndex + 1);
    }, stepDelayMs);
    return () => window.clearTimeout(timer);
  }, [playing, cursorIndex, items.length, stepDelayMs]);

  function togglePlayback() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (items.length === 0) return;
    setCursorIndex(0);
    setReplayEngaged(true);
    replayEngagedRef.current = true;
    setPlaying(true);
  }

  function resetReplay() {
    setPlaying(false);
    setSpeed("1×");
    setCursorIndex(0);
    setReplayEngaged(items.length > 0);
    replayEngagedRef.current = items.length > 0;
  }

  const progress = replayEngaged && items.length > 0 ? ((cursorIndex + 1) / items.length) * 100 : 0;

  return (
    <section className="panel timeline-panel" aria-labelledby="timeline-title">
      <div className="panel-heading timeline-heading">
        <div><div className="eyebrow">CASE CHRONOLOGY</div><h2 id="timeline-title">Live mixed-event replay <span className="mono timeline-case">{caseId}</span></h2></div>
        <div className="timeline-controls">
          <label className="replay-speed"><span>Replay speed:</span><select aria-label="Replay speed" value={speed} onChange={(event) => setSpeed(event.target.value)}><option value="0.5×">0.5×</option><option value="1×">1×</option><option value="2×">2×</option><option value="4×">4×</option></select></label>
          <button type="button" className={`replay-button${playing ? " is-playing" : ""}`} aria-pressed={playing} onClick={togglePlayback}>{playing ? <Pause size={13} /> : <Play size={13} />}{playing ? "Pause" : "Replay"}</button>
          <button type="button" className="subtle-icon-button" aria-label="Reset replay" title="Reset replay" onClick={resetReplay}><RotateCcw size={14} /></button>
          <span className="replay-position mono" aria-live="polite">{replayEngaged && items.length ? `${Math.min(cursorIndex + 1, items.length)}/${items.length}` : "LIVE"}</span>
        </div>
      </div>
      {replayEngaged && items.length > 0 && <div className="replay-progress" role="progressbar" aria-label="Timeline replay progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>}
      <div className="timeline-list">
        {items.map((item, index) => {
          const isActive = replayEngaged && index === cursorIndex;
          return <div className={`timeline-item timeline-item--${item.kind}${isActive ? " is-replaying" : ""}`} key={`${item.timestamp}-${item.label}`} aria-current={isActive ? "step" : undefined}>
            <span className={`timeline-marker${item.tone ? ` marker--${item.tone.toLowerCase()}` : ""}`} />
            <span className="timeline-time mono">{item.time}</span>
            <div className="timeline-copy"><strong>{item.label}</strong><span>{item.detail}</span></div>
            {item.kind === "analyst" && <span className="audit-tag">AUDIT</span>}
          </div>;
        })}
        {items.length === 0 && <div className="empty-state timeline-empty">No correlated events for this case.</div>}
      </div>
      <div className="timeline-foot"><span><i className="status-dot status-dot--green" />Correlation window: 10 min</span><span>{items.length} entries · {playing ? "replay running" : replayEngaged ? "replay paused or complete" : "new events update automatically"}</span></div>
    </section>
  );
}
