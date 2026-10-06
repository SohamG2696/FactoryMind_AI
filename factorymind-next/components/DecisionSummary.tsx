"use client";

import { useRouter } from "next/navigation";
import { useSim } from "@/context/FactorySimContext";
import { issueFor } from "@/components/MaintenanceSection";
import { summarizePlant } from "@/lib/plantMetrics";

export default function DecisionSummary() {
  const router = useRouter();
  const { state, agent, dispatchMaintenance } = useSim();
  const decision = agent.latest;
  const ml = decision?.ml ?? {};

  const target = summarizePlant(state, ml).riskiest;
  const targetPred = target ? ml[target.code] : undefined;
  const needsAction = !!target && target.status !== "downtime" && target.status !== "healthy";

  return (
    <section className="decision-summary">
      <div className="summary-card">
        <div className="live-card-title">
          <h2>📋 Current AI Decision</h2>
          <span className="live-pill">
            <span className="live-dot" />
            {decision ? `LIVE · ${decision.brain} · ${decision.wallClock}` : agent.busy ? "Agent thinking…" : "LIVE · sensor rules (agent offline)"}
          </span>
        </div>

        {decision?.executiveSummary && <p>✔ {decision.executiveSummary}</p>}

        {target && (
          <p>
            ✔ Highest risk: <strong>{target.code}</strong> ({target.label}) — {issueFor(target).toLowerCase()}, health{" "}
            <strong>{target.health.toFixed(0)}%</strong>
            {targetPred && (
              <>
                , ML failure probability <strong>{(targetPred.failureProbability * 100).toFixed(0)}%</strong>
              </>
            )}
            .
          </p>
        )}

        {decision && (
          <p>
            ✔ Actions this cycle: <strong>{decision.actions.length}</strong>
            {decision.actions.slice(0, 3).map((a, i) => (
              <span key={i} className="decision-action">
                {a.agentName}: {a.reason} <em>[{a.autonomyLevel.replace("_", " ")}]</em>
              </span>
            ))}
          </p>
        )}

        <p>
          ✔ Plant now: OEE <strong>{(state.oee * 100).toFixed(1)}%</strong> · throughput{" "}
          <strong>{state.throughputPerHour.toFixed(0)} units/h</strong> · produced{" "}
          <strong>{state.totalProduced}</strong> this shift
        </p>
        <p>
          ✔ AI so far: <strong>{state.autonomousActionsCount}</strong> autonomous actions ·{" "}
          <strong>{state.humanInterventionsCount}</strong> technician dispatches
        </p>

        <div className="summary-buttons">
          <button
            className="primary-btn"
            disabled={!needsAction}
            onClick={() => target && dispatchMaintenance(target.id)}
            title={needsAction ? undefined : "No machine currently needs intervention"}
          >
            {needsAction ? `Approve: maintain ${target.code}` : "No action needed"}
          </button>
          <button className="secondary-btn" onClick={() => router.push("/simulation")}>
            Watch on Live Simulation
          </button>
        </div>
      </div>
    </section>
  );
}
