"use client";

import { useState, useEffect } from "react";

export default function AiSection() {
  const [failurePrediction, setFailurePrediction] = useState(96);
  const [rulValue, setRulValue] = useState("18 hrs");
  const [healthScore, setHealthScore] = useState(58);

  useEffect(() => {
    const id = setInterval(() => {
      setFailurePrediction(Math.floor(Math.random() * 20 + 80));
      setRulValue(Math.floor(Math.random() * 40 + 10) + " hrs");
      setHealthScore(Math.floor(Math.random() * 20 + 70));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="ai-section">
      {/* LEFT PANEL */}
      <div className="ai-left">
        <div className="section-title">
          <h2>🧠 Agentic AI Control Center</h2>
          <p>Autonomous Decision Making Engine</p>
        </div>

        <div className="reasoning-card">
          <div className="reason-header">
            <h3>AI Reasoning Process</h3>
            <span className="live-tag">LIVE</span>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-icon red" />
              <div>
                <h4>Temperature Increased</h4>
                <p>91°C detected on CNC-07</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon orange" />
              <div>
                <h4>Vibration Analysis</h4>
                <p>28% above normal threshold</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon yellow" />
              <div>
                <h4>Root Cause Analysis</h4>
                <p>Bearing Wear Detected</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon blue" />
              <div>
                <h4>Failure Prediction</h4>
                <p>Failure Probability : 96%</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon green" />
              <div>
                <h4>Maintenance Planned</h4>
                <p>Technician Assigned Automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="ai-right">
        <div className="prediction-card">
          <h3>Failure Prediction</h3>
          <h1 id="failurePrediction">{failurePrediction}%</h1>
          <p>High Risk</p>
        </div>

        <div className="prediction-card">
          <h3>Remaining Useful Life</h3>
          <h1 id="rulValue">{rulValue}</h1>
          <p>Estimated Remaining Time</p>
        </div>

        <div className="prediction-card">
          <h3>Health Score</h3>
          <h1 id="healthScore">{healthScore}%</h1>
          <p>Needs Maintenance</p>
        </div>

        <div className="prediction-card">
          <h3>AI Confidence</h3>
          <h1>97%</h1>
          <p>Prediction Accuracy</p>
        </div>
      </div>
    </section>
  );
}
