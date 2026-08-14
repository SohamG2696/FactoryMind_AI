"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faTriangleExclamation,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

const alertMessages = [
  "Robot Arm Working Normally",
  "Temperature Stabilized",
  "Warehouse Inventory Updated",
  "Energy Consumption Optimized",
  "AI Inspection Completed",
  "Predictive Maintenance Completed",
];

const initial = [
  "CNC-07 Temperature Critical",
  "Conveyor Belt Alignment Warning",
  "Robot Arm Calibration Completed",
];

export default function AlertsSection() {
  const [titles, setTitles] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => {
      setTitles((prev) => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        next[idx] = alertMessages[Math.floor(Math.random() * alertMessages.length)];
        return next;
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const alertDefs = [
    { cls: "critical", icon: faCircleExclamation, sub: "Detected 30 seconds ago" },
    { cls: "warning", icon: faTriangleExclamation, sub: "Detected 2 minutes ago" },
    { cls: "success", icon: faCircleCheck, sub: "Completed 10 minutes ago" },
  ];

  return (
    <section className="alerts-section">
      <div className="alerts-card">
        <div className="section-title">
          <h2>🚨 Real-Time Alerts</h2>
        </div>
        {alertDefs.map((a, i) => (
          <div key={i} className={`alert ${a.cls}`}>
            <span className="alert-icon">
              <FontAwesomeIcon icon={a.icon} />
            </span>
            <div>
              <h4>{titles[i]}</h4>
              <p>{a.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
