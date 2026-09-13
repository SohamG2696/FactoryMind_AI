"use client";

import { useMemo, useState } from "react";
import { useFactorySim, MachineState, EventCategory } from "@/hooks/useFactorySim";
import FactoryFloorSVG from "@/components/FactoryFloorSVG";
import ProductionFlowStrip from "@/components/ProductionFlowStrip";
import { MachineSVG } from "@/components/MachineSVGs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faRotateLeft,
  faBolt,
  faXmark,
  faClock,
  faIndustry,
  faSignal,
  faBoxesStacked,
  faTruck,
  faLayerGroup,
  faHeartPulse,
  faArrowUp,
  faShieldHalved,
  faFire,
  faScrewdriverWrench,
  faCircleDot,
} from "@fortawesome/free-solid-svg-icons";

const STATUS_LABEL: Record<string, string> = {
  healthy: "HEALTHY",
  warning: "WARNING",
  critical: "CRITICAL",
  downtime: "DOWN",
};

/* ─────────── mini charts ─────────── */

function MiniLine({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return <div style={{ height }} />;
  const w = 160;
  const h = height;
  const mx = Math.max(...data);
  const mn = Math.min(...data);
  const range = mx - mn || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - mn) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.13" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function MiniBars({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 1) return <div style={{ height }} />;
  const w = 160;
  const h = height;
  const mx = Math.max(...data, 1);
  const barW = w / data.length - 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      {data.map((v, i) => (
        <rect
          key={i}
          x={i * (barW + 2)}
          y={h - (v / mx) * (h - 4) - 2}
          width={barW}
          height={(v / mx) * (h - 4)}
          fill={color}
          opacity={i === data.length - 1 ? 1 : 0.55}
          rx="1"
        />
      ))}
    </svg>
  );
}

/* ─────────── inspector modal (kept, updated a bit) ─────────── */

function Sparkline({ data, color, height = 44 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return <div style={{ height }} />;
  const w = 220;
  const h = height;
  const mx = Math.max(...data, 1);
  const mn = Math.min(...data, 0);
  const range = mx - mn || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - mn) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.14" />
    </svg>
  );
}

