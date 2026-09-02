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
  faCircleDot,
  faXmark,
  faWaveSquare,
  faShieldHalved,
  faBolt,
  faTemperatureHalf,
  faGaugeHigh,
  faTriangleExclamation,
  faWrench,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

const STATUS_COLORS: Record<string, string> = {
  green: "#4ADE80",
  yellow: "#FACC15",
  red: "#F87171",
  blue: "#A78BFA",
};

const STATUS_CHAOS: Record<string, number> = {
  green: 0.08,
  yellow: 0.08,
  red: 0.12,
  blue: 0.08,
};

interface MachineData {
  id: string;
  code: string;
  label: string;
  category: string;
  status: "green" | "yellow" | "red" | "blue";
  cls: string;
  icon: typeof faGears;
  info: [string, string][];
  telemetry: {
    temp: string;
    rpm: string;
    vibration: string;
    load: string;
    healthScore: number;
    riskLevel: string;
    predictiveModel: string;
    aiRecommendation: string;
    lastMaintenance: string;
  };
}

const machines: MachineData[] = [
  {
    id: "cnc1",
    code: "CELL-01",
    label: "CNC-01 Milling Station",
    category: "cnc",
    status: "green",
    cls: "healthy",
    icon: faGears,
    info: [["Temp", "64°C"], ["RPM", "1450"], ["Health", "97%"]],
    telemetry: {
      temp: "64.2 °C (Normal)",
      rpm: "1,450 RPM",
      vibration: "0.82 mm/s (Low)",
      load: "68%",
      healthScore: 97,
      riskLevel: "Low Risk (3.2%)",
      predictiveModel: "LightGBM Binary + RandomForest",
      aiRecommendation: "Operating within optimal parameters. Next routine cycle in 48h.",
      lastMaintenance: "3 days ago",
    },
  },
  {
    id: "robot",
    code: "CELL-02",
    label: "6-Axis Robotic Arm",
    category: "robotics",
    status: "green",
    cls: "healthy",
    icon: faRobot,
    info: [["Load", "72%"], ["Speed", "89%"], ["Health", "96%"]],
    telemetry: {
      temp: "42.0 °C (Nominal)",
      rpm: "N/A (Servo 3.2 rad/s)",
      vibration: "0.45 mm/s (Stable)",
      load: "72%",
      healthScore: 96,
      riskLevel: "Low Risk (4.1%)",
      predictiveModel: "Trajectory Kinematics AI",
      aiRecommendation: "Joint calibration verified. Precision tolerance at ±0.02mm.",
      lastMaintenance: "Yesterday",
    },
  },
  {
    id: "conveyor",
    code: "CELL-03",
    label: "High-Speed Infeed Conveyor",
    category: "logistics",
    status: "yellow",
    cls: "warning",
    icon: faArrowRightLong,
    info: [["Speed", "2.8 m/s"], ["Load", "84%"], ["Health", "81%"]],
    telemetry: {
      temp: "58.6 °C (Elevated)",
      rpm: "820 RPM Roller",
      vibration: "2.14 mm/s (Moderate)",
      load: "84%",
      healthScore: 81,
      riskLevel: "Medium Warning (38.4%)",
      predictiveModel: "Belt Friction & Tension ML",
      aiRecommendation: "Belt tension deviation detected on Sector-B. Schedule tension re-alignment.",
      lastMaintenance: "12 days ago",
    },
  },
  {
    id: "cnc7",
    code: "CELL-04",
    label: "CNC-07 Heavy Lathe",
    category: "cnc",
    status: "red",
    cls: "critical",
    icon: faGears,
    info: [["Temp", "91°C"], ["Vibration", "High"], ["Health", "58%"]],
    telemetry: {
      temp: "91.5 °C (Critical Heat)",
      rpm: "1,320 RPM (Degraded)",
      vibration: "4.85 mm/s (High Peak)",
      load: "92%",
      healthScore: 58,
      riskLevel: "Critical Risk (88.6%)",
      predictiveModel: "LightGBM Binary Classifier (AI4I)",
      aiRecommendation: "Immediate Bearing Replacement Required! Spindle thermal runaway threshold breached.",
      lastMaintenance: "28 days ago",
    },
  },
  {
    id: "press",
    code: "CELL-05",
    label: "Hydraulic Stamping Press",
    category: "press",
    status: "green",
    cls: "healthy",
    icon: faCompress,
    info: [["Pressure", "132 bar"], ["Cycles", "482"], ["Health", "94%"]],
    telemetry: {
      temp: "51.3 °C (Nominal)",
      rpm: "Pump 1,750 RPM",
      vibration: "1.10 mm/s (Normal)",
      load: "76%",
      healthScore: 94,
      riskLevel: "Low Risk (5.8%)",
      predictiveModel: "Hydraulic Seal Degradation ML",
      aiRecommendation: "Hydraulic fluid viscosity in optimal zone. Valve pressure stable.",
      lastMaintenance: "5 days ago",
    },
  },
  {
    id: "warehouse",
    code: "CELL-06",
    label: "AS/RS Automated Warehouse",
    category: "logistics",
    status: "blue",
    cls: "maintenance",
    icon: faWarehouse,
    info: [["Stock", "82%"], ["Robots", "5 Active"], ["Status", "Active"]] ,
    telemetry: {
      temp: "22.4 °C (Climate Controlled)",
      rpm: "Shuttle 2.4 m/s",
      vibration: "0.30 mm/s",
      load: "82% Capacity",
      healthScore: 91,
      riskLevel: "Nominal / Scheduled Sweep",
      predictiveModel: "Automated Inventory Routing AI",
      aiRecommendation: "AGV fleet battery recharge rotation active. Buffer throughput normal.",
      lastMaintenance: "Weekly cycle active",
    },
  },
];

