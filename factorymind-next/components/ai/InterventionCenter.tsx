"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye, faChartLine, faDiagramProject, faListCheck, faUserCheck, faBolt, faMagnifyingGlass, faCircleCheck,
  faCircleXmark, faTriangleExclamation, faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { useSim } from "@/context/FactorySimContext";
import type { Intervention, InterventionPhase, TimelineEntry } from "@/hooks/useIntervention";
import type { MachineState, SimState } from "@/hooks/useFactorySim";

/* ───────────────────────── shared pieces ───────────────────────── */

const PHASE_TONE: Record<InterventionPhase, string> = {
  IDLE: "idle", OBSERVING: "ai", ANOMALY_DETECTED: "warn", PREDICTING: "ai", REASONING: "ai", PLANNING: "ai",
  AWAITING_APPROVAL: "action", ACTING: "ai", RECOVERY: "ai", VERIFYING: "ai", RECOVERED: "ok", FAILED: "crit",
};

export function PhaseBadge({ phase }: { phase: InterventionPhase }) {
  return (
    <span className={`ai-phase-badge tone-${PHASE_TONE[phase]}`}>
      <span className="ai-phase-dot" />
      {phase.replace("_", " ")}
    </span>
  );
}

export function AutonomyBadge({ level }: { level: string }) {
  const tone = level === "SAFE" ? "ok" : level === "APPROVAL_REQUIRED" ? "action" : "warn";
  return <span className={`ai-autonomy tone-${tone}`}>{level.replace("_", " ")}</span>;
}

const secs = (a?: number, b?: number) => (a && b ? `${((b - a) / 1000).toFixed(1)} s` : "—");

export function InterventionTimeline({ entries, max = 40 }: { entries: TimelineEntry[]; max?: number }) {
  return (
    <ol className="ai-timeline">
      {entries.slice(-max).map((e, i) => (
        <li key={`${e.at}-${i}`} className={`kind-${e.kind}`}>
          <span className="ai-tl-clock">{e.clock}</span>
          <span className="ai-tl-icon">{e.icon}</span>
          <span className="ai-tl-msg">{e.msg}</span>
        </li>
      ))}
    </ol>
  );
}

/** Outage numbers measured on the simulation clock (30 sim-seconds per tick). */
export function outageStats(iv: Intervention) {
  const o = iv.outage;
  if (!o || o.endTick === undefined || o.producedAtEnd === undefined) return null;
  const ticks = Math.max(1, o.endTick - o.startTick);
  const rate = (o.producedAtEnd - o.producedAtStart) / ticks;
  return {
    offlineMin: ticks * 0.5,
    preservedPct: o.baselineRate > 0 ? Math.min(100, (rate / o.baselineRate) * 100) : null,
    starvedMin: o.downstreamStarvedTicks * 0.5,
  };
}

