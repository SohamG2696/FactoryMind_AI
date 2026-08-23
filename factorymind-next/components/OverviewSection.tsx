"use client";

import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faCoins,
  faGaugeHigh,
  faBrain,
} from "@fortawesome/free-solid-svg-icons";

export default function OverviewSection() {
  const { role, user } = useAuth();
  const isAdmin = role === "ADMIN";
  const isSupervisor = role === "SUPERVISOR";

  return (
    <section className="overview-hud">
      <div className="overview-card-hud">
        <div className="overview-card-top">
          <span className="ov-tag">TELEMETRY YIELD</span>
          <span className="ov-trend positive">
            <FontAwesomeIcon icon={faArrowTrendUp} /> +8.4%
          </span>
        </div>
        <h3 className="ov-title">{isAdmin ? "Total Plant Output" : isSupervisor ? "Shift Target Output" : "Workcell Output"}</h3>
        <h1 className="ov-val">{isAdmin ? "18,450" : isSupervisor ? "4,850 / 5,200" : "840"}</h1>
        <p className="ov-sub">{isAdmin ? "Units Produced Today" : isSupervisor ? "Current Shift Pace (93%)" : "Machined Parts"}</p>
        <div className="ov-progress-bar">
          <div className="ov-fill blue-glow" style={{ width: "93%" }} />
        </div>
      </div>

      <div className="overview-card-hud">
        <div className="overview-card-top">
          <span className="ov-tag">FINANCIAL OPEX</span>
          <span className="ov-trend positive">
            <FontAwesomeIcon icon={faCoins} /> SAVINGS
          </span>
        </div>
        <h3 className="ov-title">{isAdmin ? "Maintenance Saved" : isSupervisor ? "Line Yield Pass" : "Cycle Time avg"}</h3>
        <h1 className="ov-val">{isAdmin ? "₹2.8 Lakh" : isSupervisor ? "98.2%" : "38.2s"}</h1>
        <p className="ov-sub">{isAdmin ? "Estimated Cost Reduction" : isSupervisor ? "Quality Metrology Pass" : "Per Component Spec"}</p>
        <div className="ov-progress-bar">
          <div className="ov-fill green-glow" style={{ width: "98%" }} />
        </div>
      </div>

      <div className="overview-card-hud">
        <div className="overview-card-top">
          <span className="ov-tag">OEE TELEMETRY</span>
          <span className="ov-trend neutral">
            <FontAwesomeIcon icon={faGaugeHigh} /> OPTIMAL
          </span>
        </div>
        <h3 className="ov-title">{isAdmin ? "Average Machine Efficiency" : isSupervisor ? "Floor Technicians" : "Cell Defect Rate"}</h3>
        <h1 className="ov-val">{isAdmin ? "92.4%" : isSupervisor ? "12 Active" : "0.02%"}</h1>
        <p className="ov-sub">{isAdmin ? "Across All Departments" : isSupervisor ? "Assigned on Current Shift" : "Target: < 0.10%"}</p>
        <div className="ov-progress-bar">
          <div className="ov-fill cyan-glow" style={{ width: "92%" }} />
        </div>
      </div>

      <div className="overview-card-hud">
        <div className="overview-card-top">
          <span className="ov-tag">AGENTIC CONTROL</span>
          <span className="ov-trend ai-pulse">
            <FontAwesomeIcon icon={faBrain} /> AUTONOMOUS
          </span>
        </div>
        <h3 className="ov-title">{isAdmin ? "Autonomous AI Decisions" : isSupervisor ? "Predictive Warnings" : "Shift Time Left"}</h3>
        <h1 className="ov-val">{isAdmin ? "18" : isSupervisor ? "03" : "2h 45m"}</h1>
        <p className="ov-sub">{isAdmin ? "Executed System-Wide" : isSupervisor ? "Logged for Preventive Check" : "Shift-A Floor Schedule"}</p>
        <div className="ov-progress-bar">
          <div className="ov-fill amber-glow" style={{ width: "85%" }} />
        </div>
      </div>
    </section>
  );
}
