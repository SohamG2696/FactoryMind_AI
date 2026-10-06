"use client";

import { useSim } from "@/context/FactorySimContext";
import type { MachineState } from "@/hooks/useFactorySim";

type Priority = "high" | "medium" | "low";

/** Most likely issue for a machine, from its live telemetry (thresholds match the sim's warning levels). */
export function issueFor(m: MachineState): string {
  if (m.faultTag && m.status !== "healthy") return m.faultTag.charAt(0) + m.faultTag.slice(1).toLowerCase();
  if (m.status === "downtime") return "Down for maintenance";
  if (m.toolWear > 70) return `Tool wear ${m.toolWear.toFixed(0)}%`;
  if (m.temperature > 78) return `Overheating · ${m.temperature.toFixed(0)}°C`;
  if (m.vibration > 2.2) return `High vibration · ${m.vibration.toFixed(1)} mm/s`;
  if (m.health < 90) return "Gradual degradation";
  return "Routine inspection";
}

function priorityFor(m: MachineState, failureProb?: number): Priority {
  if (m.status === "critical" || (failureProb ?? 0) >= 0.6) return "high";
  if (m.status === "warning" || m.health < 85 || (failureProb ?? 0) >= 0.3) return "medium";
  return "low";
}

export default function MaintenanceSection() {
  const { state, agent, dispatchMaintenance } = useSim();
  const ml = agent.latest?.ml ?? {};

  // Worst health first — the plan is literally "what to fix next".
  const rows = state.machines
    .filter((m) => m.kind !== "warehouse")
    .slice()
    .sort((a, b) => a.health - b.health);

  return (
    <section className="maintenance-section">
      <div className="maintenance-card">
        <div className="live-card-title">
          <h2>🔧 AI Generated Maintenance Plan</h2>
          <span className="live-pill">
            <span className="live-dot" /> LIVE · {agent.latest ? "ML + sensor risk" : "sensor risk"}
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Machine</th>
              <th>Health</th>
              <th>Issue</th>
              <th>Failure Risk</th>
              <th>Priority</th>
              <th>Engineer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const pred = ml[m.code];
              const priority = priorityFor(m, pred?.failureProbability);
              const worker = state.activeWorkers.find((w) => w.targetMachineCode === m.code);
              const inMaintenance = m.status === "downtime";

              return (
                <tr key={m.id}>
                  <td>
                    <strong>{m.code}</strong> · {m.shortLabel}
                  </td>
                  <td>{m.health.toFixed(0)}%</td>
                  <td>{issueFor(m)}</td>
                  <td>{pred ? `${(pred.failureProbability * 100).toFixed(0)}%` : "—"}</td>
                  <td>
                    <span className={`priority ${priority}`}>{priority.toUpperCase()}</span>
                  </td>
                  <td>{worker ? `${worker.name} (${worker.status.replace("_", " ")})` : "Unassigned"}</td>
                  <td>
                    {inMaintenance ? (
                      <span className="maint-status">In progress</span>
                    ) : priority === "low" ? (
                      <span className="maint-status">Monitor</span>
                    ) : (
                      <button onClick={() => dispatchMaintenance(m.id)}>Schedule</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
