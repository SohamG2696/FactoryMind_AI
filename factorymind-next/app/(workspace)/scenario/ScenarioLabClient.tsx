"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFlaskVial, faPlay, faSpinner,
  faShieldHalved, faArrowTrendUp, faArrowTrendDown, faRobot, faBolt,
  faGears, faTruck, faPeopleGroup, faTemperatureHigh, faLayerGroup,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

interface ScenarioMeta {
  key: string;
  label: string;
  sub: string;
  icon: any;
}

const SCENARIOS: ScenarioMeta[] = [
  { key: "cnc_failure",      label: "CNC-07 Failure",      sub: "Tool wear + thermal creep",       icon: faGears },
  { key: "press_failure",    label: "Hydraulic Press Fail",sub: "Vibration + thermal",             icon: faBolt },
  { key: "agv_failure",      label: "AGV Fleet Reduction", sub: "One AGV offline",                 icon: faTruck },
  { key: "worker_shortage",  label: "Worker Shortage",     sub: "50% technician capacity",         icon: faPeopleGroup },
  { key: "raw_shortage",     label: "Raw Material Drought",sub: "Warehouse queue depletes",        icon: faLayerGroup },
  { key: "production_surge", label: "Production Surge",    sub: "+30% inbound rate",               icon: faArrowTrendUp },
  { key: "overheating",      label: "Plant Overheating",   sub: "Global thermal load",             icon: faTemperatureHigh },
  { key: "multi_fault",      label: "Multi-Machine Cascade", sub: "Every cell degrading",          icon: faTriangleExclamation },
];

interface ScenarioResult {
  scenario: string;
  aiEnabled: boolean;
  durationTicks: number;
  oee: number;
  throughputPerHour: number;
  downtimeMinutes: number;
  totalProduced: number;
  humanInterventions: number;
  criticalIncidents: number;
  recoveryMinutes: number;
  unplannedBreakdowns: number;
  peakBottleneck: string | null;
}

interface RunResponse {
  ok: boolean;
  baseline?: ScenarioResult;
  withAi?: ScenarioResult;
  recommendation?: string;
  groqUsed?: boolean;
  error?: string;
}

const SEVERITY_COLOR: Record<string, string> = {
  up: "var(--success)",
  down: "var(--danger)",
  same: "var(--text-muted)",
};

function deltaBadge(before: number, after: number, higherIsBetter = true) {
  const diff = after - before;
  const pct = before === 0 ? 0 : (diff / before) * 100;
  const good = higherIsBetter ? diff > 0 : diff < 0;
  const color = Math.abs(diff) < 0.01 ? SEVERITY_COLOR.same : good ? SEVERITY_COLOR.up : SEVERITY_COLOR.down;
  const icon = good ? faArrowTrendUp : faArrowTrendDown;
  return { color, icon, diff, pct };
}