function InspectorModal({
  m,
  onClose,
  onFault,
  onDispatch,
}: {
  m: MachineState;
  onClose: () => void;
  onFault: (kind: "wear" | "thermal") => void;
  onDispatch: () => void;
}) {
  const temps = m.history.map((h) => h.temp);
  const rpms = m.history.map((h) => h.rpm);
  const vibs = m.history.map((h) => h.vib);

  return (
    <div className="sim-modal-backdrop" onClick={onClose}>
      <div className="sim-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sim-modal-header">
          <div>
            <div className="sim-cell-code" style={{ fontSize: 11 }}>{m.code}</div>
            <h2 style={{ margin: "6px 0", color: "var(--text-main)", fontSize: 22, fontWeight: 800 }}>
              {m.label}
            </h2>
            <span className={`sim-status-pill ${m.status}`} style={{ fontSize: 11, padding: "3px 10px" }}>
              {STATUS_LABEL[m.status]} · {m.health.toFixed(0)}% health
            </span>
          </div>
          <button className="sim-modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="sim-modal-svg-wrap">
          <MachineSVG m={m} />
        </div>

        <div className="sim-modal-charts-grid">
          <ChartCard label="TEMPERATURE °C" val={m.temperature.toFixed(1)} data={temps} color="var(--danger)" />
          <ChartCard label="RPM" val={m.rpm.toFixed(0)} data={rpms} color="var(--primary)" />
          <ChartCard label="VIBRATION mm/s" val={m.vibration.toFixed(2)} data={vibs} color="var(--warning)" />
          <ChartCard
            label="TOOL WEAR %"
            val={m.toolWear.toFixed(0)}
            data={m.history.map((_, i) => m.toolWear * ((i + 1) / m.history.length))}
            color="#B85A1F"
          />
        </div>

        <div className="sim-ai-inference-card">
          <div className="sim-ai-inference-title">
            <FontAwesomeIcon icon={faShieldHalved} /> DIGITAL TWIN INFERENCE
          </div>
          <div className="sim-ai-inference-body">
            Queue depth <b style={{ color: "var(--primary)" }}>{m.queue}</b> of capacity {m.capacity}. Throughput{" "}
            <b style={{ color: "var(--success)" }}>{m.throughput.toFixed(1)} u/min</b>. Load{" "}
            <b style={{ color: "var(--text-main)" }}>{(m.load * 100).toFixed(0)}%</b>.
            {m.status === "critical" && (
              <div style={{ marginTop: 8, color: "var(--danger)" }}>
                🔴 Critical: consider immediate maintenance to prevent auto-downtime at health &lt; 25%.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="sim-btn" onClick={() => onFault("wear")}>
            <FontAwesomeIcon icon={faScrewdriverWrench} /> Inject Wear
          </button>
          <button className="sim-btn danger-btn" onClick={() => onFault("thermal")}>
            <FontAwesomeIcon icon={faFire} /> Inject Coolant Loss
          </button>
          <button className="sim-btn play-state" onClick={onDispatch}>
            <FontAwesomeIcon icon={faScrewdriverWrench} /> Dispatch Maintenance
          </button>
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
      <Sparkline data={data} color={color} />
    </div>
  );
}

/* ─────────── the page ─────────── */
export default function FactorySimulation() {
  const { state, play, pause, setSpeed, reset, injectFault, dispatchMaintenance, wallClock, wallDate } = useFactorySim();
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | EventCategory>("all");

  const inspect = inspectId ? state.machines.find((m) => m.id === inspectId) || null : null;

  const activeAgvs = state.agvs.filter((a) => a.status === "moving").length;

  const filteredEvents = useMemo(() => {
    if (tab === "all") return state.events;
    return state.events.filter((e) => e.category === tab);
  }, [state.events, tab]);

  const kpiDelta = state.kpiHistory.produced.length >= 2
    ? state.kpiHistory.produced[state.kpiHistory.produced.length - 1] -
      state.kpiHistory.produced[Math.max(0, state.kpiHistory.produced.length - 6)]
    : 12;

  return (
    <>
      {inspect && (
        <InspectorModal
          m={inspect}
          onClose={() => setInspectId(null)}
          onFault={(k) => injectFault(inspect.id, k)}
          onDispatch={() => dispatchMaintenance(inspect.id)}
        />
      )}

      {/* Hero banner with title + controls + clock */}
      <div className="sim-hub-banner">
        <div style={{ flex: 1 }}>
          <div className="sim-banner-tag">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: state.running ? "var(--success)" : "var(--text-muted)",
              }}
            />
            LIVE · TICK {state.tick}
          </div>
          <h1 className="sim-banner-heading">
            <FontAwesomeIcon icon={faIndustry} style={{ color: "var(--primary)" }} />
            Factory Digital Twin <span className="highlight">— Running Simulation</span>
          </h1>
          <div className="sim-banner-desc">
            Discrete-event floor model · 6 cells · production chain with fault propagation &amp; auto-repair
          </div>
        </div>

        <div className="sim-controls-toolbar">
          {state.running ? (
            <button className="sim-btn pause-state" onClick={pause}>
              <FontAwesomeIcon icon={faPause} /> Pause
            </button>
          ) : (
            <button className="sim-btn play-state" onClick={play}>
              <FontAwesomeIcon icon={faPlay} /> Play
            </button>
          )}
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              className={`sim-btn speed-btn ${state.speed === s ? "active" : ""}`}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
          <button className="sim-btn" onClick={reset}>
            <FontAwesomeIcon icon={faRotateLeft} /> Reset
          </button>
          <button className="sim-btn danger-btn" onClick={() => injectFault("", "surge")}>
            <FontAwesomeIcon icon={faBolt} /> Surge
          </button>
        </div>

        <div className="sim-hero-clock">
          <FontAwesomeIcon icon={faClock} className="sim-hero-clock-icon" />
          <div>
            <div className="sim-hero-clock-label">SIMULATION TIME</div>
            <div className="sim-hero-clock-value">
              {wallDate} &nbsp;<span>{wallClock}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-KPI strip */}
      <div className="sim-kpi-mini">
        <MiniKpiCard
          icon={faSignal}
          label="OEE"
          value={`${(state.oee * 100).toFixed(1)}%`}
          delta={`+${((state.oee - (state.kpiHistory.oee[0] || 0.98)) * 100).toFixed(1)}%`}
          deltaPositive
          chart={<MiniLine data={state.kpiHistory.oee.length ? state.kpiHistory.oee : [0.98, 0.99, 0.995, 0.996]} color="var(--success)" />}
        />
        <MiniKpiCard
          icon={faBoxesStacked}
          label="TOTAL PRODUCED"
          value={String(state.totalProduced)}
          delta={`+${kpiDelta} (${((kpiDelta / Math.max(state.totalProduced, 1)) * 100).toFixed(1)}%)`}
          deltaPositive
          chart={<MiniBars data={state.kpiHistory.produced.length ? state.kpiHistory.produced : [8, 10, 9, 12, 11, 12]} color="var(--primary)" />}
        />
        <MiniKpiCard
          icon={faTruck}
          label="ACTIVE AGVS"
          value={`${activeAgvs} / ${state.agvs.length}`}
          sub={activeAgvs === state.agvs.length ? "All Operational" : `${state.agvs.length - activeAgvs} loading`}
          statusDot="var(--success)"
        />
        <MiniKpiCard
          icon={faLayerGroup}
          label="WIP (IN SYSTEM)"
          value={String(state.wip)}
          chart={<MiniBars data={state.kpiHistory.wip.length ? state.kpiHistory.wip : [10, 11, 12, 13, 12, 12]} color="var(--info)" />}
        />
        <MiniKpiCard
          icon={faHeartPulse}
          label="AVG HEALTH"
          value={`${(state.machines.reduce((s, m) => s + m.health, 0) / state.machines.length).toFixed(0)}%`}
          chart={<MiniLine data={state.kpiHistory.health.length ? state.kpiHistory.health : [98, 97, 98, 99, 98, 99]} color="var(--success)" />}
        />
      </div>

      {/* Main grid: floor + SCADA */}
      <div className="sim-grid-layout">
        <div className="sim-floor-card">
          <div className="sim-floor-header">
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.12em",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
              }}
            >
              FACTORY FLOOR — LIVE SIMULATION
            </span>
          </div>

          <div className="sim-floor-viewport">
            <FactoryFloorSVG
              machines={state.machines}
              agvs={state.agvs}
              currentPart={state.currentPart}
              onInspect={setInspectId}
            />
          </div>
        </div>

        <div className="sim-scada-panel">
          <div className="sim-scada-header">
            <span
              style={{
                fontSize: 12,
                color: "var(--text-main)",
                letterSpacing: "0.08em",
                fontWeight: 800,
              }}
            >
              LIVE EVENTS · SCADA FEED
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 10,
                color: "var(--success)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--success)",
                  boxShadow: "0 0 6px var(--success-glow)",
                }}
              />
              Online
            </span>
          </div>

          {/* Filter tabs */}
          <div className="sim-scada-tabs">
            <ScadaTab active={tab === "all"} onClick={() => setTab("all")}>All</ScadaTab>
            <ScadaTab active={tab === "machine"} onClick={() => setTab("machine")}>Machines</ScadaTab>
            <ScadaTab active={tab === "agv"} onClick={() => setTab("agv")}>AGVs</ScadaTab>
            <ScadaTab active={tab === "flow"} onClick={() => setTab("flow")}>Material Flow</ScadaTab>
            <ScadaTab active={tab === "alert"} onClick={() => setTab("alert")}>Alerts</ScadaTab>
          </div>

          <div className="sim-scada-logs-container">
            {filteredEvents.length === 0 && (
              <div style={{ color: "var(--text-muted)", padding: 12, textAlign: "center", fontSize: 12 }}>
                No events in this category.
              </div>
            )}
            {filteredEvents.map((ev, i) => (
              <div key={`${ev.t}-${i}`} className={`sim-log-item ${ev.kind} rich`}>
                <span className="sim-log-time">{ev.wallClock || `t${ev.t.toString().padStart(4, "0")}`}</span>
                <span className="sim-log-icon">{ev.icon || iconForCategory(ev.category)}</span>
                <div className="sim-log-body">
                  <span className="sim-log-title">
                    {titleForEvent(ev.category, ev.msg)}
                  </span>
                  <span className="sim-log-msg">{ev.msg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Production Flow strip (bottom) */}
      <ProductionFlowStrip
        currentPart={state.currentPart}
        machines={state.machines}
        cycleTargetMin={state.cycleTargetMin}
        simSecondsPerTick={state.simSecondsPerTick}
        currentTick={state.tick}
        wip={state.wip}
        throughputPerHour={state.throughputPerHour}
        bottleneckId={state.bottleneckId}
      />
    </>
  );
}

function iconForCategory(cat: EventCategory): string {
  switch (cat) {
    case "machine": return "⚙";
    case "agv": return "🚚";
    case "flow": return "📦";
    case "alert": return "⚠";
  }
}

function titleForEvent(cat: EventCategory, msg: string): string {
  const first = msg.split("—")[0].trim();
  const words = first.split(" ").slice(0, 5).join(" ");
  return words;
}

function ScadaTab({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button className={`sim-scada-tab ${active ? "active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function MiniKpiCard({
  icon,
  label,
  value,
  delta,
  deltaPositive,
  sub,
  statusDot,
  chart,
}: {
  icon: any;
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  sub?: string;
  statusDot?: string;
  chart?: React.ReactNode;
}) {
  return (
    <div className="sim-kpi-mini-card">
      <div className="sim-kpi-mini-head">
        <FontAwesomeIcon icon={icon} className="sim-kpi-mini-icon" />
        <span className="sim-kpi-mini-label">{label}</span>
      </div>
      <div className="sim-kpi-mini-body">
        <div className="sim-kpi-mini-value">{value}</div>
        {delta && (
          <span className={`sim-kpi-mini-delta ${deltaPositive ? "up" : ""}`}>
            <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: 8 }} /> {delta}
          </span>
        )}
        {sub && (
          <span className="sim-kpi-mini-sub">
            {statusDot && <span className="sim-kpi-mini-dot" style={{ background: statusDot }} />}
            {sub}
          </span>
        )}
      </div>
      {chart && <div className="sim-kpi-mini-chart">{chart}</div>}
    </div>
  );
}
