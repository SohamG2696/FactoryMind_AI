"use client";

import { useState, useEffect } from "react";

export default function AiSection() {
  const [failurePrediction, setFailurePrediction] = useState(88);
  const [rulValue, setRulValue] = useState("16 hrs");
  const [healthScore, setHealthScore] = useState(62);
  const [operationalStatus, setOperationalStatus] = useState("Warning / Alert");
  const [confidence, setConfidence] = useState(96);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const payload = {
          mode: "chained",
          data: {
            type_encoded: 0,
            air_temperature_k: 304.0,
            process_temperature_k: 314.5,
            rotational_speed_rpm: 1320,
            torque_nm: 62.0,
            tool_wear_min: 190,
            machine_id: 7,
            vibration_hz: 3.8,
            error_rate_pct: 4.8,
            production_speed_uph: 190.0,
          },
        };

        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.pipeline) {
            const pm = data.pipeline.predictive_maintenance;
            const fac = data.pipeline.factory_operational_status;
            setFailurePrediction(Math.round(pm.failure_probability * 100));
            setHealthScore(Math.round(pm.health_score));
            setOperationalStatus(fac.operational_status);
            setConfidence(Math.round(fac.confidence));
            // Remaining useful life estimated from wear & failure prob
            const estRul = Math.max(4, Math.round((250 - 190) * (1 - pm.failure_probability) * 0.4 + 8));
            setRulValue(`${estRul} hrs`);
          }
        }
      } catch {
        // Use default fallback values
      }
    };

    fetchPrediction();
    const id = setInterval(fetchPrediction, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="ai-section">
      {/* LEFT PANEL */}
      <div className="ai-left">
        <div className="section-title">
          <h2>🧠 Agentic AI Control Center</h2>
          <p>Autonomous Decision Making Engine · Powered by LightGBM & Random Forest</p>
        </div>

        <div className="reasoning-card">
          <div className="reason-header">
            <h3>AI Reasoning Process</h3>
            <span className="live-tag">LIVE ML</span>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-icon red" />
              <div>
                <h4>Thermal Gradient Anomaly</h4>
                <p>Process Temp 314.5 K (+10.5 K delta) on CNC-07</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon orange" />
              <div>
                <h4>Vibration & Tool Wear</h4>
                <p>Wear reached 190 min · Torque elevated at 62 Nm</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon yellow" />
              <div>
                <h4>Feature Engineering</h4>
                <p>POWER: 81.8 kW · WEAR_TORQUE: 11,780 · TORQUE_NORM: 0.047</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon blue" />
              <div>
                <h4>LightGBM Inference</h4>
                <p>Failure Probability: {failurePrediction}% · Status: {operationalStatus}</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon green" />
              <div>
                <h4>Maintenance Action</h4>
                <p>Technician Dispatched · Spindle & Bearing Inspection Scheduled</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="ai-right">
        <div className="prediction-card">
          <h3>Failure Prediction</h3>
          <h1 id="failurePrediction" style={{ color: failurePrediction > 50 ? "#ef4444" : "#10b981" }}>
            {failurePrediction}%
          </h1>
          <p>{failurePrediction > 50 ? "High Risk (LightGBM)" : "Low Risk (LightGBM)"}</p>
        </div>

        <div className="prediction-card">
          <h3>Remaining Useful Life</h3>
          <h1 id="rulValue">{rulValue}</h1>
          <p>Estimated Useful Time</p>
        </div>

        <div className="prediction-card">
          <h3>Health Score</h3>
          <h1 id="healthScore" style={{ color: healthScore < 70 ? "#f59e0b" : "#10b981" }}>
            {healthScore}%
          </h1>
          <p>{healthScore < 70 ? "Needs Maintenance" : "Optimal Condition"}</p>
        </div>

        <div className="prediction-card">
          <h3>Model Confidence</h3>
          <h1>{confidence}%</h1>
          <p>Random Forest Accuracy</p>
        </div>
      </div>
    </section>
  );
}
