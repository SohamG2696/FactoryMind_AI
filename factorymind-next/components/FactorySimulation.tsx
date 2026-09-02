"use client";

import { useEffect, useRef, useState } from "react";
import { useFactorySim, MachineState } from "@/hooks/useFactorySim";
import { MachineSVG } from "@/components/MachineSVGs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faRotateLeft,
  faBolt,
  faFire,
  faScrewdriverWrench,
  faXmark,
  faGaugeHigh,
  faHeartPulse,
  faIndustry,
  faCircleDot,
  faRobot,
  faMicrochip,
  faGears,
  faWaveSquare,
  faArrowRight,
  faCheckCircle,
  faTriangleExclamation,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const STATUS_LABEL: Record<string, string> = {
  healthy: "HEALTHY",
  warning: "WARNING",
  critical: "CRITICAL",
  downtime: "DOWN",
};

const STATUS_COLOR: Record<string, string> = {
  healthy: "var(--success)",
  warning: "var(--warning)",
  critical: "var(--danger)",
  downtime: "var(--text-muted)",
};

function Sparkline({
  data,
  color,
  height = 40,
  max,
}: {
  data: number[];
  color: string;
  height?: number;
  max?: number;
}) {
  if (data.length < 2) return <div style={{ height }} />;
  const w = 220;
  const h = height;
  const mx = max ?? Math.max(...data, 1);
  const mn = Math.min(...data, 0);
  const range = mx - mn || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - mn) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={color}
        opacity="0.15"
      />
    </svg>
  );
}

function MachineCard({
  m,
  onInspect,
  onFault,
  onDispatch,
}: {
  m: MachineState;
  onInspect: () => void;
  onFault: (kind: "wear" | "thermal") => void;
  onDispatch: () => void;
}) {
  const statusCls = `status-${m.status}`;
  const color =
    m.status === "healthy" ? "var(--success)" :
    m.status === "warning" ? "var(--warning)" :
    m.status === "critical" ? "var(--danger)" : "var(--text-muted)";

  return (
    <div className={`sim-cell-card ${statusCls}`}>
      {/* Header */}
      <div className="sim-cell-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="sim-cell-code">{m.code}</span>
          <span className="sim-cell-title">{m.label}</span>
        </div>
        <span className={`sim-status-pill ${m.status}`}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: "currentColor",
              display: "inline-block",
            }}
          />
          {STATUS_LABEL[m.status]}
        </span>
      </div>

      {/* SVG Canvas Preview */}
      <div className="sim-svg-viewport" onClick={onInspect} title="Click to inspect telemetry">
        <MachineSVG m={m} />
        {m.faultTag && (
          <div className="sim-fault-badge">
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 4 }} />
            {m.faultTag}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="sim-telemetry-strip">
        <div className="sim-telemetry-item">
          <span className="sim-telemetry-label">Temp</span>
          <span className="sim-telemetry-val" style={{ color: "var(--danger)" }}>
            {m.temperature.toFixed(0)}°C
          </span>
        </div>
        <div className="sim-telemetry-item">
          <span className="sim-telemetry-label">{m.kind === "robot" ? "Rad/s" : "RPM"}</span>
          <span className="sim-telemetry-val" style={{ color: "var(--primary)" }}>
            {m.rpm.toFixed(0)}
          </span>
        </div>
        <div className="sim-telemetry-item">
          <span className="sim-telemetry-label">Vib</span>
          <span className="sim-telemetry-val" style={{ color: "var(--warning)" }}>
            {m.vibration.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Health Bar */}
      <div className="sim-health-bar-row">
        <div className="sim-health-meta">
          <span>Health: {m.health.toFixed(0)}%</span>
          <span>Q:{m.queue} · P:{m.produced}</span>
        </div>
        <div className="sim-progress-track">
          <div
            className="sim-progress-fill"
            style={{
              width: `${Math.max(0, Math.min(100, m.health))}%`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="sim-action-row">
        <button
          className="sim-action-btn wear"
          onClick={(e) => {
            e.stopPropagation();
            onFault("wear");
          }}
          title="Inject mechanical bearing wear fault"
        >
          <FontAwesomeIcon icon={faScrewdriverWrench} style={{ fontSize: 9 }} />
          <span>Wear</span>
        </button>
        <button
          className="sim-action-btn heat"
          onClick={(e) => {
            e.stopPropagation();
            onFault("thermal");
          }}
          title="Inject coolant disruption thermal event"
        >
          <FontAwesomeIcon icon={faFire} style={{ fontSize: 9 }} />
          <span>Heat</span>
        </button>
        <button
          className="sim-action-btn fix"
          onClick={(e) => {
            e.stopPropagation();
            onDispatch();
          }}
          title="Dispatch automated maintenance crew"
        >
          <FontAwesomeIcon icon={faGears} style={{ fontSize: 9 }} />
          <span>Fix</span>
        </button>
      </div>
    </div>
  );
}

