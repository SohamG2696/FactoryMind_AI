"use client";

import { useState } from "react";
import { AgentDecision } from "@/hooks/useCoordinatorAgent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faPause,
  faPlay,
  faBrain,
  faEye,
  faChartLine,
  faLightbulb,
  faListCheck,
  faBolt,
  faShieldHalved,
  faCircleCheck,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  enabled: boolean;
  onToggle: () => void;
  history: AgentDecision[];
  latest: AgentDecision | null;
  busy: boolean;
  lastError: string | null;
  autonomousCount: number;
  humanInterventions: number;
  brainLabel: string;
}

const PHASES = [
  { key: "observe", label: "OBSERVE", icon: faEye },
  { key: "predict", label: "PREDICT", icon: faChartLine },
  { key: "reason", label: "REASON", icon: faBrain },
  { key: "plan", label: "PLAN", icon: faLightbulb },
  { key: "act", label: "ACT", icon: faBolt },
  { key: "verify", label: "VERIFY", icon: faCircleCheck },
];

const AUTONOMY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  SAFE: { color: "#3F7A5F", bg: "rgba(63,122,95,0.12)", label: "AUTONOMOUS" },
  APPROVAL_REQUIRED: { color: "#C87D1F", bg: "rgba(200,125,31,0.14)", label: "APPROVAL REQ." },
  HUMAN_REQUIRED: { color: "#B23A3A", bg: "rgba(178,58,58,0.14)", label: "HUMAN REQ." },
};

const AGENT_COLORS: Record<string, string> = {
  MaintenanceAgent: "#B23A3A",
  ProductionAgent: "#FF5A1F",
  MaterialAgent: "#4A6D8C",
  WorkforceAgent: "#3F7A5F",
  SafetyAgent: "#7A2626",
};

function timeAgo(iso: string): string {
  try {
    return iso;
  } catch {
    return "";
  }
}

