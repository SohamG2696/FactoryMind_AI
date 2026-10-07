"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSim } from "@/context/FactorySimContext";
import { PhaseBadge, outageStats } from "@/components/ai/InterventionCenter";

const RESPONSE: Record<string, string> = {
  OBSERVING: "MONITORING", ANOMALY_DETECTED: "ANOMALY DETECTED", PREDICTING: "PREDICTING FAILURE",
  REASONING: "ANALYSING IMPACT", PLANNING: "AUTONOMOUS RECOVERY", AWAITING_APPROVAL: "AWAITING SUPERVISOR APPROVAL",
  ACTING: "AUTONOMOUS RECOVERY", RECOVERY: "AUTONOMOUS RECOVERY", VERIFYING: "VERIFYING RECOVERY",
  RECOVERED: "RECOVERED", FAILED: "NO RESPONSE — BREAKDOWN",
};

/** Dashboard card: autonomous factory control status + plant-level AI counters (all live). */
export default function InterventionSummary() {
  const router = useRouter();
  const { state, agent, agentEnabled, ai } = useSim();
  const [openMissions, setOpenMissions] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/missions?open=1&limit=200")
        .then((r) => r.json())
        .then((j) => { if (!cancelled && j.ok) setOpenMissions(j.missions.length); })
        .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const ml = agent.latest?.ml ?? {};
  const line = state.machines.filter((m) => !m.standby || m.statusText !== "Standby");
  const healthy = line.filter((m) => m.status === "healthy").length;
  const activeFailures = state.machines.filter((m) => m.failure || (m.breakdownTick !== undefined && m.status === "downtime")).length;
  const predicted = state.machines.filter((m) => (ml[m.code]?.failureProbability ?? 0) >= 0.55).length;
  const all = [...ai.past, ...(ai.intervention ? [ai.intervention] : [])];
  const completed = all.filter((i) => i.phase === "RECOVERED").length;
  const iv = ai.intervention;
  const done = iv && (iv.phase === "RECOVERED" || iv.phase === "FAILED");
  const executed = [
    iv?.actingAt && "Machine isolated",
    iv?.technician && iv.actingAt && `Technician ${iv.technician.name} assigned`,
    iv?.flags.rerouted && "Production rerouted to CNC-05",
    iv?.flags.rerouted && "AGV-02 route optimised",
    iv?.flags.throttled && "Material flow adjusted",
    iv?.flags.rerouted && !Object.keys(iv.flags).some((k) => k.startsWith("starved-")) && "Downstream cells protected",
    iv?.repairDoneAt && "Simulated repair executed",
    iv?.flags.restored && "Original plan restored",
  ].filter(Boolean) as string[];
  const o = iv ? outageStats(iv) : null;

  return (
    <section className={`ai-summary ${iv && !done ? "ai-summary-live" : ""}`}>
      <div className="ai-summary-head">
        <div>
          <span className="ai-eyebrow">🧠 AUTONOMOUS FACTORY CONTROL</span>
          <h2>{agentEnabled ? "FactoryMind autonomy active" : "FactoryMind autonomy OFF"}</h2>
        </div>
        <button className="ai-btn" onClick={() => router.push("/simulation")}>Open command center</button>
      </div>

      {iv ? (
        <div className={`ai-autonomy-card ${done ? (iv.phase === "RECOVERED" ? "ok" : "crit") : "live"}`}>
          <div className="ai-autonomy-cols">
            <div><span>Current event</span><strong>{iv.machineCode} · {iv.failureLabel}</strong></div>
            <div><span>Factory impact</span><strong>{iv.recovery?.impact.severity ?? (iv.phase === "FAILED" ? "HIGH" : "assessing…")}</strong></div>
            <div><span>AI response</span><strong>{RESPONSE[iv.phase] ?? iv.phase}</strong></div>
            <div><span>Phase</span><PhaseBadge phase={iv.phase} /></div>
          </div>
          {executed.length > 0 && (
            <ul className="ai-executed">
              {executed.map((e) => <li key={e}>✓ {e}</li>)}
            </ul>
          )}
          {o && (
            <div className="ai-autonomy-cols">
              <div><span>Line output during outage</span><strong>{o.preservedPct !== null ? `${o.preservedPct.toFixed(0)}% of normal` : "—"}</strong></div>
              <div><span>{iv.machineCode} offline</span><strong>{o.offlineMin.toFixed(1)} sim-min</strong></div>
              <div><span>Downstream starvation</span><strong>{o.starvedMin ? `${o.starvedMin.toFixed(1)} cell-min` : "None"}</strong></div>
            </div>
          )}
          {iv.approval?.status === "pending" && !done && ai.isManager && (
            <button className="ai-btn approve" onClick={ai.approve}>Approve isolation of {iv.machineCode}</button>
          )}
        </div>
      ) : (
        <p className="ai-muted">No active event — {state.running ? (agentEnabled ? "the AI is observing all cells." : "autonomy is OFF.") : "simulation paused."}</p>
      )}

      <div className="ai-summary-stats">
        <div><span>Machines healthy</span><strong>{healthy} / {line.length}</strong></div>
        <div><span>Active failures</span><strong>{activeFailures}</strong></div>
        <div><span>Predicted failures (ML ≥ 55%)</span><strong>{predicted}</strong></div>
        <div><span>AI recoveries completed</span><strong>{completed}</strong></div>
        <div><span>Open maintenance missions</span><strong>{openMissions ?? "—"}</strong></div>
        <div><span>OEE</span><strong>{(state.oee * 100).toFixed(1)}%</strong></div>
      </div>
    </section>
  );
}
