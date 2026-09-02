"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faIndustry,
  faHeartPulse,
  faTriangleExclamation,
  faBolt,
  faMicrochip,
  faRobot,
  faClipboardCheck,
  faScrewdriverWrench,
  faGears,
  faWaveSquare,
} from "@fortawesome/free-solid-svg-icons";

function useAnimatedValue(start: number, end: number, duration: number) {
  const [value, setValue] = useState(start);

  useEffect(() => {
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      setValue(current);
      if (current === end) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [start, end, duration]);

  return value;
}

export default function KpiSection() {
  const { user, role } = useAuth();
  const machineHealth = useAnimatedValue(70, 95, 1500);
  const confidence = useAnimatedValue(75, 97, 1800);

  const isAdmin = role === "ADMIN";
  const isSupervisor = role === "SUPERVISOR";

  return (
    <section className="kpi-section">
      {/* KPI 1 */}
      <div className="kpi-card">
        <div className="kpi-card-inner">
          <div className="kpi-top-bar">
            <span className="kpi-tag-code">TAG: FLEET-26</span>
            <span className="kpi-live-dot" />
          </div>
          <div className="kpi-main-row">
            <div className="icon blue">
              <FontAwesomeIcon icon={isAdmin ? faIndustry : isSupervisor ? faGears : faMicrochip} />
            </div>
            <div className="kpi-data-block">
              <h3>{isAdmin ? "Running Machines" : isSupervisor ? "Supervised Units" : "Assigned Units"}</h3>
              <h2 id="runningMachines">
                {isAdmin ? "24 / 26" : isSupervisor ? `${user?.machinesManaged || 16} / 18` : `${user?.machinesManaged || 4} / 4`}
              </h2>
              <p>{isAdmin ? "2 Machines Offline" : isSupervisor ? "Line-1 Operating" : "Workcell Live"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 2 */}
      <div className="kpi-card">
        <div className="kpi-card-inner">
          <div className="kpi-top-bar">
            <span className="kpi-tag-code">TAG: OEE-RATE</span>
            <span className="kpi-live-dot green" />
          </div>
          <div className="kpi-main-row">
            <div className="icon green">
              <FontAwesomeIcon icon={faHeartPulse} />
            </div>
            <div className="kpi-data-block">
              <h3>{isAdmin ? "Plant Health" : isSupervisor ? "Line OEE Rate" : "Cell Health"}</h3>
              <h2 id="machineHealth" style={{ color: "#4ADE80" }}>
                {isAdmin ? `${machineHealth}%` : isSupervisor ? "92.4%" : "98%"}
              </h2>
              <p>{isAdmin ? "Excellent Condition" : isSupervisor ? "On Shift Target" : "Optimal Tolerance"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 3 */}
      <div className="kpi-card">
        <div className="kpi-card-inner">
          <div className="kpi-top-bar">
            <span className="kpi-tag-code">TAG: ALARM-02</span>
            <span className="kpi-live-dot red" />
          </div>
          <div className="kpi-main-row">
            <div className="icon red">
              <FontAwesomeIcon icon={isAdmin ? faTriangleExclamation : isSupervisor ? faScrewdriverWrench : faClipboardCheck} />
            </div>
            <div className="kpi-data-block">
              <h3>{isAdmin ? "Critical Alerts" : isSupervisor ? "Work Orders" : "Shift Tasks"}</h3>
              <h2 id="criticalAlerts" style={{ color: "#F87171" }}>
                {isAdmin ? "02" : isSupervisor ? "03" : "5 / 6"}
              </h2>
              <p>{isAdmin ? "Immediate Action" : isSupervisor ? "Pending Inspection" : "1 Check Pending"}</p>
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
              <FontAwesomeIcon icon={isAdmin ? faRobot : isSupervisor ? faBolt : faGears} />
            </div>
            <div className="kpi-data-block">
              <h3>{isAdmin ? "AI Model Accuracy" : isSupervisor ? "Power Quality" : "Tool Wear Life"}</h3>
              <h2 id="modelConfidence" style={{ color: "#FACC15" }}>
                {isAdmin ? `${confidence}%` : isSupervisor ? "415 V" : "88%"}
              </h2>
              <p>{isAdmin ? "LightGBM + Random Forest" : isSupervisor ? "Stable 50 Hz Grid" : "Remaining Life"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
