"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faBrain,
  faScrewdriverWrench,
  faChartColumn,
  faNetworkWired,
} from "@fortawesome/free-solid-svg-icons";

const agents = [
  {
    icon: faEye,
    name: "Monitoring Agent",
    desc: "Collects sensor data from IoT devices.",
  },
  {
    icon: faBrain,
    name: "Prediction Agent",
    desc: "Runs ML models for Failure Prediction and RUL.",
  },
  {
    icon: faScrewdriverWrench,
    name: "Maintenance Agent",
    desc: "Generates autonomous maintenance schedules.",
  },
  {
    icon: faChartColumn,
    name: "Analytics Agent",
    desc: "Creates reports and factory insights.",
  },
  {
    icon: faNetworkWired,
    name: "Coordinator Agent",
    desc: "Coordinates all AI agents and decisions.",
  },
];

export default function AgentsSection() {
  return (
    <section className="agents-section">
      <h2>🤖 Multi-Agent AI Architecture</h2>
      <div className="agents-grid">
        {agents.map((a) => (
          <div key={a.name} className="agent-card">
            <div className="agent-icon">
              <FontAwesomeIcon icon={a.icon} />
            </div>
            <h3>{a.name}</h3>
            <p>{a.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
