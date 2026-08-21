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

  useEffect(() => {
    const id = setInterval(() => {
      setHealth((prev) => {
        let next = prev + Math.floor(Math.random() * 3) - 1;
        if (next > 99) next = 99;
        if (next < 91) next = 91;
        return next;
      });
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
    <section className="hero">
      <div className="hero-content">
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: 20, marginBottom: 12, fontSize: 12 }}>
            <FontAwesomeIcon
              icon={isAdmin ? faUserShield : isSupervisor ? faUserTie : faUserGear}
              style={{ color: isAdmin ? "#f59e0b" : isSupervisor ? "#06b6d4" : "#10b981" }}
            />
            <span style={{ fontWeight: 600, color: "#cbd5e1" }}>
              {isAdmin
                ? "Executive Leadership Portal"
                : isSupervisor
                ? "Shift Supervisor Station"
                : "Machine Operator Workcell"}
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
            <span style={{ color: "#94a3b8" }}>{user?.department || "Plant Floor"}</span>
          </div>

          <h2>
            {isAdmin && "Smart Factory Executive Governance"}
            {isSupervisor && "Shift Production & Line Supervision"}
            {!isAdmin && !isSupervisor && "Operator Workcell Control Hub"}
          </h2>

          <p>
            {isAdmin &&
              `Welcome back, ${user?.name || "Director"}. Full plant 26-machine fleet telemetry, autonomous multi-agent policies, and executive compliance controls are active.`}
            {isSupervisor &&
              `Welcome back, ${user?.name || "Supervisor"}. Line operations, technician dispatch, real-time vibration alarms, and shift target execution are under your watch.`}
            {!isAdmin && !isSupervisor &&
              `Welcome, ${user?.name || "Operator"}. Connected to your assigned machining cell. Live motor telemetry, tool-life indicators, and safety checklists are active.`}
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={handleDigitalTwinClick}
              id="hero-open-digital-twin-btn"
            >
              {isAdmin ? "Open Global Digital Twin" : isSupervisor ? "Open Shift Digital Twin" : "Open Assigned Workcell"}
            </button>
            <button
              className="secondary-btn"
              onClick={handleAiInsightsClick}
              id="hero-ai-insights-btn"
            >
              {isAdmin ? "AI Governance Insights" : isSupervisor ? "Floor Diagnostics" : "Operator Safety Guide"}
            </button>
          </div>
        </div>

        <div className="hero-status">
          <div className="status-circle">
            <h1>{health}%</h1>
            <p>{isAdmin ? "Plant Health" : isSupervisor ? "Shift Line Health" : "Workcell Health"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
