"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBoxesStacked,
  faGears,
  faRobot,
  faMicroscope,
  faBoxOpen,
  faWarehouse,
  faCircleDot,
  faBolt,
  faNetworkWired,
} from "@fortawesome/free-solid-svg-icons";

interface Stage {
  name: string;
  code: string;
  icon: typeof faGears;
  rate: string;
  status: string;
  statusCls: string;
  tag: string;
}

const initialSteps: Stage[] = [
  { name: "Raw Infeed", code: "STAGE-01", icon: faBoxesStacked, rate: "45 pcs/min", status: "Active", statusCls: "green", tag: "INSPECTION PASS" },
  { name: "CNC Machining", code: "STAGE-02", icon: faGears, rate: "38.2s / pc", status: "Operating", statusCls: "green", tag: "TOLERANCE ±0.01" },
  { name: "Robotic Transfer", code: "STAGE-03", icon: faRobot, rate: "89% Speed", status: "In Sync", statusCls: "green", tag: "SERVO LOCKED" },
  { name: "Metrology & QC", code: "STAGE-04", icon: faMicroscope, rate: "99.8% Pass", status: "Vision Active", statusCls: "blue", tag: "OPTICAL AI" },
  { name: "Auto Packaging", code: "STAGE-05", icon: faBoxOpen, rate: "42 boxes/h", status: "Buffered", statusCls: "green", tag: "BARCODE VERIFIED" },
  { name: "Smart Storage", code: "STAGE-06", icon: faWarehouse, rate: "5 AGVs", status: "Optimal", statusCls: "blue", tag: "AS/RS SYNCED" },
];

export default function ProductionFlow() {
  const [activeStep, setActiveStep] = useState(0);

  // Pulse along the pipeline steps
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % initialSteps.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="production-flow-hud">
      <div className="flow-hud-header">
        <div className="flow-header-left">
          <div className="flow-badge">
            <span className="flow-pulse-dot" />
            <span>CONTINUOUS TELEMETRY PIPELINE</span>
          </div>
          <h2>⚡ Autonomous Production Line Stream</h2>
          <p>Real-Time Conveyor Pipeline · AI Metrology & Workcell Handshakes</p>
        </div>

        <div className="flow-header-stats">
          <div className="flow-stat-pill">
            <span className="pill-label">LINE SPEED:</span>
            <span className="pill-val">100% NOMINAL</span>
          </div>
          <div className="flow-stat-pill">
            <span className="pill-label">YIELD:</span>
            <span className="pill-val" style={{ color: "#4ADE80" }}>98.4%</span>
          </div>
        </div>
      </div>

      <div className="flow-container">
        {initialSteps.map((step, i) => {
          const isPulse = activeStep === i;
          return (
            <React.Fragment key={step.name}>
              <div className={`flow-stage-card ${isPulse ? "stage-pulsing" : ""}`}>
                <div className="stage-top-row">
                  <span className="stage-code">{step.code}</span>
                  <span className={`stage-status-tag ${step.statusCls}`}>
                    <span className="stage-dot" />
                    {step.status}
                  </span>
                </div>

                <div className="stage-icon-wrap">
                  <FontAwesomeIcon icon={step.icon} />
                </div>

                <h4 className="stage-title">{step.name}</h4>
                <div className="stage-rate">{step.rate}</div>
                <div className="stage-meta-tag">{step.tag}</div>
              </div>

              {i < initialSteps.length - 1 && (
                <div className={`flow-connector ${activeStep === i ? "connector-active" : ""}`}>
                  <div className="connector-line">
                    <span className="connector-packet" />
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="connector-arrow" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
