"use client";

import { useState, useEffect } from "react";
import { useSensorData } from "@/hooks/useSensorData";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGears,
  faRobot,
  faArrowRightLong,
  faCompress,
  faWarehouse,
} from "@fortawesome/free-solid-svg-icons";
import ElectricBorder from "./ElectricBorder";

const STATUS_COLORS: Record<string, string> = {
  green: "#22C55E",
  yellow: "#FACC15",
  red: "#EF4444",
  blue: "#3B82F6",
};

const STATUS_CHAOS: Record<string, number> = {
  green: 0.10,
  yellow: 0.10,
  red: 0.11,
  blue: 0.10,
};

export default function DigitalTwin() {
  const sensor = useSensorData();
  const [highlighted, setHighlighted] = useState<number | null>(null);

  const machines = [
    { id: "cnc1", label: "CNC-01", status: "green", cls: "healthy", icon: faGears, info: [["Temp", "64°C"], ["RPM", "1450"], ["Health", "97%"]] },
    { id: "robot", label: "Robot Arm", status: "green", cls: "healthy", icon: faRobot, info: [["Load", "72%"], ["Speed", "89%"], ["Health", "96%"]] },
    { id: "conveyor", label: "Conveyor", status: "yellow", cls: "warning", icon: faArrowRightLong, info: [["Speed", "2.8 m/s"], ["Load", "84%"], ["Health", "81%"]] },
    { id: "cnc7", label: "CNC-07", status: "red", cls: "critical", icon: faGears, info: [["Temp", "91°C"], ["Vibration", "High"], ["Health", "58%"]] },
    { id: "press", label: "Hydraulic Press", status: "green", cls: "healthy", icon: faCompress, info: [["Pressure", "132 bar"], ["Cycles", "482"], ["Health", "94%"]] },
    { id: "warehouse", label: "Warehouse", status: "blue", cls: "maintenance", icon: faWarehouse, info: [["Stock", "82%"], ["Robots", "5"], ["Status", "Maintenance"]] },
  ];

  // Random machine highlight every 4s
  useEffect(() => {
    const id = setInterval(() => {
      setHighlighted(Math.floor(Math.random() * machines.length));
    }, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="digital-twin-section">
      {/* Left: Factory map */}
      <div className="factory-layout">
        <div className="section-title">
          <h2>🏭 Factory Digital Twin</h2>
          <p>Real-Time Smart Factory Visualization</p>
        </div>
        <div className="factory-map">
          {machines.map((m, idx) => (
            <ElectricBorder
              key={m.id}
              color={STATUS_COLORS[m.status]}
              speed={highlighted === idx ? 1.4 : 0.9}
              chaos={highlighted === idx ? 0.12 : STATUS_CHAOS[m.status]}
              borderRadius={18}
            >
              <div
                id={m.id}
                className={`machine-card ${m.cls}`}
                style={{
                  boxShadow: highlighted === idx ? `0 0 25px ${STATUS_COLORS[m.status]}55` : undefined,
                }}
              >
                <div className="machine-header">
                  <span>{m.label}</span>
                  <span className={`status-dot ${m.status}`} />
                </div>
                <div className="machine-icon">
                  <FontAwesomeIcon icon={m.icon} />
                </div>
                <div className="machine-info">
                  {m.info.map(([key, val]) => (
                    <p key={key}>
                      {key} : <span>{val}</span>
                    </p>
                  ))}
                </div>
              </div>
            </ElectricBorder>
          ))}
        </div>
      </div>

      {/* Right: Sensor panel */}
      <div className="sensor-panel">
        <div className="section-title">
          <h2>📡 Live Sensor Feed</h2>
        </div>

        <div className="sensor-card">
          <h4>🌡 Temperature</h4>
          <h2 id="tempValue">{sensor.temp}</h2>
          <div className="progress">
            <div className="progress-fill red-fill" />
          </div>
        </div>

        <div className="sensor-card">
          <h4>⚙ RPM</h4>
          <h2 id="rpmValue">{sensor.rpm}</h2>
          <div className="progress">
            <div className="progress-fill blue-fill" />
          </div>
        </div>

        <div className="sensor-card">
          <h4>🔋 Energy</h4>
          <h2 id="energyValue">{sensor.energy}</h2>
          <div className="progress">
            <div className="progress-fill green-fill" />
          </div>
        </div>

        <div className="sensor-card">
          <h4>📳 Vibration</h4>
          <h2 id="vibrationValue">{sensor.vibration}</h2>
          <div className="progress">
            <div className="progress-fill yellow-fill" />
          </div>
        </div>
      </div>
    </section>
  );
}

