"use client";

import { useSim } from "@/context/FactorySimContext";
import { summarizePlant, mlSourceLabel, formatAccuracy } from "@/lib/plantMetrics";

/** Rough remaining-useful-life estimate (sim hours) from tool wear and ML failure risk. */
function estimateRulHours(toolWear: number, failureProb: number): number {
  const wearLeft = Math.max(0, 100 - toolWear) / 100;
  return Math.max(1, Math.round(wearLeft * (1 - failureProb) * 48));
}

export default function AiSection() {
  const { state, agent, mlHealth } = useSim();
  const ml = agent.latest?.ml ?? {};
  const plant = summarizePlant(state, ml);
  const m = plant.riskiest;
  const pred = m ? ml[m.code] : undefined;

  const failurePct = pred ? Math.round(pred.failureProbability * 100) : null;
  const healthScore = pred?.healthScore ?? m?.health ?? null;
  const machineActions = agent.latest?.actions.filter((a) => a.args?.machineCode === m?.code) ?? [];

  return (
    <section className="ai-section">
      {/* LEFT PANEL */}
      <div className="ai-left">
        <div className="section-title">
          <h2>🧠 Agentic AI Control Center</h2>
          <p>
            Autonomous Decision Making Engine · LightGBM & Random Forest ·{" "}
            {mlSourceLabel(mlHealth, plant.mlLive)}
          </p>
        </div>

        <div className="reasoning-card">
          <div className="reason-header">
            <h3>AI Reasoning Process{m ? ` · ${m.code} ${m.label}` : ""}</h3>
            <span className="live-tag">{plant.mlLive ? "LIVE ML" : "LIVE"}</span>
          </div>

          {!m ? (
            <p>Waiting for simulation data…</p>
          ) : (
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-icon red" />
                <div>
                  <h4>Thermal & Vibration Telemetry</h4>
                  <p>
                    {m.temperature.toFixed(1)}°C (ambient {m.ambient.toFixed(0)}°C) · vibration{" "}
                    {m.vibration.toFixed(2)} mm/s · {m.rpm.toFixed(0)} RPM
                  </p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-icon orange" />
                <div>
                  <h4>Tool Wear & Load</h4>
                  <p>
                    Wear {m.toolWear.toFixed(0)}% · utilisation {(m.utilization * 100).toFixed(0)}% · queue {m.queue}
                  </p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-icon yellow" />
                <div>
                  <h4>LightGBM Failure Model</h4>
                  <p>
                    {pred
                      ? `Failure probability ${(pred.failureProbability * 100).toFixed(1)}% · risk ${pred.riskLevel}`
                      : agent.busy
                      ? "Scoring current telemetry…"
                      : "Waiting for the first agent cycle"}
                  </p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-icon blue" />
                <div>
                  <h4>Random Forest Status Model</h4>
                  <p>
                    {pred?.operationalStatus
                      ? `${pred.operationalStatus} · ${pred.confidence.toFixed(1)}% confidence`
                      : "Not available from fallback model"}
                  </p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-icon green" />
                <div>
                  <h4>Agent Action</h4>
                  <p>
                    {machineActions.length
                      ? machineActions.map((a) => `${a.agentName}: ${a.reason}`).join(" · ")
                      : "No action this cycle — within tolerance"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="ai-right">
        <div className="prediction-card">
          <h3>Failure Prediction</h3>
          <h1 id="failurePrediction" style={{ color: (failurePct ?? 0) > 50 ? "#F87171" : "#4ADE80" }}>
            {failurePct !== null ? `${failurePct}%` : "—"}
          </h1>
          <p>
            {failurePct === null ? "Awaiting LightGBM" : failurePct > 50 ? "High Risk (LightGBM)" : "Low Risk (LightGBM)"}
          </p>
        </div>
        <div className="prediction-card">
          <h3>Remaining Useful Life</h3>
          <h1 id="rulValue">
            {m && pred ? `${estimateRulHours(m.toolWear, pred.failureProbability)} hrs` : "—"}
          </h1>
          <p>Estimate from tool wear × failure risk</p>
        </div>
        <div className="prediction-card">
          <h3>ML Health Score</h3>
          <h1 id="healthScore" style={{ color: (healthScore ?? 100) < 70 ? "#FACC15" : "#4ADE80" }}>
            {healthScore !== null ? `${Math.round(healthScore)}%` : "—"}
          </h1>
          <p>
            LightGBM {(healthScore ?? 100) < 70 ? "· needs maintenance" : "· optimal"}
            {m ? ` · sensor health ${m.health.toFixed(0)}%` : ""}
          </p>
        </div>
        <div className="prediction-card" title={mlHealth.evaluationMethod ?? undefined}>
          <h3>Model Accuracy</h3>
          <h1>{formatAccuracy(mlHealth)}</h1>
          <p>
            {pred?.operationalStatus
              ? `Hold-out test · this call ${pred.confidence.toFixed(0)}% confident`
              : "Hold-out test set"}
          </p>
        </div>
      </div>
    </section>
  );
}