export default function ScenarioLabClient() {
  const [activeScenario, setActiveScenario] = useState<string>("cnc_failure");
  const [duration, setDuration] = useState(200);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: activeScenario, durationTicks: duration }),
      });
      const json: RunResponse = await res.json();
      if (!json.ok) throw new Error(json.error || "scenario run failed");
      setResult(json);
    } catch (e: any) {
      setError(e?.message || "network error");
    } finally {
      setRunning(false);
    }
  };

  const currentMeta = SCENARIOS.find((s) => s.key === activeScenario);

  const base = result?.baseline;
  const withAi = result?.withAi;
  const vis = base && withAi ? visibleMetrics(base, withAi) : { shown: [], hidden: [] };

  return (
    <div className="sim-page-wrapper sim-embedded">
      <main className="sim-main-container">
        <div className="sim-hub-banner">
          <div style={{ flex: 1 }}>
            <div className="sim-banner-tag">
              <FontAwesomeIcon icon={faFlaskVial} style={{ fontSize: 10 }} /> WHAT-IF LAB
            </div>
            <h1 className="sim-banner-heading">
              <FontAwesomeIcon icon={faFlaskVial} style={{ color: "var(--primary)" }} />
              Scenario <span className="highlight">Lab</span>
            </h1>
            <div className="sim-banner-desc">
              Pick a scenario. We run the same 200-tick simulation twice — once
              with no intervention (BASELINE), once with the AI supervisor free to
              dispatch predictive maintenance (WITH AI). Compare the KPIs side by side.
            </div>
          </div>
        </div>

        {/* Scenario picker */}
        <div className="mp-grid-card sim-floor-card">
          <div className="sim-floor-header">
            <span className="mp-eyebrow">PICK A SCENARIO</span>
            <span className="mp-legend" style={{ fontSize: 11 }}>
              Duration:&nbsp;
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="sim-btn speed-btn"
                style={{ padding: "4px 8px" }}
              >
                <option value={100}>100 ticks (~50 sim-min)</option>
                <option value={200}>200 ticks (~100 sim-min)</option>
                <option value={400}>400 ticks (~200 sim-min)</option>
              </select>
            </span>
          </div>

          <div className="scenario-grid">
            {SCENARIOS.map((s) => (
              <button
                key={s.key}
                className={`scenario-card ${activeScenario === s.key ? "active" : ""}`}
                onClick={() => setActiveScenario(s.key)}
              >
                <FontAwesomeIcon icon={s.icon} className="scenario-card-icon" />
                <div className="scenario-card-label">{s.label}</div>
                <div className="scenario-card-sub">{s.sub}</div>
              </button>
            ))}
          </div>

          <div className="scenario-run-row">
            <button
              className="sim-btn play-state"
              onClick={run}
              disabled={running}
              style={{ padding: "10px 22px", fontSize: 13 }}
            >
              <FontAwesomeIcon icon={running ? faSpinner : faPlay} spin={running} />
              {running ? "Simulating both runs…" : `Run: ${currentMeta?.label}`}
            </button>
            {error && <span style={{ color: "var(--danger)" }}>⚠ {error}</span>}
          </div>
        </div>

        {/* Results */}
        {result?.baseline && result?.withAi && (
          <>
            {/* AI Recommendation card */}
            <div className="mp-suggestion warn" style={{ borderLeftColor: "var(--primary)" }}>
              <div className="mp-suggestion-title" style={{ color: "var(--primary-dark)" }}>
                <FontAwesomeIcon icon={faRobot} style={{ color: "var(--primary)" }} />
                AI RECOMMENDATION
                {result.groqUsed && (
                  <span className="acc-brain-pill" style={{ marginLeft: 8 }}>GROQ</span>
                )}
              </div>
              <div className="mp-suggestion-body" style={{ fontSize: 13 }}>{result.recommendation}</div>
            </div>

            {/* Side-by-side comparison */}
            <div className="scenario-compare">
              <ScenarioColumn label="BASELINE" sublabel="No AI intervention" tone="baseline" r={result.baseline}
                metrics={vis.shown} />
              <div className="scenario-vs">VS</div>
              <ScenarioColumn label="WITH AI" sublabel="Supervisor Agent active" tone="ai" r={result.withAi}
                metrics={vis.shown} />
            </div>

            {/* Metric comparison bars */}
            <div className="mp-grid-card sim-floor-card">
              <div className="sim-floor-header">
                <span className="mp-eyebrow">METRIC DELTAS</span>
                <span className="mp-legend" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  Higher OEE / throughput / produced = better ·
                  Lower downtime / incidents = better
                </span>
              </div>
              <div className="scenario-delta-grid">
                {vis.shown.map((m) => (
                  <DeltaBar key={m.key} label={m.label} before={m.get(base!)} after={m.get(withAi!)}
                    unit={m.unit} higherIsBetter={m.higherIsBetter} />
                ))}
              </div>
              {vis.hidden.length > 0 && (
                <p className="scenario-hidden-note">
                  Not shown — zero in both runs: {vis.hidden.map((m) => m.label.toLowerCase()).join(", ")}.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/** Every comparable metric. A metric that is zero in both runs says nothing
 *  about this scenario, so it is left out of the comparison. */
const METRICS: {
  key: string; label: string; unit: string; higherIsBetter: boolean;
  get: (r: ScenarioResult) => number; fmt: (r: ScenarioResult) => string;
}[] = [
  { key: "oee", label: "OEE", unit: "%", higherIsBetter: true, get: (r) => r.oee * 100, fmt: (r) => `${(r.oee * 100).toFixed(1)}%` },
  { key: "tp", label: "Throughput", unit: "/hr", higherIsBetter: true, get: (r) => r.throughputPerHour, fmt: (r) => `${r.throughputPerHour}/hr` },
  { key: "prod", label: "Total produced", unit: "", higherIsBetter: true, get: (r) => r.totalProduced, fmt: (r) => String(r.totalProduced) },
  { key: "down", label: "Downtime", unit: "min", higherIsBetter: false, get: (r) => r.downtimeMinutes, fmt: (r) => `${r.downtimeMinutes} min` },
  { key: "crit", label: "Critical incidents", unit: "", higherIsBetter: false, get: (r) => r.criticalIncidents, fmt: (r) => String(r.criticalIncidents) },
  { key: "brk", label: "Unplanned breakdowns", unit: "", higherIsBetter: false, get: (r) => r.unplannedBreakdowns, fmt: (r) => String(r.unplannedBreakdowns) },
  { key: "rec", label: "Recovery time from critical", unit: "min", higherIsBetter: false, get: (r) => r.recoveryMinutes, fmt: (r) => (r.recoveryMinutes ? `${r.recoveryMinutes} min` : "—") },
  { key: "hum", label: "Human interventions", unit: "", higherIsBetter: false, get: (r) => r.humanInterventions, fmt: (r) => String(r.humanInterventions) },
];

function visibleMetrics(a: ScenarioResult, b: ScenarioResult) {
  const shown = METRICS.filter((m) => m.get(a) !== 0 || m.get(b) !== 0);
  const hidden = METRICS.filter((m) => !shown.includes(m));
  return { shown, hidden };
}

function ScenarioColumn({
  label, sublabel, tone, r, metrics,
}: { label: string; sublabel: string; tone: "baseline" | "ai"; r: ScenarioResult; metrics: typeof METRICS }) {
  const accent = tone === "ai" ? "var(--primary)" : "var(--info)";
  return (
    <div className="scenario-column" style={{ borderTopColor: accent }}>
      <div className="scenario-column-head">
        <div className="scenario-column-label" style={{ color: accent }}>
          {tone === "ai" && <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 6 }} />}
          {label}
        </div>
        <div className="scenario-column-sub">{sublabel}</div>
      </div>
      <div className="scenario-metrics">
        {metrics.map((m) => (
          <MetricRow key={m.key} label={m.label} value={m.fmt(r)} />
        ))}
        {r.peakBottleneck && <MetricRow label="Peak bottleneck" value={r.peakBottleneck} />}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="scenario-metric-row">
      <span>{label}</span>
      <span className="scenario-metric-val">{value}</span>
    </div>
  );
}

function DeltaBar({
  label, before, after, unit, higherIsBetter, showEvenWhenZero,
}: {
  label: string; before: number; after: number; unit: string;
  higherIsBetter?: boolean; showEvenWhenZero?: boolean;
}) {
  const { color, icon, diff, pct } = deltaBadge(before, after, higherIsBetter);
  const max = Math.max(before, after, 1);
  return (
    <div className="scenario-delta-row">
      <div className="scenario-delta-label">
        <span>{label}</span>
        {(Math.abs(diff) > 0 || showEvenWhenZero) && (
          <span className="scenario-delta-badge" style={{ color, borderColor: color, background: `${color}18` }}>
            <FontAwesomeIcon icon={icon} style={{ fontSize: 9 }} /> {diff > 0 ? "+" : ""}{diff.toFixed(diff % 1 === 0 ? 0 : 1)}{unit} ({pct.toFixed(0)}%)
          </span>
        )}
      </div>
      <div className="scenario-delta-bars">
        <div className="scenario-delta-bar" title={`Baseline: ${before.toFixed(1)}${unit}`}>
          <div className="scenario-delta-bar-fill baseline" style={{ width: `${(before / max) * 100}%` }} />
          <span>{before.toFixed(before % 1 === 0 ? 0 : 1)}{unit}</span>
        </div>
        <div className="scenario-delta-bar" title={`With AI: ${after.toFixed(1)}${unit}`}>
          <div className="scenario-delta-bar-fill ai" style={{ width: `${(after / max) * 100}%` }} />
          <span>{after.toFixed(after % 1 === 0 ? 0 : 1)}{unit}</span>
        </div>
      </div>
    </div>
  );
}
