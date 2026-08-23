"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
  const [health, setHealth] = useState(96);
  const [activeNodes, setActiveNodes] = useState(318);

  useEffect(() => {
    const id = setInterval(() => {
      setHealth((prev) => {
        let next = prev + Math.floor(Math.random() * 3) - 1;
        if (next > 99) next = 99;
        if (next < 91) next = 91;
        return next;
      });
      setActiveNodes((prev) => 318 + Math.floor(Math.random() * 3) - 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

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
              style={{ color: isAdmin ? "#f59e0b" : isSupervisor ? "#38bdf8" : "#10b981" }}
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
              `Welcome back, ${user?.name || "Director"}. Full plant 26-machine fleet telemetry, autonomous multi-agent policies, and dual-model predictive maintenance are active.`}
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
              <FontAwesomeIcon icon={faMicrochip} style={{ marginRight: 8, color: "#38bdf8" }} />
              <span>{isAdmin ? "AI Governance Insights" : isSupervisor ? "Floor Diagnostics" : "Operator Safety Guide"}</span>
            </button>
          </div>

          {/* Quick HUD Metrics Bar */}
          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <span className="hero-stat-value">26</span>
              <span className="hero-stat-label">Active Machines</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="hero-stat-value">{activeNodes}</span>
              <span className="hero-stat-label">IoT Sensor Nodes</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="hero-stat-value">12ms</span>
              <span className="hero-stat-label">SCADA Latency</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="hero-stat-value" style={{ color: "#10b981" }}>97.4%</span>
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
              <h1 className="gauge-percent">{health}%</h1>
              <p className="gauge-title">
                {isAdmin ? "Plant Health OEE" : isSupervisor ? "Shift Line Health" : "Workcell Health"}
              </p>
              <div className="gauge-status-tag">
                <span className="gauge-status-dot" />
                <span>STATE: OPTIMAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
