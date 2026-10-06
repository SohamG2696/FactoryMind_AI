"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faIndustry,
  faHeartPulse,
  faTriangleExclamation,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { useSim } from "@/context/FactorySimContext";
import { summarizePlant, mlSourceLabel, formatAccuracy } from "@/lib/plantMetrics";

export default function KpiSection() {
  const { state, agent, mlHealth } = useSim();
  const plant = summarizePlant(state, agent.latest?.ml ?? {});
  const offline = plant.totalCells - plant.runningCells;

  return (
    <section className="kpi-section">
      {/* KPI 1 */}
      <div className="kpi-card">
        <div className="kpi-card-inner">
          <div className="kpi-top-bar">
            <span className="kpi-tag-code">TAG: FLEET-{String(plant.totalCells).padStart(2, "0")}</span>
            <span className="kpi-live-dot" />
          </div>
          <div className="kpi-main-row">
            <div className="icon blue">
              <FontAwesomeIcon icon={faIndustry} />
            </div>
            <div className="kpi-data-block">
              <h3>Running Cells</h3>
              <h2 id="runningMachines">
                {plant.runningCells} / {plant.totalCells}
              </h2>
              <p>{offline === 0 ? "All cells online" : `${offline} in maintenance`}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 2 */}
      <div className="kpi-card">
        <div className="kpi-card-inner">
          <div className="kpi-top-bar">
            <span className="kpi-tag-code">TAG: HEALTH-AVG</span>
            <span className="kpi-live-dot green" />
          </div>
          <div className="kpi-main-row">
            <div className="icon green">
              <FontAwesomeIcon icon={faHeartPulse} />
            </div>
            <div className="kpi-data-block">
              <h3>Plant Health</h3>
              <h2 id="machineHealth" style={{ color: plant.avgHealth >= 72 ? "#4ADE80" : "#FACC15" }}>
                {plant.avgHealth.toFixed(0)}%
              </h2>
              <p>
                {plant.avgFailureProbability !== null
                  ? `Avg ML failure risk ${(plant.avgFailureProbability * 100).toFixed(1)}%`
                  : "Average across all cells"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 3 */}
      <div className="kpi-card">
        <div className="kpi-card-inner">
          <div className="kpi-top-bar">
            <span className="kpi-tag-code">TAG: ALARM-{String(plant.criticalCells).padStart(2, "0")}</span>
            <span className="kpi-live-dot red" />
          </div>
          <div className="kpi-main-row">
            <div className="icon red">
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <div className="kpi-data-block">
              <h3>Critical Alerts</h3>
              <h2 id="criticalAlerts" style={{ color: plant.criticalCells ? "#F87171" : "#4ADE80" }}>
                {String(plant.criticalCells).padStart(2, "0")}
              </h2>
              <p>
                {plant.criticalCells ? "Immediate action" : "None"} · {plant.warningCells} warning
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 4 */}
      <div className="kpi-card">
        <div className="kpi-card-inner">
          <div className="kpi-top-bar">
            <span className="kpi-tag-code">TAG: ML-GBM</span>
            <span className="kpi-live-dot amber" />
          </div>
          <div className="kpi-main-row">
            <div className="icon orange">
              <FontAwesomeIcon icon={faRobot} />
            </div>
            <div className="kpi-data-block">
              <h3>AI Model Accuracy</h3>
              <h2 id="modelConfidence" style={{ color: "#FACC15" }} title={mlHealth.evaluationMethod ?? undefined}>
                {formatAccuracy(mlHealth)}
              </h2>
              <p>LightGBM + Random Forest · {mlSourceLabel(mlHealth, plant.mlLive)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
