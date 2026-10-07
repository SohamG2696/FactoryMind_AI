"use client";

import { useEffect, useState } from "react";
import { AutonomyBadge } from "@/components/ai/InterventionCenter";

interface DecisionRow {
  id: string;
  timestamp: string;
  agentName: string;
  phase: string;
  machineCode?: string;
  mlPrediction?: { failureProbability?: number };
  reasoning?: string;
  action?: string;
  autonomyLevel?: string;
  humanApproval?: string;
  outcome?: string;
  missionId?: string;
}

/** Audit log of AI decisions and interventions, read from MongoDB (agent_decisions). */
export default function DecisionLog({ limit = 30 }: { limit?: number }) {
  const [rows, setRows] = useState<DecisionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/agent/decisions?limit=${limit * 6}`)
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          if (j.ok) {
            // Skip the per-cycle aggregate rows; keep concrete actions and outcomes.
            setRows((j.decisions as DecisionRow[]).filter((d) => d.action || d.outcome).slice(0, limit));
            setError(null);
          } else setError(j.error || "unavailable");
        })
        .catch(() => !cancelled && setError("Database unavailable"));
    load();
    const id = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [limit]);

  return (
    <section className="maintenance-section">
      <div className="maintenance-card">
        <div className="live-card-title">
          <h2>🧾 AI Decision &amp; Audit Log</h2>
          <span className="live-pill"><span className="live-dot" /> MongoDB · agent_decisions</span>
        </div>
        {error && <p className="ai-muted">Audit log unavailable: {error}</p>}
        {!error && !rows && <p className="ai-muted">Loading…</p>}
        {rows && (
          <div className="ai-log-scroll">
            <table>
              <thead>
                <tr>
                  <th>Time</th><th>Agent</th><th>Phase</th><th>Machine</th><th>Prediction</th>
                  <th>Action / reasoning</th><th>Autonomy</th><th>Human approval</th><th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.timestamp).toLocaleTimeString("en-GB", { hour12: false })}</td>
                    <td>{r.agentName}</td>
                    <td>{r.phase}</td>
                    <td>{r.machineCode ?? "—"}</td>
                    <td>{r.mlPrediction?.failureProbability !== undefined ? `${(r.mlPrediction.failureProbability * 100).toFixed(1)}%` : "—"}</td>
                    <td className="ai-log-reason">{r.action ?? r.reasoning ?? "—"}</td>
                    <td>{r.autonomyLevel ? <AutonomyBadge level={r.autonomyLevel} /> : "—"}</td>
                    <td>{r.humanApproval ?? (r.autonomyLevel === "SAFE" ? "Automatic" : "—")}</td>
                    <td>{r.outcome ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