export default function AIControlCenter({
  enabled, onToggle, history, latest, busy, lastError,
  autonomousCount, humanInterventions, brainLabel,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const totalActions = history.reduce((s, d) => s + d.actions.length, 0);
  const missionActions = history.reduce(
    (s, d) => s + d.actions.filter((a) => a.tool === "create_mission" || a.tool === "assign_worker").length,
    0
  );

  // Determine currently-active phase for the phase strip
  const activePhaseIdx = !latest ? 0
    : latest.actions.some((a) => a.tool === "assign_worker") ? 4 /* ACT */
    : latest.actions.length > 0 ? 3 /* PLAN */
    : Object.keys(latest.ml || {}).length > 0 ? 1 /* PREDICT */
    : 0; /* OBSERVE */

  return (
    <div className={`ai-control-center ${collapsed ? "collapsed" : ""}`}>
      <header className="acc-head">
        <div className="acc-title">
          <span className={`acc-dot ${enabled ? "on" : "off"} ${busy ? "busy" : ""}`} />
          <FontAwesomeIcon icon={faRobot} />
          <strong>AI Control Center</strong>
          <span className="acc-brain-pill">
            <FontAwesomeIcon icon={faBrain} style={{ fontSize: 10 }} /> {brainLabel.toUpperCase()}
          </span>
        </div>
        <div className="acc-actions">
          <button
            className={`acc-toggle-btn ${enabled ? "on" : "off"}`}
            onClick={onToggle}
            title={enabled ? "Pause agent" : "Start agent"}
          >
            <FontAwesomeIcon icon={enabled ? faPause : faPlay} /> {enabled ? "PAUSE" : "START"}
          </button>
          <button
            className="acc-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <FontAwesomeIcon icon={collapsed ? faChevronUp : faChevronDown} />
          </button>
        </div>
      </header>

      {!collapsed && (
        <>
          {/* Phase strip — OBSERVE → PREDICT → REASON → PLAN → ACT → VERIFY */}
          <div className="acc-phase-strip">
            {PHASES.map((p, i) => (
              <div
                key={p.key}
                className={`acc-phase ${i < activePhaseIdx ? "done" : ""} ${i === activePhaseIdx ? "active" : ""}`}
              >
                <div className="acc-phase-circle">
                  <FontAwesomeIcon icon={p.icon} />
                </div>
                <span className="acc-phase-label">{p.label}</span>
                {i < PHASES.length - 1 && (
                  <div className={`acc-phase-connector ${i < activePhaseIdx ? "done" : ""}`} />
                )}
              </div>
            ))}
          </div>

          {/* Executive summary */}
          {latest && (
            <div className="acc-summary">
              <FontAwesomeIcon icon={faShieldHalved} style={{ color: "var(--primary)", marginRight: 8 }} />
              <b>{latest.wallClock}</b> — {latest.executiveSummary}
            </div>
          )}

          {/* Stats row */}
          <div className="acc-stats">
            <div><div className="acc-stat-val">{history.length}</div><div className="acc-stat-lbl">TICKS</div></div>
            <div><div className="acc-stat-val">{totalActions}</div><div className="acc-stat-lbl">ACTIONS</div></div>
            <div><div className="acc-stat-val">{missionActions}</div><div className="acc-stat-lbl">MISSIONS</div></div>
            <div><div className="acc-stat-val">{autonomousCount}</div><div className="acc-stat-lbl">AUTONOMOUS</div></div>
            <div><div className="acc-stat-val">{humanInterventions}</div><div className="acc-stat-lbl">HUMAN INTVN</div></div>
          </div>

          {lastError && <div className="acc-error">⚠ {lastError}</div>}

          {/* Latest tick reports (all 5 agents) */}
          {latest && (
            <div className="acc-reports">
              {latest.reports.map((r) => (
                <div key={r.agentName} className="acc-report" style={{ borderLeftColor: AGENT_COLORS[r.agentName] || "#7A7770" }}>
                  <div className="acc-report-head">
                    <FontAwesomeIcon icon={faListCheck} style={{ color: AGENT_COLORS[r.agentName] || "#7A7770" }} />
                    <span>{r.agentName}</span>
                    <span className="acc-report-count">{r.actions.length} action{r.actions.length !== 1 ? "s" : ""}</span>
                  </div>
                  <ul className="acc-thoughts">
                    {r.thoughts.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Timeline of past decisions with tools + autonomy tags */}
          {history.length === 0 && (
            <div className="acc-empty">
              {enabled ? "Waiting for first agent tick — 6-second cadence." : "Agent paused. Press START to enable autonomous supervision."}
            </div>
          )}

          <div className="acc-timeline">
            {history.slice(0, 8).map((d, di) => (
              <div key={di} className="acc-tick">
                <div className="acc-tick-head">
                  <span className="acc-tick-time">{d.wallClock}</span>
                  <span className="acc-tick-brain">{d.brain}</span>
                </div>
                {d.actions.length === 0 ? (
                  <div className="acc-tick-idle">— no action, nominal —</div>
                ) : (
                  d.actions.map((a, ai) => {
                    const style = AUTONOMY_STYLE[a.autonomyLevel] || AUTONOMY_STYLE.SAFE;
                    return (
                      <div key={ai} className="acc-tick-action">
                        <div className="acc-tick-action-head">
                          <span className="acc-tick-agent" style={{ color: AGENT_COLORS[a.agentName] || "#7A7770" }}>
                            {a.agentName}
                          </span>
                          <span className="acc-tick-tool">{a.tool}</span>
                          {a.args?.machineCode && <span className="acc-tick-machine">{a.args.machineCode}</span>}
                          <span
                            className="acc-tick-autonomy"
                            style={{ color: style.color, background: style.bg, borderColor: style.color }}
                          >
                            {style.label}
                          </span>
                        </div>
                        <div className="acc-tick-reason">{a.reason}</div>
                        {a.args?.reasons?.length > 0 && (
                          <div className="acc-tick-reasons">
                            {a.args.reasons.slice(0, 4).map((r: string, ri: number) => (
                              <span key={ri}>{r}</span>
                            ))}
                          </div>
                        )}
                        {a.missionId && (
                          <div className="acc-tick-mission">
                            Mission <b>{a.missionId}</b>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
