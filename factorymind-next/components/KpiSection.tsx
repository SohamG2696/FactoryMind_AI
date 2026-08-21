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
} from "@fortawesome/free-solid-svg-icons";
import ElectricBorder from "./ElectricBorder";

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
      <ElectricBorder color="#2563EB" speed={0.8} chaos={0.10} borderRadius={18}>
        <div className="kpi-card">
          <div className="icon blue">
            <FontAwesomeIcon icon={isAdmin ? faIndustry : isSupervisor ? faGears : faMicrochip} />
          </div>
          <div>
            <h3>{isAdmin ? "Running Machines" : isSupervisor ? "Supervised Units" : "Assigned Units"}</h3>
            <h2 id="runningMachines">
              {isAdmin ? "24 / 26" : isSupervisor ? `${user?.machinesManaged || 16} / 18` : `${user?.machinesManaged || 4} / 4`}
            </h2>
            <p>{isAdmin ? "2 Machines Offline" : isSupervisor ? "Line-1 Operating" : "Workcell Live"}</p>
          </div>
        </div>
      </ElectricBorder>

      {/* KPI 2 */}
      <ElectricBorder color="#16A34A" speed={0.8} chaos={0.10} borderRadius={18}>
        <div className="kpi-card">
          <div className="icon green">
            <FontAwesomeIcon icon={faHeartPulse} />
          </div>
          <div>
            <h3>{isAdmin ? "Plant Health" : isSupervisor ? "Line OEE Rate" : "Cell Health"}</h3>
            <h2 id="machineHealth">
              {isAdmin ? `${machineHealth}%` : isSupervisor ? "92.4%" : "98%"}
            </h2>
            <p>{isAdmin ? "Excellent Condition" : isSupervisor ? "On Shift Target" : "Optimal Tolerance"}</p>
          </div>
        </div>
      </ElectricBorder>

      {/* KPI 3 */}
      <ElectricBorder color="#DC2626" speed={1.2} chaos={0.18} borderRadius={18}>
        <div className="kpi-card">
          <div className="icon red">
            <FontAwesomeIcon icon={isAdmin ? faTriangleExclamation : isSupervisor ? faScrewdriverWrench : faClipboardCheck} />
          </div>
          <div>
            <h3>{isAdmin ? "Critical Alerts" : isSupervisor ? "Work Orders" : "Shift Tasks"}</h3>
            <h2 id="criticalAlerts">{isAdmin ? "02" : isSupervisor ? "03" : "5 / 6"}</h2>
            <p>{isAdmin ? "Immediate Action" : isSupervisor ? "Pending Inspection" : "1 Check Pending"}</p>
          </div>
        </div>
      </ElectricBorder>

      {/* KPI 4 */}
      <ElectricBorder color="#F59E0B" speed={0.8} chaos={0.10} borderRadius={18}>
        <div className="kpi-card">
          <div className="icon orange">
            <FontAwesomeIcon icon={isAdmin ? faRobot : isSupervisor ? faBolt : faGears} />
          </div>
          <div>
            <h3>{isAdmin ? "AI Model Accuracy" : isSupervisor ? "Power Quality" : "Tool Wear Life"}</h3>
            <h2 id="modelConfidence">
              {isAdmin ? `${confidence}%` : isSupervisor ? "415 V" : "88%"}
            </h2>
            <p>{isAdmin ? "Gradient Boost + NN" : isSupervisor ? "Stable 50 Hz Grid" : "Remaining Life"}</p>
          </div>
        </div>
      </ElectricBorder>
    </section>
  );
}
