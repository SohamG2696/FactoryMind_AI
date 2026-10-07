"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useSim } from "@/context/FactorySimContext";
import { useAuth } from "@/context/AuthContext";
import { AutonomyBadge } from "@/components/ai/InterventionCenter";
import type { TimelineEntry } from "@/hooks/useIntervention";

const TOAST_MS = 6000;

/**
 * Live AI alerts for admins and supervisors: toasts for every new intervention
 * event, plus a drawer with the full alert feed and each agent's latest response.
 */
export default function AiAlertCenter() {
  const { role } = useAuth();
  const { ai, agent } = useSim();
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<(TimelineEntry & { id: string })[]>([]);
  const [seen, setSeen] = useState(0);
  const lastLen = useRef(0);
  const lastIv = useRef<string | null>(null);

  const iv = ai.intervention;
  const timeline = useMemo(() => iv?.timeline ?? [], [iv]);
  const allowed = role === "ADMIN" || role === "SUPERVISOR";

  // Toast every new timeline entry (a new intervention restarts the count).
  useEffect(() => {
    if (!allowed) return;
    if (iv?.id !== lastIv.current) {
      lastIv.current = iv?.id ?? null;
      lastLen.current = 0;
    }
    const fresh = timeline.slice(lastLen.current);
    lastLen.current = timeline.length;
    if (!fresh.length) return;
    const add = fresh.map((e, i) => ({ ...e, id: `${e.at}-${i}-${Math.random()}` }));
    setToasts((t) => [...t, ...add].slice(-4));
    const ids = add.map((a) => a.id);
    const timer = setTimeout(() => setToasts((t) => t.filter((x) => !ids.includes(x.id))), TOAST_MS);
    return () => clearTimeout(timer);
  }, [iv?.id, allowed, timeline]);

  if (!allowed) return null;
  const unread = Math.max(0, timeline.length - seen);
  const reports = agent.latest?.reports ?? [];

  return (
    <>
      <div className="ai-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ai-toast kind-${t.kind}`}>
            <span className="ai-toast-icon">{t.icon}</span>
            <div>
              <strong>{iv?.machineCode ?? "AI"} · {t.clock}</strong>
              <span>{t.msg}</span>
            </div>
          </div>
        ))}
      </div>

      <button className="ai-alert-fab" onClick={() => { setOpen(true); setSeen(timeline.length); }} title="AI alerts & agent responses">
        <FontAwesomeIcon icon={faBell} />
        {unread > 0 && <span className="ai-alert-count">{unread}</span>}
      </button>

      {open && (
        <div className="ai-drawer-backdrop" onClick={() => setOpen(false)}>
          <aside className="ai-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ai-drawer-head">
              <div>
                <span className="ai-eyebrow">AI ALERTS · {role}</span>
                <h3>{iv ? `${iv.machineCode} — ${iv.phase.replace("_", " ")}` : "No active intervention"}</h3>
              </div>
              <button className="ai-btn" onClick={() => setOpen(false)} aria-label="Close"><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            <div className="ai-card-title">ALERTS</div>
            {timeline.length ? (
              <ol className="ai-timeline ai-drawer-list">
                {[...timeline].reverse().map((e, i) => (
                  <li key={`${e.at}-${i}`} className={`kind-${e.kind}`}>
                    <span className="ai-tl-clock">{e.clock}</span>
                    <span className="ai-tl-icon">{e.icon}</span>
                    <span className="ai-tl-msg">{e.msg}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="ai-muted small">No AI alerts yet.</p>
            )}

            <div className="ai-card-title" style={{ marginTop: 14 }}>
              AGENT RESPONSES{agent.latest ? ` · cycle ${agent.latest.wallClock}` : ""}
            </div>
            {reports.length ? (
              reports.map((r) => (
                <div key={r.agentName} className="ai-agent-report">
                  <strong>🤖 {r.agentName}</strong>
                  {r.thoughts.slice(0, 3).map((t, i) => <p key={i}>{t}</p>)}
                  {r.actions.map((a, i) => (
                    <div key={i} className="ai-agent-action">
                      <AutonomyBadge level={a.autonomyLevel} /> <code>{a.tool}</code> {a.reason}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="ai-muted small">Agents report here every 6 s while the simulation runs with autonomy on.</p>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
