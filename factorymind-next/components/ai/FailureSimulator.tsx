"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlask, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useSim } from "@/context/FactorySimContext";
import { FAILURE_RATE } from "@/hooks/useFactorySim";

const SEVERITY_LABEL = (s: number) => (s < 0.8 ? "Low" : s < 1.4 ? "Medium" : "High");

/**
 * Failure Simulator — supervisor/admin control bar for the demo scenario.
 * Play / speed / Reset live in the simulation header above; this bar only injects failures.
 * Injection starts a gradually developing bearing failure in the simulation;
 * everything after that (ML, agents, approval, repair) is the real pipeline.
 */
export default function FailureSimulator() {
  const { state, ai, agentEnabled, setAgentEnabled } = useSim();
  const production = state.machines.filter((m) => m.kind !== "warehouse" && !m.standby);
  const [machineId, setMachineId] = useState("cnc7");
  const [severity, setSeverity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const iv = ai.intervention;
  const active = !!iv && !["RECOVERED", "FAILED"].includes(iv.phase);

  if (!ai.isManager) return null;

  // Seconds until the fault is ~85 % developed (progress += FAILURE_RATE × severity per 0.5 s tick).
  const secondsToCritical = Math.round((0.85 / (FAILURE_RATE * severity)) * 0.5);

  const onInject = async () => {
    setMessage(null);
    const res = await ai.inject(machineId, severity);
    if (!res.ok) setMessage(res.error ?? "Could not inject failure");
  };

  const hint = message
    ? message
    : !state.running
    ? "Press Start simulation / Play above first — the factory begins healthy."
    : active
    ? `Intervention ${iv?.id} in progress on ${iv?.machineCode} — follow it in the AI Control Center below.`
    : "Simulated machine data — not real sensor readings.";

  return (
    <section className="ai-sim-panel">
      <div className="ai-sim-head">
        <span className="ai-eyebrow"><FontAwesomeIcon icon={faFlask} /> FAILURE SIMULATOR</span>
        <span className={message ? "ai-error small" : "ai-muted small"}>{hint}</span>
      </div>

      <div className="ai-sim-row">
        <label className="ai-field">
          <span>Machine</span>
          <select value={machineId} onChange={(e) => setMachineId(e.target.value)} disabled={active}>
            {production.map((m) => (
              <option key={m.id} value={m.id}>{m.code} · {m.label}</option>
            ))}
          </select>
        </label>

        <label className="ai-field">
          <span>Failure mode</span>
          <select value="bearing" disabled>
            <option value="bearing">Bearing Wear / Overheating</option>
          </select>
        </label>

        <label className="ai-field ai-field-severity">
          <span>Severity · {SEVERITY_LABEL(severity)} ({severity.toFixed(1)}×) · critical ≈ {secondsToCritical} s</span>
          <input type="range" min={0.5} max={2} step={0.1} value={severity} disabled={active}
            onChange={(e) => setSeverity(Number(e.target.value))} />
        </label>

        <button
          className={`ai-autonomy-switch ${agentEnabled ? "on" : "off"}`}
          onClick={() => setAgentEnabled((v) => !v)}
          title={agentEnabled ? "Turn off to show what happens without FactoryMind" : "Activate FactoryMind autonomy"}
        >
          <span className="knob" />
          <span>{agentEnabled ? "FACTORYMIND AUTONOMY ON" : "ACTIVATE FACTORYMIND AUTONOMY"}</span>
        </button>

        <label className="ai-check">
          <input type="checkbox" checked={ai.requireApproval} onChange={(e) => ai.setRequireApproval(e.target.checked)} disabled={active} />
          <span>Require supervisor approval</span>
        </label>

        <button className="ai-btn inject" onClick={onInject} disabled={!state.running || active}>
          <FontAwesomeIcon icon={faTriangleExclamation} /> Inject failure
        </button>
      </div>
    </section>
  );
}
