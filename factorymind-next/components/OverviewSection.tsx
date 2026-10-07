"use client";

import { useSim } from "@/context/FactorySimContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faClock,
  faGaugeHigh,
  faBrain,
} from "@fortawesome/free-solid-svg-icons";

export default function OverviewSection() {
  const { state } = useSim();
  const oeePct = state.oee * 100;
  const downtimeMin = Math.round((state.totalDowntime * state.simSecondsPerTick) / 60);
  const elapsedMin = Math.max(1, Math.round((state.tick * state.simSecondsPerTick) / 60));
  const cellMinutes = elapsedMin * Math.max(1, state.machines.filter((m) => !m.standby).length);
  const availabilityPct = Math.max(0, 100 - (downtimeMin / cellMinutes) * 100);

  return (
    <section className="overview-hud">
      <div className="overview-card-hud">
        <div className="overview-card-top">
          <span className="ov-tag">TELEMETRY YIELD</span>
          <span className="ov-trend positive">
            <FontAwesomeIcon icon={faArrowTrendUp} /> {state.throughputPerHour.toFixed(0)}/h
          </span>
        </div>
        <h3 className="ov-title">Plant Output</h3>
        <h1 className="ov-val">{state.totalProduced.toLocaleString("en-IN")}</h1>
        <p className="ov-sub">Units produced this shift · WIP {state.wip}</p>
        <div className="ov-progress-bar">
          <div className="ov-fill blue-glow" style={{ width: `${oeePct}%` }} />
        </div>
      </div>

      <div className="overview-card-hud">
        <div className="overview-card-top">
          <span className="ov-tag">AVAILABILITY</span>
          <span className="ov-trend positive">
            <FontAwesomeIcon icon={faClock} /> {availabilityPct.toFixed(1)}%
          </span>
        </div>
        <h3 className="ov-title">Cell Downtime</h3>
        <h1 className="ov-val">{downtimeMin} min</h1>
        <p className="ov-sub">Summed across all cells over {elapsedMin} sim-min</p>
        <div className="ov-progress-bar">
          <div className="ov-fill green-glow" style={{ width: `${availabilityPct}%` }} />
        </div>
      </div>

      <div className="overview-card-hud">
        <div className="overview-card-top">
          <span className="ov-tag">OEE TELEMETRY</span>
          <span className="ov-trend neutral">
            <FontAwesomeIcon icon={faGaugeHigh} /> {oeePct >= 85 ? "WORLD-CLASS" : oeePct >= 60 ? "TYPICAL" : "LOW"}
          </span>
        </div>
        <h3 className="ov-title">Overall Equipment Effectiveness</h3>
        <h1 className="ov-val">{oeePct.toFixed(1)}%</h1>
        <p className="ov-sub">
          Bottleneck: {state.machines.find((m) => m.id === state.bottleneckId)?.code ?? "none"}
        </p>
        <div className="ov-progress-bar">
          <div className="ov-fill cyan-glow" style={{ width: `${oeePct}%` }} />
        </div>
      </div>

      <div className="overview-card-hud">
        <div className="overview-card-top">
          <span className="ov-tag">AGENTIC CONTROL</span>
          <span className="ov-trend ai-pulse">
            <FontAwesomeIcon icon={faBrain} /> AUTONOMOUS
          </span>
        </div>
        <h3 className="ov-title">AI Actions This Shift</h3>
        <h1 className="ov-val">{state.autonomousActionsCount + state.humanInterventionsCount}</h1>
        <p className="ov-sub">
          {state.autonomousActionsCount} autonomous · {state.humanInterventionsCount} technician dispatches
        </p>
        <div className="ov-progress-bar">
          <div
            className="ov-fill amber-glow"
            style={{
              width: `${
                state.autonomousActionsCount + state.humanInterventionsCount
                  ? (state.autonomousActionsCount / (state.autonomousActionsCount + state.humanInterventionsCount)) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