function InspectorModal({
  m,
  onClose,
}: {
  m: MachineState;
  onClose: () => void;
}) {
  const temps = m.history.map((h) => h.temp);
  const rpms = m.history.map((h) => h.rpm);
  const vibs = m.history.map((h) => h.vib);
  const color =
    m.status === "healthy" ? "var(--success)" :
    m.status === "warning" ? "var(--warning)" :
    m.status === "critical" ? "var(--danger)" : "var(--text-muted)";

  return (
    <div className="sim-modal-backdrop" onClick={onClose}>
      <div className="sim-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sim-modal-header">
          <div>
            <div style={{ fontSize: 11, color: "var(--primary)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
              {m.code} · TELEMETRY INSPECTOR
            </div>
            <h2 style={{ margin: "4px 0 6px 0", color: "var(--text-main)", fontSize: 20, fontWeight: 800 }}>
              {m.label}
            </h2>
            <span className={`sim-status-pill ${m.status}`}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "currentColor",
                  display: "inline-block",
                }}
              />
              {STATUS_LABEL[m.status]} · {m.health.toFixed(0)}% HEALTH
            </span>
          </div>
          <button className="sim-modal-close-btn" onClick={onClose} title="Close Inspector">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="sim-modal-svg-wrap">
          <MachineSVG m={m} />
        </div>

        <div className="sim-modal-charts-grid">
          <ChartCard label="TEMPERATURE (°C)" val={`${m.temperature.toFixed(1)}°C`} data={temps} color="var(--danger)" />
          <ChartCard label="OPERATING RPM" val={m.rpm.toFixed(0)} data={rpms} color="var(--primary)" />
          <ChartCard label="VIBRATION (MM/S)" val={m.vibration.toFixed(2)} data={vibs} color="var(--warning)" />
          <ChartCard
            label="TOOL WEAR INDEX (%)"
            val={`${m.toolWear.toFixed(0)}%`}
            data={m.history.map((_, i) => (m.toolWear * (i + 1)) / (m.history.length || 1))}
            color="var(--info)"
          />
        </div>

        <div className="sim-ai-inference-card">
          <div className="sim-ai-inference-title">
            <FontAwesomeIcon icon={faRobot} />
            <span>DIGITAL TWIN REAL-TIME INFERENCE</span>
          </div>
          <div className="sim-ai-inference-body">
            Queue depth <strong style={{ color: "var(--warning)" }}>{m.queue}</strong> of capacity {m.capacity}. Current throughput is{" "}
            <strong style={{ color: "var(--success)" }}>{m.throughput.toFixed(1)} u/min</strong> at{" "}
            <strong style={{ color: "var(--text-main)" }}>{(m.load * 100).toFixed(0)}%</strong> load.
            {m.status === "critical" && (
              <div style={{ marginTop: 8, color: "var(--danger)", fontWeight: 600 }}>
                <FontAwesomeIcon icon={faCircleExclamation} style={{ marginRight: 6 }} />
                Critical alert: Automated shutdown initiated if health drops below 25%. Dispatch maintenance immediately.
              </div>
            )}
            {m.status === "warning" && (
              <div style={{ marginTop: 8, color: "var(--warning)", fontWeight: 600 }}>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 6 }} />
                Degraded performance detected: Vibration/thermal anomalies exceeding nominal tolerances.
              </div>
            )}
            {m.status === "healthy" && (
              <div style={{ marginTop: 8, color: "var(--success)" }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 6 }} />
                All sensors reporting nominal harmonics. Tool wear within expected lifespan tolerance.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ label, val, data, color }: { label: string; val: string; data: number[]; color: string }) {
  return (
    <div className="sim-chart-card">
      <div className="sim-chart-header">
        <span className="sim-chart-label">{label}</span>
        <span className="sim-chart-val" style={{ color }}>{val}</span>
      </div>
      <Sparkline data={data} color={color} height={42} />
    </div>
  );
}

