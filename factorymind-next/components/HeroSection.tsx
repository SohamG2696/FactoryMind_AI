"use client";

import { useAuth } from "@/context/AuthContext";
import { useSim } from "@/context/FactorySimContext";
import { summarizePlant, formatAccuracy, SIGNALS_PER_CELL } from "@/lib/plantMetrics";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield,
  faUserTie,
  faUserGear,
  faArrowRight,
  faBolt,
  faShieldHalved,
  faTowerBroadcast,
  faMicrochip,
  faCircleDot,
} from "@fortawesome/free-solid-svg-icons";

interface HeroSectionProps {
  onOpenDigitalTwin?: () => void;
  onOpenAiInsights?: () => void;
}

export default function HeroSection({
  onOpenDigitalTwin,
  onOpenAiInsights,
}: HeroSectionProps) {
  const { user, role } = useAuth();
  const { state, agent, mlHealth } = useSim();
  const plant = summarizePlant(state, agent.latest?.ml ?? {});
  const oee = Math.round(state.oee * 100);
  const plantState =
    plant.criticalCells > 0 ? "CRITICAL" : plant.warningCells > 0 ? "DEGRADED" : "OPTIMAL";

  const handleDigitalTwinClick = () => {
    if (onOpenDigitalTwin) {
      onOpenDigitalTwin();
    } else {
      const el = document.querySelector(".digital-twin-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAiInsightsClick = () => {
    if (onOpenAiInsights) {
      onOpenAiInsights();
    } else {
      const el = document.querySelector(".ai-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isAdmin = role === "ADMIN";
  const isSupervisor = role === "SUPERVISOR";

  return (
    <section className="hero-hud">
      {/* Background Cyber Grid & Radar Glow */}
      <div className="hero-hud-bg" />
      <div className="hero-hud-scanline" />

      <div className="hero-content">
        <div className="hero-left">
          {/* Eyebrow badge matching landing page */}
          <div className="hero-eyebrow-badge">
            <span className="hero-pulsing-dot" />
            <span className="hero-eyebrow-text">
              DIGITAL TWIN TELEMETRY &nbsp;·&nbsp; INDUSTRY 4.0 &nbsp;·&nbsp;
              {isAdmin ? "EXECUTIVE GOVERNANCE" : isSupervisor ? "SHIFT SUPERVISION" : "OPERATOR WORKCELL"}
            </span>
          </div>

          <div className="hero-role-pill">
            <FontAwesomeIcon
              icon={isAdmin ? faUserShield : isSupervisor ? faUserTie : faUserGear}
              style={{ color: isAdmin ? "#C87D1F" : isSupervisor ? "#4A6D8C" : "#3F7A5F" }}
            />
            <span className="hero-role-name">
              {isAdmin
                ? "Executive Leadership Portal"
                : isSupervisor
                ? "Shift Supervisor Station"
                : "Machine Operator Workcell"}
            </span>
            <span className="hero-role-sep">/</span>
            <span className="hero-role-dept">{user?.department || "Plant Floor"}</span>
          </div>

          <h2 className="hero-title">
            {isAdmin && (
              <>
                Autonomous Smart Factory <span>Intelligence</span>
              </>
            )}
            {isSupervisor && (
              <>
                Shift Production & <span>Line Supervision</span>
              </>
            )}
            {!isAdmin && !isSupervisor && (
              <>
                Operator Workcell <span>Control Hub</span>
              </>
            )}
          </h2>

          <p className="hero-desc">
            {isAdmin &&
              `Welcome back, ${user?.name || "Director"}. Full plant ${plant.totalCells}-cell fleet telemetry, autonomous multi-agent policies, and dual-model predictive maintenance are active.`}
            {isSupervisor &&
              `Welcome back, ${user?.name || "Supervisor"}. Line operations, technician dispatch, real-time vibration alarms, and shift target execution are under active monitoring.`}
            {!isAdmin && !isSupervisor &&
              `Welcome, ${user?.name || "Operator"}. Connected to your assigned machining cell. Live motor telemetry, tool-life indicators, and safety checklists are streaming.`}
          </p>

          <div className="hero-buttons">
            <button
              className="hero-primary-btn"
              onClick={handleDigitalTwinClick}
              id="hero-open-digital-twin-btn"
            >
              <span>{isAdmin ? "Launch Global Digital Twin" : isSupervisor ? "Open Shift Digital Twin" : "Open Assigned Workcell"}</span>
              <FontAwesomeIcon icon={faArrowRight} className="hero-btn-arrow" />
            </button>
            <button
              className="hero-secondary-btn"
              onClick={handleAiInsightsClick}
              id="hero-ai-insights-btn"
            >
              <FontAwesomeIcon icon={faMicrochip} style={{ marginRight: 8, color: "#FF5A1F" }} />
              <span>{isAdmin ? "AI Governance Insights" : isSupervisor ? "Floor Diagnostics" : "Operator Safety Guide"}</span>
            </button>
          </div>

          {/* Quick HUD Metrics Bar — live from the shared simulation + ML service */}
          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <span className="hero-stat-value">{plant.runningCells} / {plant.totalCells}</span>
              <span className="hero-stat-label">Cells Online</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="hero-stat-value">{plant.totalCells * SIGNALS_PER_CELL}</span>
              <span className="hero-stat-label">Live Sensor Signals</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="hero-stat-value">{state.throughputPerHour.toFixed(0)}/h</span>
              <span className="hero-stat-label">Throughput</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item" title={mlHealth.evaluationMethod ?? undefined}>
              <span className="hero-stat-value" style={{ color: "#3F7A5F" }}>{formatAccuracy(mlHealth)}</span>
              <span className="hero-stat-label">AI Accuracy</span>
            </div>
          </div>
        </div>

        {/* Right: Digital Twin Radial HUD Gauge */}
        <div className="hero-hud-gauge-wrap">
          <div className="hero-gauge-container">
            {/* Animated Rotating Radar Rings */}
            <div className="gauge-radar-ring outer-ring" />
            <div className="gauge-radar-ring inner-ring" />
            <div className="gauge-sweep-line" />

            <div className="gauge-center-dial">
              <div className="gauge-badge">
                <FontAwesomeIcon icon={faTowerBroadcast} className="gauge-icon" />
                <span>TELEMETRY STREAM</span>
              </div>
              <h1 className="gauge-percent">{oee}%</h1>
              <p className="gauge-title">
                Plant OEE
              </p>
              <div className="gauge-status-tag">
                <span className="gauge-status-dot" />
                <span>STATE: {plantState}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
