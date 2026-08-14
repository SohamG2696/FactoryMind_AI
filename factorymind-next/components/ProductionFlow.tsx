"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

const steps = [
  "Raw Material",
  "CNC",
  "Robot Arm",
  "Quality Check",
  "Packaging",
  "Warehouse",
];

export default function ProductionFlow() {
  return (
    <section className="production-flow">
      <h2>Production Line</h2>
      <div className="flow-container">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flow-box">{step}</div>
            {i < steps.length - 1 && (
              <span className="flow-arrow">
                <FontAwesomeIcon icon={faArrowRight} />
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