/** Before/after and outage numbers, all from the simulation and ML at the moment they happened. */
export function ImpactSummary({ iv }: { iv: Intervention }) {
  const ok = iv.phase === "RECOVERED";
  const b = iv.before;
  const a = iv.after;
  const o = outageStats(iv);
  const pct = (x?: number | null) => (x === null || x === undefined ? "n/a" : `${(x * 100).toFixed(1)}%`);
  return (
    <div className={`ai-impact ${ok ? "ok" : "crit"}`}>
      <div className="ai-impact-head">
        <FontAwesomeIcon icon={ok ? faCircleCheck : faCircleXmark} />
        {ok ? "FACTORY RECOVERED — THE LINE KEPT RUNNING" : "WITHOUT INTERVENTION — MACHINE BROKE DOWN"}
      </div>
      <div className="ai-impact-grid">
        <div><span>Failure</span><strong>{iv.failureLabel} · {iv.machineCode}</strong></div>
        <div><span>Time to detect</span><strong>{secs(iv.injectedAt, iv.detectedAt)}</strong></div>
        <div><span>Time to reroute</span><strong>{secs(iv.detectedAt, iv.rerouteAt)}</strong></div>
        <div><span>Time to recover</span><strong>{secs(iv.actingAt, iv.recoveredAt)}</strong></div>
        {o && (
          <>
            <div><span>{iv.machineCode} offline</span><strong>{o.offlineMin.toFixed(1)} sim-min</strong></div>
            <div><span>Line output during outage</span><strong>{o.preservedPct !== null ? `${o.preservedPct.toFixed(0)}% of normal` : "—"}</strong></div>
            <div><span>Downstream starvation</span><strong>{o.starvedMin ? `${o.starvedMin.toFixed(1)} cell-min` : "None"}</strong></div>
          </>
        )}
        {b && a && (
          <>
            <div><span>Health</span><strong>{b.health.toFixed(0)}% → {a.health.toFixed(0)}%</strong></div>
            <div><span>Temperature</span><strong>{b.temperature.toFixed(0)} → {a.temperature.toFixed(0)} °C</strong></div>
            <div><span>Vibration</span><strong>{b.vibration.toFixed(2)} → {a.vibration.toFixed(2)} mm/s</strong></div>
            <div><span>Failure probability</span><strong>{pct(b.failureProbability)} → {pct(a.failureProbability)}</strong></div>
          </>
        )}
        <div><span>Critical incident</span><strong>{ok ? "Breakdown prevented" : "Breakdown occurred"}</strong></div>
        <div><span>Human approvals</span><strong>{iv.humanApprovals}{iv.approval?.status === "auto" ? " (autonomous mode)" : ""}</strong></div>
      </div>
      {ok && (
        <div className="ai-split">
          <div>
            <span className="ai-card-title">AI DID AUTONOMOUSLY</span>
            <ul>
              <li>✓ Detected the anomaly and predicted failure (LightGBM + RF)</li>
              {iv.recovery && <li>✓ Analysed the factory-wide impact</li>}
              {iv.recovery && <li>✓ Created the recovery plan</li>}
              {iv.flags.rerouted && <li>✓ Rerouted production and AGV-02 to CNC-05</li>}
              {iv.flags.throttled && <li>✓ Rebalanced material release</li>}
              {iv.technician && <li>✓ Assigned {iv.technician.name}</li>}
              <li>✓ Verified recovery{iv.flags.restored ? " and restored the original plan" : ""}</li>
            </ul>
          </div>
          <div>
            <span className="ai-card-title">HUMANS DID</span>
            <ul>
              {iv.approval && iv.approval.status !== "auto" && <li>⚠ {iv.approval.status === "operator-stop" ? "Stopped the machine" : "Approved isolation"} ({iv.approval.by})</li>}
              <li>⚠ Bearing replacement — physical work (simulated here)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── recovery plan status ───────────────────────── */

type StepState = "done" | "active" | "todo" | "error";

function recoveryStepState(key: string, iv: Intervention, st: SimState, m?: MachineState): StepState {
  const outageOn = !!m && (m.isolated || m.status === "downtime");
  switch (key) {
    case "isolate": return iv.actingAt ? "done" : iv.approval?.status === "pending" ? "active" : iv.approval?.status === "rejected" ? "error" : "todo";
    case "dispatch": return iv.repairStartedAt ? "done" : iv.actingAt ? "active" : "todo";
    case "reroute":
    case "agv": return iv.flags.rerouted ? "done" : "todo";
    case "material": return iv.flags.throttled ? "done" : "todo";
    case "protect":
      if (Object.keys(iv.flags).some((k) => k.startsWith("starved-"))) return "error";
      return iv.outage?.endTick ? "done" : outageOn ? "active" : iv.flags.rerouted ? "active" : "todo";
    case "repair": return iv.repairDoneAt ? "done" : iv.repairStartedAt ? "active" : "todo";
    case "restore": return iv.flags.restored ? "done" : iv.resumedAt ? "active" : "todo";
  }
  return st.running ? "todo" : "todo";
}

/* ───────────────────────── stage stepper ───────────────────────── */

function stages(iv: Intervention, st: SimState, m: MachineState | undefined, workerStatus?: string, workerProgress?: number) {
  const ph = iv.phase;
  const pred = iv.latestPrediction;
  const appr = iv.approval?.status;
  const approved = appr === "approved" || appr === "auto" || appr === "operator-stop";
  const rr = st.reroute;
  return [
    {
      key: "observe", label: "OBSERVE", icon: faEye,
      state: (iv.anomalyAt || iv.flags.firstPrediction ? "done" : "active") as StepState,
      detail: m ? `${m.code}: ${m.temperature.toFixed(1)} °C · ${m.vibration.toFixed(2)} mm/s · wear ${m.toolWear.toFixed(0)}% · health ${m.health.toFixed(0)}%` : "Monitoring telemetry…",
    },
    {
      key: "predict", label: "PREDICT", icon: faChartLine,
      state: (iv.detectedAt ? "done" : iv.flags.firstPrediction ? "active" : "todo") as StepState,
      detail: pred
        ? `Failure ${(pred.failureProbability * 100).toFixed(1)}% (LightGBM, ${pred.riskLevel})${pred.operationalStatus ? ` · ${pred.operationalStatus}` : ""}`
        : "Waiting for the next 6 s agent cycle",
    },
    {
      key: "impact", label: "IMPACT", icon: faDiagramProject,
      state: (iv.recovery ? "done" : iv.detectedAt ? "active" : "todo") as StepState,
      detail: iv.recovery ? `${iv.recovery.impact.severity} — ${iv.recovery.impact.cascade.filter((c) => c.effect === "starves").map((c) => `${c.code} starves ${(c.inMinutes ?? 0) < 1 ? "now" : `~${c.inMinutes}m`}`).join(", ")}` : "What happens to the line if it fails?",
    },
    {
      key: "plan", label: "PLAN", icon: faListCheck,
      state: (iv.recovery && iv.flags.mission ? "done" : iv.recovery || iv.flags.mission ? "active" : "todo") as StepState,
      detail: iv.recovery ? `${iv.recovery.steps.length}-step recovery plan${iv.missionId ? ` · mission ${iv.missionId}` : ""}${iv.technician ? ` · ${iv.technician.name}` : ""}` : "Supervisor Agent merges agent proposals",
    },
    {
      key: "approve", label: "APPROVE", icon: faUserCheck,
      state: (approved ? "done" : appr === "rejected" ? "error" : appr === "pending" ? "active" : "todo") as StepState,
      detail: appr === "pending" ? "AWAITING SUPERVISOR APPROVAL to isolate"
        : appr === "rejected" ? `Rejected by ${iv.approval?.by}`
        : approved ? (appr === "auto" ? "Auto-approved (autonomous mode)" : appr === "operator-stop" ? `Stopped by ${iv.approval?.by}` : `Approved by ${iv.approval?.by}`)
        : "Isolation is APPROVAL_REQUIRED",
    },
    {
      key: "execute", label: "EXECUTE", icon: faBolt,
      state: (iv.repairDoneAt ? "done" : iv.actingAt || iv.flags.rerouted ? "active" : "todo") as StepState,
      detail: [
        rr ? "🔀 rerouted to CNC-05" : null,
        iv.actingAt ? "⏸ isolated" : null,
        workerStatus === "moving" ? `${iv.technician?.name} en route` : workerStatus === "on_task" ? `bearing replacement ${Math.round((workerProgress ?? 0) * 100)}%` : iv.repairDoneAt ? "repair done" : null,
      ].filter(Boolean).join(" · ") || "Isolate, reroute, dispatch",
    },
    {
      key: "verify", label: "VERIFY", icon: faMagnifyingGlass,
      state: (iv.recoveredAt ? "done" : iv.repairDoneAt ? "active" : "todo") as StepState,
      detail: iv.repairDoneAt && m
        ? `${m.temperature < 75 ? "✓" : "…"} temp · ${m.vibration < 2.2 ? "✓" : "…"} vib · ${m.health > 85 ? "✓" : "…"} health · ${iv.flags.mlVerified ? "✓ ML" : "… ML"} · ${!iv.flags.rerouted || iv.flags.restored ? "✓ plan" : "… plan"}`
        : "Telemetry, ML risk and original plan",
    },
    {
      key: "done", label: ph === "FAILED" ? "FAILED" : "RECOVERED", icon: ph === "FAILED" ? faCircleXmark : faCircleCheck,
      state: (ph === "RECOVERED" ? "done" : ph === "FAILED" ? "error" : "todo") as StepState,
      detail: ph === "RECOVERED" ? "Factory recovered · production restored" : ph === "FAILED" ? "Breakdown — no intervention" : "—",
    },
  ];
}

export function StageStepper({ iv, compact = false }: { iv: Intervention; compact?: boolean }) {
  const { state } = useSim();
  const m = state.machines.find((x) => x.id === iv.machineId);
  const w = state.activeWorkers.find((x) => x.targetMachineCode === iv.machineCode);
  return (
    <ol className={`ai-stepper ${compact ? "compact" : ""}`}>
      {stages(iv, state, m, w?.status, w?.progress).map((st) => (
        <li key={st.key} className={`step-${st.state}`}>
          <span className="ai-step-icon"><FontAwesomeIcon icon={st.icon} /></span>
          <div>
            <strong>{st.label}</strong>
            {!compact && <span className="ai-step-detail">{st.detail}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Live cascade: what the line would lose, and what is actually happening to it. */
function CascadeView({ iv }: { iv: Intervention }) {
  const { state } = useSim();
  if (!iv.recovery) return <p className="ai-muted small">Runs when the AI predicts a failure: which cells starve or block, and how soon.</p>;
  const imp = iv.recovery.impact;
  return (
    <>
      <ol className="ai-cascade">
        {imp.cascade.map((c) => {
          const live = state.machines.find((x) => x.code === c.code);
          const starvedNow = (live?.starvedTicks ?? 0) >= 6;
          const tone = c.effect === "fails" ? "crit" : c.effect === "rerouted" ? "ok" : starvedNow ? "crit" : iv.flags.rerouted ? "ok" : "warn";
          return (
            <li key={c.code + c.effect} className={`tone-${tone}`}>
              <strong>{c.code}</strong>
              <span>{c.label}</span>
              <em>
                {c.effect === "fails" ? "❌ " : c.effect === "rerouted" ? "🔀 " : starvedNow ? "⛔ " : "⚠ "}
                {c.effect === "starves" && iv.flags.rerouted && !starvedNow ? "kept fed by reroute" : starvedNow ? "STARVED now" : c.note}
              </em>
            </li>
          );
        })}
      </ol>
      <div className="ai-muted small">
        Without action: ~{imp.lossWithoutActionUnits} units lost over ~{imp.expectedRepairMinutes} min · with recovery: ~{imp.lossWithRecoveryUnits}
      </div>
    </>
  );
}

/* ───────────────────────── main panel ───────────────────────── */

export default function InterventionCenter() {
  const { state, agent, agentEnabled, mlHealth, ai } = useSim();
  const iv = ai.intervention;

  const head = (
    <div className="ai-center-head">
      <div>
        <span className="ai-eyebrow"><FontAwesomeIcon icon={faRobot} /> AUTONOMOUS FACTORY COMMAND CENTER{iv ? ` · ${iv.id}` : ""}</span>
        <h2>{iv ? `${iv.machineCode} ${iv.machineLabel} — ${iv.failureLabel}` : "When a machine fails, the factory doesn't stop. It adapts."}</h2>
      </div>
      <div className="ai-head-badges">
        <span className={`ai-phase-badge ${agentEnabled ? "tone-ok" : "tone-crit"}`}>
          <span className="ai-phase-dot" /> AUTONOMY {agentEnabled ? "ON" : "OFF"}
        </span>
        <PhaseBadge phase={iv ? iv.phase : state.running ? "OBSERVING" : "IDLE"} />
      </div>
    </div>
  );

  if (!iv) {
    return (
      <section className="ai-center">
        {head}
        <p className="ai-muted">
          {state.running
            ? `Observing ${state.machines.filter((m) => !m.standby).length} cells${agentEnabled ? ` · agent cycle every 6 s${agent.latest ? ` · last ${agent.latest.wallClock}` : ""}` : " · autonomy is OFF — failures will not be handled"}. Inject a failure to watch the factory adapt.`
            : "Simulation is paused. Press Start simulation, then inject a failure."}
        </p>
        <OtherApprovals />
      </section>
    );
  }

  const m = state.machines.find((x) => x.id === iv.machineId);
  const pred = iv.latestPrediction;
  const prob = pred?.failureProbability ?? null;
  const status =
    iv.phase === "RECOVERED" ? "RECOVERED"
    : iv.phase === "FAILED" ? "BROKEN DOWN"
    : (prob ?? 0) >= 0.55 || m?.status === "critical" ? "FAILURE PREDICTED"
    : m?.status === "warning" ? "DEGRADING" : "MONITORING";

  return (
    <section className="ai-center">
      {head}
      <StageStepper iv={iv} />

      <div className="ai-center-grid">
        {/* ML detection */}
        <div className="ai-card">
          <div className="ai-card-title">1 · FAILURE DETECTION</div>
          <div className="ai-metrics">
            <div><span>Failure probability</span><strong className={(prob ?? 0) >= 0.55 ? "crit" : ""}>{prob !== null ? `${(prob * 100).toFixed(1)}%` : "—"}</strong></div>
            <div><span>Health</span><strong className={(m?.health ?? 100) < 45 ? "crit" : ""}>{m ? `${m.health.toFixed(0)}%` : "—"}</strong></div>
            <div><span>Risk</span><strong>{pred?.riskLevel ?? "—"}</strong></div>
            <div><span>Status</span><strong>{status}</strong></div>
          </div>
          {iv.evidence.length > 0 && <ul className="ai-evidence">{iv.evidence.slice(0, 4).map((e) => <li key={e}>✓ {e}</li>)}</ul>}
          <div className="ai-muted small">
            {pred?.operationalStatus ? `RF: ${pred.operationalStatus} (${pred.confidence.toFixed(0)}%) · ` : ""}
            {pred?.source === "ml-service" ? "FastAPI ML service" : pred?.source === "analytical" ? "analytical fallback" : mlHealth.online === false ? "ML service OFFLINE" : agentEnabled ? "awaiting ML" : "autonomy OFF — no predictions"}
          </div>
        </div>

        {/* Impact */}
        <div className="ai-card">
          <div className="ai-card-title">2 · FACTORY IMPACT{iv.recovery ? ` · ${iv.recovery.impact.severity}` : ""}</div>
          <CascadeView iv={iv} />
        </div>

        {/* Recovery plan */}
        <div className="ai-card">
          <div className="ai-card-title">3 · RECOVERY PLAN</div>
          {iv.recovery ? (
            <ol className="ai-plan ai-plan-status">
              {iv.recovery.steps.map((p) => {
                const s = recoveryStepState(p.key, iv, state, m);
                return (
                  <li key={p.key} className={`rs-${s}`}>
                    <span className="rs-mark">{s === "done" ? "✓" : s === "active" ? "●" : s === "error" ? "✗" : "○"}</span>
                    <span className="rs-text">{p.step}<small>{p.agent}</small></span>
                    <AutonomyBadge level={p.autonomy} />
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="ai-muted small">{agentEnabled ? "The Supervisor Agent builds one plan from the Maintenance, Production, Material, Workforce and Safety agents." : "Autonomy is OFF — no plan will be made. Turn it on in the Failure Simulator."}</p>
          )}
        </div>

        {/* Approval + technician */}
        <div className="ai-card">
          <div className="ai-card-title">4 · HUMAN-IN-THE-LOOP</div>
          {iv.approval ? (
            <div className={`ai-approval status-${iv.approval.status}`}>
              <div className="ai-approval-head">
                {iv.approval.status === "pending" ? <><FontAwesomeIcon icon={faTriangleExclamation} /> AWAITING SUPERVISOR APPROVAL</>
                  : iv.approval.status === "rejected" ? <>REJECTED by {iv.approval.by}</>
                  : iv.approval.status === "auto" ? <>AUTO-APPROVED (autonomous mode)</>
                  : iv.approval.status === "operator-stop" ? <>STOPPED BY {iv.approval.by?.toUpperCase()}</>
                  : <>APPROVED by {iv.approval.by}</>}
              </div>
              <p>{iv.approval.reason}</p>
              {(iv.approval.status === "pending" || iv.approval.status === "rejected") && !["RECOVERED", "FAILED"].includes(iv.phase) && (
                ai.isManager ? (
                  <div className="ai-approval-actions">
                    <button className="ai-btn approve" onClick={ai.approve}>Approve shutdown</button>
                    {iv.approval.status === "pending" && <button className="ai-btn reject" onClick={ai.reject}>Reject</button>}
                  </div>
                ) : (
                  <p className="ai-muted small">Only a supervisor can approve this action.</p>
                )
              )}
            </div>
          ) : (
            <p className="ai-muted small">Isolating a machine is APPROVAL_REQUIRED. Physical repair is HUMAN_REQUIRED (simulated).</p>
          )}
          {iv.technician && (
            <div className="ai-tech">
              <strong>👨‍🔧 {iv.technician.name}</strong>{iv.technician.score !== undefined && <span> · score {iv.technician.score}</span>}
              <ul>{iv.technician.reasons.slice(0, 4).map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
          {iv.missionId && <div className="ai-muted small">Mission {iv.missionId} · MongoDB</div>}
        </div>
      </div>

      {(iv.phase === "RECOVERED" || iv.phase === "FAILED") && <ImpactSummary iv={iv} />}

      <div className="ai-card">
        <div className="ai-card-title">AI INTERVENTION TIMELINE</div>
        <InterventionTimeline entries={iv.timeline} />
      </div>

      <OtherApprovals />
    </section>
  );
}

/** Approval-required requests for machines other than the active intervention. */
function OtherApprovals() {
  const { ai } = useSim();
  if (!ai.approvals.length) return null;
  return (
    <div className="ai-card">
      <div className="ai-card-title">OTHER APPROVAL REQUESTS</div>
      {ai.approvals.map((p) => (
        <div key={p.key} className="ai-other-approval">
          <span><AutonomyBadge level="APPROVAL_REQUIRED" /> {p.action.agentName}: {p.action.reason}</span>
          {ai.isManager && (
            <span className="ai-approval-actions">
              <button className="ai-btn approve" onClick={() => ai.approveOther(p.key, true)}>Approve</button>
              <button className="ai-btn reject" onClick={() => ai.approveOther(p.key, false)}>Dismiss</button>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
