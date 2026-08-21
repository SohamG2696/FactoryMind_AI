"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faIndustry,
  faHeartPulse,
  faTriangleExclamation,
  faBolt,
  faMicrochip,
  faRobot,
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
  const machineHealth = useAnimatedValue(70, 95, 1500);
  const confidence = useAnimatedValue(75, 97, 1800);

  return (
    <section className="kpi-section">
      <ElectricBorder color="#2563EB" speed={0.8} chaos={0.10} borderRadius={18}>
        <div className="kpi-card">
          <div className="icon blue">
            <FontAwesomeIcon icon={faIndustry} />
          </div>
          <div>
            <h3>Running Machines</h3>
            <h2 id="runningMachines">24 / 26</h2>
            <p>2 Machines Offline</p>
          </div>
        </div>
      </ElectricBorder>

      <ElectricBorder color="#16A34A" speed={0.8} chaos={0.10} borderRadius={18}>
        <div className="kpi-card">
          <div className="icon green">
            <FontAwesomeIcon icon={faHeartPulse} />
          </div>
          <div>
            <h3>Machine Health</h3>
            <h2 id="machineHealth">{machineHealth}%</h2>
            <p>Excellent Condition</p>
          </div>
        </div>
      </ElectricBorder>

      <ElectricBorder color="#DC2626" speed={1.2} chaos={0.18} borderRadius={18}>
        <div className="kpi-card">
          <div className="icon red">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <div>
            <h3>Critical Alerts</h3>
            <h2 id="criticalAlerts">02</h2>
            <p>Immediate Action</p>
          </div>
        </div>
      </ElectricBorder>

      <ElectricBorder color="#F59E0B" speed={0.8} chaos={0.10} borderRadius={18}>
        <div className="kpi-card">
          <div className="icon yellow">
            <FontAwesomeIcon icon={faBolt} />
          </div>
          <div>
            <h3>Energy Usage</h3>
            <h2 id="energy">126 kWh</h2>
            <p>Today&apos;s Consumption</p>
          </div>
        </div>
      </ElectricBorder>

      <ElectricBorder color="#0891B2" speed={0.8} chaos={0.10} borderRadius={18}>
        <div className="kpi-card">
          <div className="icon cyan">
            <FontAwesomeIcon icon={faMicrochip} />
          </div>
          <div>
            <h3>IoT Sensors</h3>
            <h2>318</h2>
            <p>Currently Active</p>
          </div>
        </div>
      </ElectricBorder>

      <ElectricBorder color="#7C3AED" speed={0.8} chaos={0.10} borderRadius={18}>
        <div className="kpi-card">
          <div className="icon purple">
            <FontAwesomeIcon icon={faRobot} />
          </div>
          <div>
            <h3>AI Confidence</h3>
            <h2 id="confidence">{confidence}%</h2>
            <p>Prediction Accuracy</p>
          </div>
        </div>
      </ElectricBorder>
    </section>
  );
}
