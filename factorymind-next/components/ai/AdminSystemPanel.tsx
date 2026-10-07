"use client";

import { useAuth } from "@/context/AuthContext";
import { useSim } from "@/context/FactorySimContext";
import { formatAccuracy } from "@/lib/plantMetrics";
import DecisionLog from "@/components/ai/DecisionLog";
import { AutonomyBadge } from "@/components/ai/InterventionCenter";

/**
 * System-level view for administrators: model status, the AI autonomy policy,
 * operator → machine assignments and the AI audit log. Admins manage the
 * system; supervisors run the factory.
 */
export default function AdminSystemPanel() {
  const { usersList, role } = useAuth();
  const { mlHealth, state, ai } = useSim();
  if (role !== "ADMIN") return null;

  const operators = usersList.filter((u) => u.role === "USER");
  const machineName = (code?: string) => state.machines.find((m) => m.code === code)?.label ?? "—";

  return (
    <>
      <section className="maintenance-section">
        <div className="maintenance-card">
          <div className="live-card-title">
            <h2>🧠 Model &amp; AI Configuration</h2>
            <span className="live-pill"><span className="live-dot" /> {mlHealth.online === false ? "ML SERVICE OFFLINE" : mlHealth.source === "fastapi" ? "FastAPI ML service" : mlHealth.source === "python_cli" ? "Python CLI fallback" : "checking…"}</span>
          </div>
          <table>
            <tbody>
              <tr><td>Failure model</td><td>{mlHealth.pmModel ?? "—"}</td></tr>
              <tr><td>Status model</td><td>{mlHealth.factoryModel ?? "—"}</td></tr>
              <tr><td>Reported accuracy</td><td>{formatAccuracy(mlHealth)} · {mlHealth.evaluationMethod ?? "—"}</td></tr>
              <tr><td>Agent cycle</td><td>Every 6 s while the simulation runs</td></tr>
              <tr><td>Isolation approval</td><td>{ai.requireApproval ? "Supervisor approval required" : "Autonomous (auto-approve)"} — toggled per run in the Failure Simulator</td></tr>
            </tbody>
          </table>
          <p className="ai-muted small" style={{ marginTop: 10 }}>Autonomy policy:</p>
          <table>
            <tbody>
              <tr><td><AutonomyBadge level="SAFE" /></td><td>Alerts, material re-prioritisation, mission creation, technician selection, verification — applied automatically</td></tr>
              <tr><td><AutonomyBadge level="APPROVAL_REQUIRED" /></td><td>Pausing / isolating a machine — waits for a supervisor (or an operator e-stop)</td></tr>
              <tr><td><AutonomyBadge level="HUMAN_REQUIRED" /></td><td>Physical repair — performed by a technician (simulated in this demo)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="maintenance-section">
        <div className="maintenance-card">
          <h2>👷 Operator Machine Assignments</h2>
          <table>
            <thead>
              <tr><th>Operator</th><th>Shift</th><th>Assigned cell</th><th>Machine</th></tr>
            </thead>
            <tbody>
              {operators.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.shift ?? "—"}</td>
                  <td>{o.assignedMachine ?? "Unassigned"}</td>
                  <td>{machineName(o.assignedMachine)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DecisionLog />
    </>
  );
}