function FlowLines() {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <defs>
        <marker id="sim-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#A78BFA" opacity="0.8" />
        </marker>
      </defs>
      {/* Warehouse → CNC1 → Robot */}
      <line x1="16.6%" y1="28%" x2="50%" y2="28%" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" markerEnd="url(#sim-arrow)">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
      </line>
      <line x1="50%" y1="28%" x2="83.3%" y2="28%" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" markerEnd="url(#sim-arrow)">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
      </line>
      {/* Robot → CNC7 (down + diagonal back) */}
      <path d="M 83.3% 28% Q 92% 50% 16.6% 72%" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5 5" fill="none" opacity="0.45" markerEnd="url(#sim-arrow)">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
      </path>
      {/* CNC7 → Press → Conveyor */}
      <line x1="16.6%" y1="72%" x2="50%" y2="72%" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" markerEnd="url(#sim-arrow)">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
      </line>
      <line x1="50%" y1="72%" x2="83.3%" y2="72%" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" markerEnd="url(#sim-arrow)">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

export default function FactorySimulation() {
  const { state, play, pause, setSpeed, reset, injectFault, dispatchMaintenance } = useFactorySim();
  const [inspectId, setInspectId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll event feed on new entries
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [state.events.length]);

  const inspect = inspectId ? state.machines.find((m) => m.id === inspectId) || null : null;
  const activeAlerts = state.machines.filter((m) => m.status === "critical" || m.status === "downtime").length;
  const avgHealth = state.machines.reduce((s, m) => s + m.health, 0) / state.machines.length;

  return (
    <>
      {inspect && <InspectorModal m={inspect} onClose={() => setInspectId(null)} />}

      {/* Control Banner */}
      <div className="sim-hub-banner">
        <div>
          <div className="sim-banner-tag">
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: state.running ? "var(--success)" : "var(--text-muted)",
                boxShadow: state.running ? "0 0 8px var(--success)" : "none",
              }}
            />
            <span>SCADA ENGINE TICK: t{state.tick.toString().padStart(4, "0")}</span>
          </div>
          <h1 className="sim-banner-heading">
            <FontAwesomeIcon icon={faIndustry} style={{ color: "var(--primary)" }} />
            <span>Digital Twin — </span>
            <span className="highlight">Discrete Simulation</span>
          </h1>
          <p className="sim-banner-desc">
            Real-time physics and state propagation engine across production workcells. Inject telemetry faults and observe line cascades.
          </p>
        </div>

        {/* Action Controls */}
        <div className="sim-controls-toolbar">
          {state.running ? (
            <button className="sim-btn pause-state" onClick={pause} title="Pause Simulation">
              <FontAwesomeIcon icon={faPause} />
              <span>Pause</span>
            </button>
          ) : (
            <button className="sim-btn play-state" onClick={play} title="Resume Simulation">
              <FontAwesomeIcon icon={faPlay} />
              <span>Resume</span>
            </button>
          )}

          {[1, 2, 5].map((s) => (
            <button
              key={s}
              className={`sim-btn speed-btn ${state.speed === s ? "active" : ""}`}
              onClick={() => setSpeed(s)}
              title={`Set simulation speed to ${s}×`}
            >
              {s}×
            </button>
          ))}

          <button className="sim-btn" onClick={reset} title="Reset factory state">
            <FontAwesomeIcon icon={faRotateLeft} />
            <span>Reset</span>
          </button>

          <button
            className="sim-btn danger-btn"
            onClick={() => injectFault("", "surge")}
            title="Inject facility-wide electrical surge"
          >
            <FontAwesomeIcon icon={faBolt} />
            <span>Surge</span>
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <section className="kpi-section" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {/* KPI 1: OEE */}
        <div className="kpi-card">
          <div className="kpi-card-inner">
            <div className="kpi-top-bar">
              <span className="kpi-tag-code">TAG: SIM-OEE</span>
              <span className="kpi-live-dot green" />
            </div>
            <div className="kpi-main-row">
              <div className="icon green">
                <FontAwesomeIcon icon={faHeartPulse} />
              </div>
              <div className="kpi-data-block">
                <h3>Overall OEE</h3>
                <h2 style={{ color: "var(--success)" }}>{(state.oee * 100).toFixed(1)}%</h2>
                <p>World Class Benchmark</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Units Produced */}
        <div className="kpi-card">
          <div className="kpi-card-inner">
            <div className="kpi-top-bar">
              <span className="kpi-tag-code">TAG: SIM-OUTPUT</span>
              <span className="kpi-live-dot" />
            </div>
            <div className="kpi-main-row">
              <div className="icon blue">
                <FontAwesomeIcon icon={faIndustry} />
              </div>
              <div className="kpi-data-block">
                <h3>Total Produced</h3>
                <h2>{state.totalProduced}</h2>
                <p>Finished Units Shipped</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Active SCADA Alerts */}
        <div className="kpi-card">
          <div className="kpi-card-inner">
            <div className="kpi-top-bar">
              <span className="kpi-tag-code">TAG: SIM-ALERTS</span>
              <span className={`kpi-live-dot ${activeAlerts > 0 ? "red" : "green"}`} />
            </div>
            <div className="kpi-main-row">
              <div className={`icon ${activeAlerts > 0 ? "red" : "green"}`}>
                <FontAwesomeIcon icon={faBolt} />
              </div>
              <div className="kpi-data-block">
                <h3>Active Alerts</h3>
                <h2 style={{ color: activeAlerts > 0 ? "var(--danger)" : "var(--success)" }}>
                  {activeAlerts < 10 ? `0${activeAlerts}` : activeAlerts}
                </h2>
                <p>{activeAlerts > 0 ? "Requires Dispatch" : "Nominal Tolerances"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Fleet Health */}
        <div className="kpi-card">
          <div className="kpi-card-inner">
            <div className="kpi-top-bar">
              <span className="kpi-tag-code">TAG: SIM-HEALTH</span>
              <span className={`kpi-live-dot ${avgHealth > 75 ? "green" : "amber"}`} />
            </div>
            <div className="kpi-main-row">
              <div className={`icon ${avgHealth > 75 ? "green" : "orange"}`}>
                <FontAwesomeIcon icon={faGaugeHigh} />
              </div>
              <div className="kpi-data-block">
                <h3>Avg Fleet Health</h3>
                <h2 style={{ color: avgHealth > 75 ? "var(--success)" : "var(--warning)" }}>
                  {avgHealth.toFixed(0)}%
                </h2>
                <p>{avgHealth > 75 ? "Optimal Machinery" : "Maintenance Recommended"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Floor & SCADA Feeds */}
      <div className="sim-grid-layout">
        {/* Factory Floor */}
        <div className="sim-floor-card">
          <div className="sim-floor-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="dt-live-tag">
                <span className="dt-pulse" />
                <span>FACTORY FLOOR PLAN · SCADA TOPOLOGY</span>
              </span>
            </div>

            <div className="sim-flow-chain">
              <span>Warehouse</span>
              <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 9, opacity: 0.6 }} />
              <span>CNC-01</span>
              <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 9, opacity: 0.6 }} />
              <span>Robot</span>
              <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 9, opacity: 0.6 }} />
              <span>CNC-07</span>
              <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 9, opacity: 0.6 }} />
              <span>Press</span>
              <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 9, opacity: 0.6 }} />
              <span>Conveyor</span>
            </div>
          </div>

          <div style={{ position: "relative", minHeight: 480 }}>
            <FlowLines />
            <div className="sim-machine-matrix">
              {state.machines
                .slice()
                .sort((a, b) => a.y * 3 + a.x - (b.y * 3 + b.x))
                .map((m) => (
                  <MachineCard
                    key={m.id}
                    m={m}
                    onInspect={() => setInspectId(m.id)}
                    onFault={(kind) => injectFault(m.id, kind)}
                    onDispatch={() => dispatchMaintenance(m.id)}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* SCADA Event Feed */}
        <div className="sim-scada-panel">
          <div className="sim-scada-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "var(--success)",
                  boxShadow: "0 0 6px var(--success)",
                }}
              />
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-main)" }}>
                SCADA TELEMETRY LOGS
              </span>
            </div>
            <span
              style={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                color: "var(--primary)",
                background: "rgba(167, 139, 250, 0.1)",
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {state.events.length} EVENTS
            </span>
          </div>

          <div ref={feedRef} className="sim-scada-logs-container">
            {state.events.length === 0 && (
              <div style={{ color: "var(--text-muted)", padding: 16, textAlign: "center", fontSize: 11 }}>
                Nominal state — no critical faults recorded.
              </div>
            )}
            {state.events.map((ev, i) => (
              <div key={`${ev.t}-${i}`} className={`sim-log-item ${ev.kind}`}>
                <span className="sim-log-time">t{ev.t.toString().padStart(4, "0")}</span>
                <span className="sim-log-msg">{ev.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