export default function DigitalTwin() {
  const sensor = useSensorData();
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachineData | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Periodic random highlight pulse
  useEffect(() => {
    const id = setInterval(() => {
      setHighlighted(Math.floor(Math.random() * machines.length));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const filteredMachines = filterCategory === "all"
    ? machines
    : machines.filter((m) => m.category === filterCategory);

  return (
    <section className="digital-twin-section">
      {/* Interactive Machine Detail Inspector Modal */}
      {selectedMachine && (
        <div className="dt-inspector-backdrop" onClick={() => setSelectedMachine(null)}>
          <div className="dt-inspector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dt-modal-header">
              <div className="dt-modal-title-group">
                <span className="dt-modal-code">{selectedMachine.code}</span>
                <h3>{selectedMachine.label}</h3>
                <span className={`dt-status-pill status-${selectedMachine.status}`}>
                  <span className="dt-status-dot" />
                  {selectedMachine.cls.toUpperCase()}
                </span>
              </div>
              <button
                className="dt-modal-close"
                onClick={() => setSelectedMachine(null)}
                aria-label="Close Inspector"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="dt-modal-body">
              {/* Telemetry stats grid */}
              <div className="dt-telemetry-grid">
                <div className="dt-telemetry-card">
                  <div className="dt-tc-label">
                    <FontAwesomeIcon icon={faTemperatureHalf} style={{ color: "#F87171" }} />
                    <span>Operating Temperature</span>
                  </div>
                  <div className="dt-tc-value">{selectedMachine.telemetry.temp}</div>
                </div>

                <div className="dt-telemetry-card">
                  <div className="dt-tc-label">
                    <FontAwesomeIcon icon={faGaugeHigh} style={{ color: "#A78BFA" }} />
                    <span>Spindle / Motor Speed</span>
                  </div>
                  <div className="dt-tc-value">{selectedMachine.telemetry.rpm}</div>
                </div>

                <div className="dt-telemetry-card">
                  <div className="dt-tc-label">
                    <FontAwesomeIcon icon={faWaveSquare} style={{ color: "#FACC15" }} />
                    <span>Vibration Amplitude</span>
                  </div>
                  <div className="dt-tc-value">{selectedMachine.telemetry.vibration}</div>
                </div>

                <div className="dt-telemetry-card">
                  <div className="dt-tc-label">
                    <FontAwesomeIcon icon={faBolt} style={{ color: "#4ADE80" }} />
                    <span>Load Utilization</span>
                  </div>
                  <div className="dt-tc-value">{selectedMachine.telemetry.load}</div>
                </div>
              </div>

              {/* AI Predictive Inference Box */}
              <div className="dt-ai-verdict-box">
                <div className="dt-verdict-header">
                  <div className="dt-vh-title">
                    <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#A78BFA" }} />
                    <strong>Digital Twin AI Inference</strong>
                  </div>
                  <span className="dt-verdict-model">{selectedMachine.telemetry.predictiveModel}</span>
                </div>
                <div className="dt-verdict-content">
                  <div className="dt-verdict-score-row">
                    <span>Machine Health Score:</span>
                    <strong style={{ color: selectedMachine.telemetry.healthScore > 75 ? "#4ADE80" : "#F87171" }}>
                      {selectedMachine.telemetry.healthScore}%
                    </strong>
                    <span className="dt-verdict-sep">·</span>
                    <span>Risk:</span>
                    <strong style={{ color: selectedMachine.status === "red" ? "#F87171" : selectedMachine.status === "yellow" ? "#FACC15" : "#4ADE80" }}>
                      {selectedMachine.telemetry.riskLevel}
                    </strong>
                  </div>
                  <p className="dt-verdict-recommendation">
                    {selectedMachine.telemetry.aiRecommendation}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="dt-modal-actions">
                <button
                  className="dt-btn-action primary"
                  onClick={() => {
                    alert(`Dispatched maintenance diagnostics for ${selectedMachine.label}`);
                    setSelectedMachine(null);
                  }}
                >
                  <FontAwesomeIcon icon={faWrench} />
                  <span>Dispatch Maintenance Engineer</span>
                </button>
                <button
                  className="dt-btn-action secondary"
                  onClick={() => setSelectedMachine(null)}
                >
                  <FontAwesomeIcon icon={faCircleCheck} />
                  <span>Acknowledge Telemetry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left: Interactive Factory Floor Blueprint */}
      <div className="factory-layout">
        <div className="dt-header-banner">
          <div className="dt-title-left">
            <div className="dt-live-tag">
              <span className="dt-pulse" />
              <span>LIVE DIGITAL TWIN SCHEMATIC</span>
            </div>
            <h2>🏭 Factory Digital Twin Blueprint</h2>
            <p>Real-Time SCADA Floor Model · Interactive Machine Fleet Inspector</p>
          </div>

          {/* Filter Pills */}
          <div className="dt-filter-pills">
            <button
              className={`dt-filter-pill ${filterCategory === "all" ? "active" : ""}`}
              onClick={() => setFilterCategory("all")}
            >
              All Cells (6)
            </button>
            <button
              className={`dt-filter-pill ${filterCategory === "cnc" ? "active" : ""}`}
              onClick={() => setFilterCategory("cnc")}
            >
              CNC (2)
            </button>
            <button
              className={`dt-filter-pill ${filterCategory === "robotics" ? "active" : ""}`}
              onClick={() => setFilterCategory("robotics")}
            >
              Robotics
            </button>
            <button
              className={`dt-filter-pill ${filterCategory === "logistics" ? "active" : ""}`}
              onClick={() => setFilterCategory("logistics")}
            >
              Logistics
            </button>
          </div>
        </div>

        <div className="factory-map">
          {filteredMachines.map((m, idx) => (
            <div
              key={m.id}
              id={m.id}
              className={`machine-card ${m.cls} ${highlighted === idx ? "pulse-active" : ""}`}
              onClick={() => setSelectedMachine(m)}
              title="Click to inspect real-time machine telemetry and AI diagnosis"
              role="button"
              tabIndex={0}
            >
              <div className="machine-header">
                <div className="machine-code-badge">{m.code}</div>
                <span className="machine-name">{m.label}</span>
                <span className={`status-dot ${m.status}`} />
              </div>
              <div className="machine-icon">
                <FontAwesomeIcon icon={m.icon} />
              </div>
              <div className="machine-info">
                {m.info.map(([key, val]) => (
                  <p key={key}>
                    <span className="info-key">{key}:</span> <span className="info-val">{val}</span>
                  </p>
                ))}
              </div>
              <div className="machine-card-footer">
                <span className="inspect-hint">Click to Inspect Telemetry →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Live Sensor Telemetry Stream */}
      <div className="sensor-panel">
        <div className="sensor-panel-header">
          <div className="sensor-panel-title">
            <span className="sensor-live-dot" />
            <h3>📡 Live Sensor Stream</h3>
          </div>
          <span className="sensor-rate-badge">100 Hz MQTT</span>
        </div>

        <div className="sensor-card">
          <div className="sensor-card-top">
            <h4>🌡 Spindle Temperature</h4>
            <span className="sensor-badge red">Thermal Probe</span>
          </div>
          <h2 id="tempValue">{sensor.temp}</h2>
          <div className="progress">
            <div className="progress-fill red-fill" />
          </div>
          <div className="sensor-meta">
            <span>Peak: 91.5°C</span>
            <span>Limit: 95°C</span>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-card-top">
            <h4>⚙ Spindle RPM</h4>
            <span className="sensor-badge blue">Optical Encoder</span>
          </div>
          <h2 id="rpmValue">{sensor.rpm}</h2>
          <div className="progress">
            <div className="progress-fill blue-fill" />
          </div>
          <div className="sensor-meta">
            <span>Target: 1,500 RPM</span>
            <span>Load: 86%</span>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-card-top">
            <h4>🔋 Plant Energy Draw</h4>
            <span className="sensor-badge green">Power Monitor</span>
          </div>
          <h2 id="energyValue">{sensor.energy}</h2>
          <div className="progress">
            <div className="progress-fill green-fill" />
          </div>
          <div className="sensor-meta">
            <span>Grid: 415V 50Hz</span>
            <span>PF: 0.98</span>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-card-top">
            <h4>📳 Spindle Vibration</h4>
            <span className="sensor-badge yellow">3-Axis Piezo</span>
          </div>
          <h2 id="vibrationValue">{sensor.vibration}</h2>
          <div className="progress">
            <div className="progress-fill yellow-fill" />
          </div>
          <div className="sensor-meta">
            <span>RMS: 3.4 mm/s</span>
            <span>Freq: 120 Hz</span>
          </div>
        </div>
      </div>
    </section>
  );
}

