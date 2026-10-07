"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAIN } from "@/hooks/useFactorySim";
import type { useFactorySim, MachineState } from "@/hooks/useFactorySim";
import type { AgentDecision } from "@/hooks/useCoordinatorAgent";
import type { MlPredictionMap } from "@/lib/agents/types";
import type { RecoveryPlan } from "@/lib/agents/recovery";
import type { UserAccount, UserRole } from "@/context/AuthContext";

/**
 * AI intervention controller.
 *
 * Follows one injected failure through the agent cycle
 *   OBSERVE → PREDICT → REASON → PLAN → (APPROVE) → ACT → VERIFY
 * using only what actually happens: simulation telemetry each tick, and the
 * Supervisor Agent's decision (ML predictions + actions) every 6 seconds.
 * Isolation and repair are applied to the simulation itself; approval-required
 * actions wait for a supervisor. Key steps are written to the audit log.
 */

export type InterventionPhase =
  | "IDLE" | "OBSERVING" | "ANOMALY_DETECTED" | "PREDICTING" | "REASONING" | "PLANNING"
  | "AWAITING_APPROVAL" | "ACTING" | "RECOVERY" | "VERIFYING" | "RECOVERED" | "FAILED";

export interface TimelineEntry {
  at: number;        // wall-clock ms
  clock: string;     // simulation clock
  icon: string;
  kind: "info" | "warn" | "crit" | "ok" | "ai";
  msg: string;
}

export interface Snapshot {
  health: number;
  temperature: number;
  vibration: number;
  wear: number;
  failureProbability: number | null;
}

export interface Intervention {
  id: string;
  machineId: string;
  machineCode: string;
  machineLabel: string;
  failureLabel: string;
  severity: number;
  phase: InterventionPhase;
  requireApproval: boolean;
  injectedAt: number;
  anomalyAt?: number;
  detectedAt?: number;
  plannedAt?: number;
  actingAt?: number;
  repairStartedAt?: number;
  repairDoneAt?: number;
  resumedAt?: number;
  recoveredAt?: number;
  failedAt?: number;
  latestPrediction?: MlPredictionMap[string];
  peakProbability: number;
  diagnosis?: string;
  evidence: string[];
  plan: { step: string; autonomy: string }[];
  missionId?: string;
  technician?: { id: string; name: string; score?: number; reasons: string[]; fallback?: boolean };
  noTechnicianReason?: string;
  approval?: { status: "pending" | "approved" | "rejected" | "auto" | "operator-stop"; by?: string; reason: string; requestedAt: number };
  humanApprovals: number;
  acknowledgedBy?: string;
  before?: Snapshot;
  after?: Snapshot;
  verifiedBy?: "ml" | "sensors";
  /** Factory-level impact analysis + recovery plan from the Supervisor Agent. */
  recovery?: RecoveryPlan;
  rerouteAt?: number;
  restoredAt?: number;
  /** Outage of the failed cell, measured on the simulation clock. */
  outage?: {
    startTick: number;
    endTick?: number;
    producedAtStart: number;
    producedAtEnd?: number;
    baselineRate: number;          // finished parts per tick before the outage
    downstreamStarvedTicks: number;
  };
  flags: Record<string, boolean>;
  timeline: TimelineEntry[];
}

export interface PendingApproval {
  key: string;
  action: AgentDecision["actions"][number];
  machineCode: string;
  requestedAt: number;
}

type Sim = ReturnType<typeof useFactorySim>;

const FINAL: InterventionPhase[] = ["RECOVERED", "FAILED"];
const PROB_MILESTONES = [0.25, 0.5, 0.75, 0.9];
const CRITICAL_PROB = 0.55;
const SENSOR_VERIFY_AFTER_MS = 15000;

function snapshotOf(m: MachineState, prob: number | null): Snapshot {
  return { health: m.health, temperature: m.temperature, vibration: m.vibration, wear: m.toolWear, failureProbability: prob };
}

function audit(doc: Record<string, unknown>) {
  fetch("/api/agent/decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  }).catch(() => {});
}

function patchMission(id: string | undefined, status: string, note: string) {
  if (!id) return;
  fetch("/api/missions", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, patch: { status }, timelineNote: note }),
  }).catch(() => {});
}

export function useIntervention(
  sim: Sim,
  latest: AgentDecision | null,
  role: UserRole,
  user: UserAccount | null
) {
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [past, setPast] = useState<Intervention[]>([]);
  const [requireApproval, setRequireApproval] = useState(true);

  // Latest values for callbacks and effects, refreshed after every render.
  const ivRef = useRef(intervention);
  const simRef = useRef(sim);
  const userRef = useRef(user);
  useEffect(() => {
    ivRef.current = intervention;
    simRef.current = sim;
    userRef.current = user;
  });

  const isManager = role === "SUPERVISOR" || role === "ADMIN";
  const canOperate = useCallback(
    (machineCode: string) => isManager || (role === "USER" && user?.assignedMachine === machineCode),
    [isManager, role, user?.assignedMachine]
  );

  /** Append to the timeline once per `key` (or always when key is empty). */
  const withEntry = (
    iv: Intervention,
    key: string,
    icon: string,
    kind: TimelineEntry["kind"],
    msg: string,
    patch: Partial<Intervention> = {}
  ): Intervention => {
    if (key && iv.flags[key]) return iv;
    return {
      ...iv,
      ...patch,
      flags: key ? { ...iv.flags, [key]: true } : iv.flags,
      timeline: [...iv.timeline, { at: Date.now(), clock: simRef.current.wallClock, icon, kind, msg }],
    };
  };

  /* ── ACT: isolate the machine and send the selected technician ───────── */
  const act = useCallback((iv: Intervention, approvedBy: string): Intervention => {
    const s = simRef.current;
    const m = s.state.machines.find((mm) => mm.id === iv.machineId);
    if (!m) return iv;
    s.isolateMachine(m.id, `AI isolation · ${approvedBy}`);
    const tech = iv.technician ?? { id: "CREW", name: "Maintenance crew", reasons: ["No technician record selected — simulated crew"], fallback: true };
    s.dispatchWorker({ id: tech.id, name: tech.name, targetMachineCode: m.code, missionId: iv.missionId, taskTicks: 24 });
    patchMission(iv.missionId, "execute", `Isolated (${approvedBy}); ${tech.name} dispatched`);
    audit({
      agentName: "SupervisorAgent", phase: "act", machineCode: m.code, missionId: iv.missionId,
      action: `pause_machine (isolate) + dispatch ${tech.name}`, autonomyLevel: "APPROVAL_REQUIRED",
      reasoning: iv.diagnosis, outcome: `Isolated · ${approvedBy}`, humanApproval: approvedBy,
      mlPrediction: iv.latestPrediction,
    });
    let next: Intervention = { ...iv, phase: "ACTING", actingAt: Date.now(), technician: tech, before: snapshotOf(m, iv.latestPrediction?.failureProbability ?? null) };
    next = withEntry(next, "isolated", "⏸", "warn", `${m.code} isolated and stopped (${approvedBy})`);
    next = withEntry(next, "dispatched", "👨‍🔧", "ai", `${tech.name} dispatched to ${m.code}${tech.fallback ? " (simulated crew)" : ""}`);
    return next;
  }, []);

  const latestHasPrediction = (iv: Intervention) => !!iv.flags.postRepairPrediction;

  const finishRecovery = (iv: Intervention, m: MachineState, by: "ml" | "sensors"): Intervention => {
    const prob = by === "ml" ? iv.latestPrediction?.failureProbability ?? null : null;
    patchMission(iv.missionId, "complete", `AI verified recovery (${by === "ml" ? "ML + sensors" : "sensors"})`);
    audit({
      agentName: "SupervisorAgent", phase: "verify", machineCode: m.code, missionId: iv.missionId,
      mlPrediction: iv.latestPrediction, outcome: `Recovered · health ${m.health.toFixed(0)}%${prob !== null ? ` · ML ${(prob * 100).toFixed(1)}%` : ""}`,
    });
    return withEntry(
      iv, "recovered", "✅", "ok",
      `AI verified recovery — health ${m.health.toFixed(0)}%, ${m.temperature.toFixed(0)} °C, ${m.vibration.toFixed(2)} mm/s${prob !== null ? `, failure probability ${(prob * 100).toFixed(1)}%` : " (ML unavailable — sensor check)"}`,
      { phase: "RECOVERED", recoveredAt: Date.now(), after: snapshotOf(m, prob), verifiedBy: by }
    );
  };

  /* ── OBSERVE / ACT / VERIFY on every simulation tick ─────────────────── */
  const tick = sim.state.tick;
  useEffect(() => {
    const cur = ivRef.current;
    if (!cur) return;
    const s = simRef.current;
    const m = s.state.machines.find((mm) => mm.id === cur.machineId);
    if (!m) return;
    let next = cur;
    const st = s.state;

    // Outage of the failed cell: measured for both outcomes (recovered or broken down).
    const down = m.isolated || m.status === "downtime";
    if (down && !next.outage) {
      next = {
        ...next,
        outage: {
          startTick: st.tick,
          producedAtStart: st.totalProduced,
          baselineRate: st.tick > 0 ? st.totalProduced / st.tick : 0,
          downstreamStarvedTicks: 0,
        },
      };
    } else if (next.outage && !next.outage.endTick) {
      if (down) {
        const idx = CHAIN.indexOf(m.id);
        const starved = st.machines.filter((x) => CHAIN.indexOf(x.id) > idx && (x.starvedTicks ?? 0) >= 6).length;
        if (starved) next = { ...next, outage: { ...next.outage, downstreamStarvedTicks: next.outage.downstreamStarvedTicks + starved } };
      } else {
        next = { ...next, outage: { ...next.outage, endTick: st.tick, producedAtEnd: st.totalProduced } };
      }
    }
    // Cascade made visible: downstream cells that run dry while this cell is down.
    if (!next.outage?.endTick) {
      for (const x of st.machines) {
        if ((x.starvedTicks ?? 0) >= 6) {
          next = withEntry(next, `starved-${x.code}`, "⚠", "crit", `${x.code} ${x.shortLabel} starved — no parts while ${m.code} is down`);
        }
      }
    }
    if (FINAL.includes(cur.phase)) {
      if (next !== cur) setIntervention(next);
      return;
    }

    // Factory reorganisation, as it actually happens in the plant.
    if (st.reroute && st.reroute.fromId === m.id && !next.flags.rerouted) {
      next = withEntry(next, "rerouted", "🔀", "ok",
        `Production rerouted to CNC-05 standby lathe — AGV-02 redirected, ${st.reroute.movedParts} queued parts moved`, { rerouteAt: Date.now() });
    }
    if (st.throttled && !next.flags.throttled) {
      next = withEntry(next, "throttled", "⚖", "ai", "Material flow rebalanced — AS/RS release throttled to match reduced capacity");
    }
    if (next.flags.rerouted && !st.reroute && !next.flags.restored) {
      next = withEntry(next, "restored", "↩", "ok", `Original production plan restored — work back on ${m.code}, AGV-02 back on its route`, { restoredAt: Date.now() });
    }

    if (m.breakdownTick !== undefined && !next.flags.breakdown) {
      next = withEntry(next, "breakdown", "💥", "crit", `${m.code} broke down before it was isolated — failure NOT prevented`, { phase: "FAILED", failedAt: Date.now() });
      patchMission(next.missionId, "cancelled", "Machine broke down before intervention");
      audit({ agentName: "MaintenanceAgent", phase: "verify", machineCode: m.code, missionId: next.missionId, outcome: "Breakdown — intervention failed" });
      setIntervention(next);
      return;
    }

    // OBSERVE: sensor anomalies (simulated telemetry crossing normal limits)
    const anomalyPatch = next.phase === "OBSERVING" ? { phase: "ANOMALY_DETECTED" as InterventionPhase, anomalyAt: Date.now() } : {};
    if (!m.isolated) {
      if (m.temperature > 78) next = withEntry(next, "tempAnomaly", "⚠", "warn", `Temperature anomaly — ${m.temperature.toFixed(1)} °C (normal < 78 °C)`, anomalyPatch);
      if (m.vibration > 2.2) next = withEntry(next, "vibAnomaly", "⚠", "warn", `Vibration increasing — ${m.vibration.toFixed(2)} mm/s (normal < 2.2)`, next.phase === "OBSERVING" ? anomalyPatch : {});
      if (m.health < 72) next = withEntry(next, "healthDrop", "⚠", "warn", `Health dropping — ${m.health.toFixed(0)}%`, next.phase === "OBSERVING" ? anomalyPatch : {});
      if (m.status === "critical") next = withEntry(next, "critical", "🔴", "crit", `${m.code} entered CRITICAL condition — ${m.temperature.toFixed(0)} °C · ${m.vibration.toFixed(1)} mm/s · health ${m.health.toFixed(0)}%`);
    }

    // ACT → RECOVERY → VERIFY: follow the technician and the machine
    const worker = s.state.activeWorkers.find((w) => w.targetMachineCode === m.code);
    if (next.actingAt && worker?.status === "on_task") {
      next = withEntry(next, "repairStart", "🔧", "info", `Simulated bearing replacement started by ${worker.name}`, { phase: "RECOVERY", repairStartedAt: Date.now() });
    }
    if (next.flags.repairStart && !m.failure && !next.flags.repairDone) {
      next = withEntry(next, "repairDone", "✓", "ok", "Simulated repair executed — bearing replaced (simulated, not a physical repair)", { phase: "VERIFYING", repairDoneAt: Date.now() });
      patchMission(next.missionId, "verify", "Simulated repair executed");
      audit({ agentName: "WorkforceAgent", phase: "act", machineCode: m.code, missionId: next.missionId, action: "simulated bearing replacement", autonomyLevel: "HUMAN_REQUIRED", outcome: `Executed by ${next.technician?.name ?? "crew"}` });
    }
    if (next.flags.repairDone && !next.flags.resumed && m.isolated && !worker && m.temperature < 75 && m.health > 85) {
      s.releaseMachine(m.id, "AI verified cool-down and health", true);
      next = withEntry(next, "resumed", "▶", "ok", `${m.code} restarted — production resumed (controlled run-in${m.queue ? ` while ${m.queue} queued parts drain` : ""})`, { resumedAt: Date.now() });
    }
    const routeBack = !next.flags.rerouted || next.flags.restored;
    if (next.flags.mlVerified && routeBack) {
      next = finishRecovery(next, m, "ml");
    }
    // Verification fallback when ML is unavailable: sensors only, after a grace period.
    if (next.resumedAt && !m.isolated && m.status === "healthy" && routeBack && Date.now() - next.resumedAt > SENSOR_VERIFY_AFTER_MS && !latestHasPrediction(next)) {
      next = finishRecovery(next, m, "sensors");
    }

    if (next !== cur) setIntervention(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  /* ── PREDICT / REASON / PLAN / VERIFY on every agent decision ────────── */
  useEffect(() => {
    if (!latest) return;
    const cur = ivRef.current;
    const s = simRef.current;

    // Approval-required actions for machines outside the intervention.
    const extra = latest.actions.filter(
      (a) =>
        a.autonomyLevel === "APPROVAL_REQUIRED" && a.args?.machineCode &&
        !(cur && !FINAL.includes(cur.phase) && a.args.machineCode === cur.machineCode)
    );
    if (extra.length) {
      setApprovals((prev) => {
        const keys = new Set(prev.map((p) => p.key));
        const add = extra
          .map((a) => ({ key: `${a.tool}:${a.args.machineCode}`, action: a, machineCode: String(a.args.machineCode), requestedAt: Date.now() }))
          .filter((p) => !keys.has(p.key));
        return add.length ? [...prev, ...add] : prev;
      });
    }

    if (!cur || FINAL.includes(cur.phase)) return;
    const m = s.state.machines.find((mm) => mm.id === cur.machineId);
    if (!m) return;
    const code = cur.machineCode;
    let next = cur;
    const pred = latest.ml?.[code];

    // PREDICT
    if (pred && !m.isolated) {
      const p = pred.failureProbability;
      next = { ...next, latestPrediction: pred, peakProbability: Math.max(next.peakProbability, p) };
      if (!next.repairDoneAt) {
        if (["OBSERVING", "ANOMALY_DETECTED"].includes(next.phase)) next = { ...next, phase: "PREDICTING" };
        next = withEntry(next, "firstPrediction", "🤖", "ai",
          `ML scored ${code}: ${(p * 100).toFixed(1)}% failure probability (LightGBM)${pred.operationalStatus ? ` · status ${pred.operationalStatus} (Random Forest)` : ""}${pred.source === "analytical" ? " · analytical fallback" : ""}`);
        // One entry per cycle, for the highest milestone newly crossed.
        const crossed = PROB_MILESTONES.filter((mark) => p >= mark && !next.flags[`prob${mark}`]);
        if (crossed.length) {
          const flags = { ...next.flags };
          crossed.forEach((mark) => (flags[`prob${mark}`] = true));
          next = withEntry({ ...next, flags }, "", "🤖", p >= 0.75 ? "crit" : "ai", `Failure probability increased to ${(p * 100).toFixed(1)}%`);
        }
        if (p >= CRITICAL_PROB && !next.detectedAt) {
          next = withEntry(next, "critPredicted", "🔴", "crit", `Critical failure predicted for ${code} (${(p * 100).toFixed(1)}%, ${pred.riskLevel})`, { detectedAt: Date.now() });
        }
      } else if (next.resumedAt) {
        // VERIFY: a post-repair prediction from the same ML pipeline.
        next = { ...next, flags: { ...next.flags, postRepairPrediction: true, mlVerified: next.flags.mlVerified || p < 0.2 } };
      }
    }

    // REASON + PLAN: what the Maintenance and Workforce agents decided
    const forMachine = latest.actions.filter((a) => a.args?.machineCode === code);
    const mission = forMachine.find((a) => a.tool === "create_mission");
    const pause = forMachine.find((a) => a.tool === "pause_machine");
    const assign = forMachine.find((a) => a.tool === "assign_worker");
    const noWorker = forMachine.find((a) => a.tool === "request_human_approval");
    const reasonSrc = mission ?? pause;

    if (reasonSrc && !next.flags.reasoned) {
      const ev: string[] = reasonSrc.args.evidence ?? [];
      next = withEntry(next, "reasoned", "🧠", "ai", `Maintenance Agent diagnosis: ${reasonSrc.args.diagnosis ?? "degradation"} — ${ev.join("; ")}`, {
        phase: "REASONING",
        diagnosis: reasonSrc.args.diagnosis,
        evidence: ev,
        detectedAt: next.detectedAt ?? Date.now(),
      });
    }
    if (mission && !next.flags.mission) {
      next = withEntry(next, "mission", "🤖", "ai", `Maintenance mission ${mission.args.missionId ?? ""} created by Maintenance Agent (${mission.args.priority} priority)`, {
        phase: "PLANNING",
        plannedAt: Date.now(),
        missionId: mission.args.missionId,
        plan: mission.args.plan ?? next.plan,
      });
      audit({ agentName: "MaintenanceAgent", phase: "plan", machineCode: code, missionId: mission.args.missionId, mlPrediction: pred, reasoning: mission.args.agentReasoning, action: "create_mission", autonomyLevel: mission.autonomyLevel, outcome: "Mission created automatically" });
    }
    if (assign && !next.flags.assigned) {
      next = withEntry(next, "assigned", "👨‍🔧", "ai", `Workforce Agent selected ${assign.args.workerName} (score ${assign.args.matchScore}) — ${(assign.args.reasons ?? []).slice(0, 3).join(" · ")}`, {
        technician: { id: assign.args.workerId, name: assign.args.workerName, score: assign.args.matchScore, reasons: assign.args.reasons ?? [] },
      });
      audit({ agentName: "WorkforceAgent", phase: "plan", machineCode: code, missionId: assign.args.missionId ?? next.missionId, action: `assign_worker ${assign.args.workerName}`, autonomyLevel: "SAFE", reasoning: (assign.args.reasons ?? []).join(" · "), outcome: "Technician selected" });
    }
    const plan = latest.recovery;
    if (plan && plan.machineCode === code && !next.recovery) {
      const casc = plan.impact.cascade
        .filter((c) => c.effect === "starves" || c.effect === "blocks")
        .map((c) => `${c.code} ${c.effect}${(c.inMinutes ?? 0) < 1 ? " immediately" : ` in ~${c.inMinutes} min`}`)
        .join(", ");
      next = withEntry({ ...next, recovery: plan }, "impact", "🧭", "crit",
        `Impact analysis (${plan.impact.severity}): ${code} down ~${plan.impact.expectedRepairMinutes} min → ${casc}. Expected loss ${plan.impact.lossWithoutActionUnits} units without action, ${plan.impact.lossWithRecoveryUnits} with recovery.`);
      next = withEntry(next, "recoveryPlan", "🤖", "ai",
        `Supervisor Agent created a factory recovery plan (${plan.steps.length} steps) — keep the line producing while ${code} is repaired`, { phase: "PLANNING" });
      audit({ agentName: "SupervisorAgent", phase: "plan", machineCode: code, reasoning: plan.impact.summary, action: `recovery plan: ${plan.steps.map((st) => st.key).join(", ")}`, autonomyLevel: "SAFE", outcome: `Impact ${plan.impact.severity}` });
    }
    const reroute = latest.actions.find((a) => a.tool === "activate_backup_route" && a.args?.machineCode === code);
    if (reroute && !next.flags.rerouteAudited) {
      next = { ...next, flags: { ...next.flags, rerouteAudited: true } };
      audit({ agentName: "ProductionAgent", phase: "act", machineCode: code, action: "activate_backup_route → CELL-07", autonomyLevel: "SAFE", humanApproval: "Automatic", outcome: "Production rerouted" });
    }
    if (noWorker && !next.flags.noWorker) {
      next = withEntry(next, "noWorker", "⚠", "warn", `No qualified technician available on shift — ${noWorker.args.reason}`, { noTechnicianReason: noWorker.args.reason });
    }
    if (pause && !next.approval) {
      const reason = pause.reason;
      if (requireApproval) {
        next = withEntry(next, "approvalRequested", "⏸", "warn", `AI requests supervisor approval to isolate ${code}: ${reason}`, {
          phase: "AWAITING_APPROVAL",
          approval: { status: "pending", reason, requestedAt: Date.now() },
        });
      } else {
        next = withEntry(next, "approvalRequested", "⏸", "ai", `Isolation of ${code} auto-approved (autonomous mode): ${reason}`, {
          approval: { status: "auto", by: "autonomous mode", reason, requestedAt: Date.now() },
        });
        next = act(next, "auto-approved (autonomous mode)");
      }
    }

    if (next !== cur) setIntervention(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest]);

  /* ── user actions ───────────────────────────────────────────────────── */

  const inject = useCallback(async (machineId: string, severity: number) => {
    const s = simRef.current;
    if (!isManager) return { ok: false, error: "Only supervisors and admins can inject failures." };
    if (!s.state.running) return { ok: false, error: "Start the simulation first." };
    const active = ivRef.current;
    if (active && !FINAL.includes(active.phase)) return { ok: false, error: "An intervention is already in progress." };
    const m = s.state.machines.find((mm) => mm.id === machineId);
    if (!m) return { ok: false, error: "Unknown machine." };

    // Clear stale open missions on this machine so the agents can open a fresh one.
    await fetch("/api/missions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelOpen: true, machineCode: m.code, note: "Superseded by new failure simulation" }),
    }).catch(() => {});

    if (active) setPast((p) => [...p, active].slice(-10));
    s.injectFailure(machineId, "bearing", severity);
    const now = Date.now();
    const iv: Intervention = {
      id: `IV-${now.toString().slice(-6)}`,
      machineId, machineCode: m.code, machineLabel: m.label,
      failureLabel: "Bearing Wear / Overheating", severity,
      phase: "OBSERVING", requireApproval, injectedAt: now,
      peakProbability: 0, evidence: [], plan: [], humanApprovals: 0, flags: {},
      timeline: [
        { at: now, clock: s.wallClock, icon: "✓", kind: "ok", msg: `${m.code} operating normally — health ${m.health.toFixed(0)}%, ${m.temperature.toFixed(0)} °C, ${m.vibration.toFixed(2)} mm/s` },
        { at: now, clock: s.wallClock, icon: "🧪", kind: "warn", msg: `Simulated failure injected: bearing wear / overheating (severity ${severity.toFixed(1)}) — AI is observing` },
      ],
    };
    setIntervention(iv);
    audit({ agentName: "Simulation", phase: "observe", machineCode: m.code, action: "inject_failure bearing", outcome: `Injected by ${userRef.current?.name ?? role}` });
    return { ok: true };
  }, [isManager, requireApproval, role]);

  const approve = useCallback(() => {
    const cur = ivRef.current;
    if (!isManager || !cur?.approval || FINAL.includes(cur.phase) || !["pending", "rejected"].includes(cur.approval.status)) return;
    const by = userRef.current?.name ?? role;
    let next: Intervention = { ...cur, approval: { ...cur.approval, status: "approved", by }, humanApprovals: cur.humanApprovals + 1 };
    next = withEntry(next, "approved", "✅", "ok", `Supervisor ${by} approved isolation of ${cur.machineCode}`);
    setIntervention(act(next, `approved by ${by}`));
  }, [isManager, role, act]);

  const reject = useCallback(() => {
    const cur = ivRef.current;
    if (!isManager || !cur || FINAL.includes(cur.phase) || cur.approval?.status !== "pending") return;
    const by = userRef.current?.name ?? role;
    audit({ agentName: "SupervisorAgent", phase: "act", machineCode: cur.machineCode, missionId: cur.missionId, action: "pause_machine", autonomyLevel: "APPROVAL_REQUIRED", outcome: `Rejected by ${by}`, humanApproval: `rejected by ${by}` });
    setIntervention(withEntry({ ...cur, phase: "PLANNING", approval: { ...cur.approval, status: "rejected", by } }, "", "✗", "crit",
      `Supervisor ${by} rejected isolation — machine keeps running; risk of breakdown`));
  }, [isManager, role]);

  /** Operator / supervisor stop of one machine (e-stop). */
  const stopMachine = useCallback((machineCode: string) => {
    if (!canOperate(machineCode)) return;
    const s = simRef.current;
    const m = s.state.machines.find((mm) => mm.code === machineCode);
    if (!m || m.isolated) return;
    const by = userRef.current?.name ?? role;
    const cur = ivRef.current;
    if (cur && cur.machineCode === machineCode && !FINAL.includes(cur.phase) && !cur.actingAt) {
      // A person stopping the machine satisfies the isolation step of the plan.
      let next: Intervention = {
        ...cur,
        approval: { status: "operator-stop", by, reason: cur.approval?.reason ?? "Operator stopped machine", requestedAt: cur.approval?.requestedAt ?? Date.now() },
        humanApprovals: cur.humanApprovals + 1,
      };
      next = withEntry(next, "", "🛑", "warn", `${by} stopped ${machineCode} (e-stop)`);
      setIntervention(act(next, `e-stop by ${by}`));
      return;
    }
    s.isolateMachine(m.id, `E-stop by ${by}`);
    if (cur && cur.machineCode === machineCode && !FINAL.includes(cur.phase)) {
      setIntervention(withEntry(cur, "", "🛑", "warn", `${by} stopped ${machineCode} (e-stop)`));
    }
  }, [canOperate, role, act]);

  /** Restart a stopped machine — only once no failure or intervention needs it held. */
  const resumeMachine = useCallback((machineCode: string) => {
    if (!canOperate(machineCode)) return;
    const s = simRef.current;
    const m = s.state.machines.find((mm) => mm.code === machineCode);
    const cur = ivRef.current;
    const busy = cur && cur.machineCode === machineCode && !FINAL.includes(cur.phase) && cur.actingAt;
    if (!m || !m.isolated || m.failure || busy) return;
    s.releaseMachine(m.id, `restarted by ${userRef.current?.name ?? role}`);
  }, [canOperate, role]);

  const acknowledge = useCallback((machineCode: string) => {
    const cur = ivRef.current;
    if (!canOperate(machineCode) || !cur || cur.machineCode !== machineCode || cur.acknowledgedBy) return;
    const by = userRef.current?.name ?? role;
    setIntervention(withEntry({ ...cur, acknowledgedBy: by }, "ack", "👁", "info", `Alert acknowledged by ${by}`));
  }, [canOperate, role]);

  const approveOther = useCallback((key: string, ok: boolean) => {
    if (!isManager) return;
    setApprovals((prev) => {
      const item = prev.find((p) => p.key === key);
      if (item && ok) simRef.current.applyAgentAction(item.action);
      if (item) audit({ agentName: item.action.agentName, phase: "act", machineCode: item.machineCode, action: item.action.tool, autonomyLevel: "APPROVAL_REQUIRED", outcome: ok ? "Approved" : "Rejected", humanApproval: userRef.current?.name ?? role });
      return prev.filter((p) => p.key !== key);
    });
  }, [isManager, role]);

  /** Full demo reset: clean factory, no intervention, open missions cancelled. */
  const resetAll = useCallback(() => {
    if (!isManager) return;
    simRef.current.reset();
    setIntervention(null);
    setApprovals([]);
    setPast([]);
    fetch("/api/missions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelOpen: true, note: "Cancelled by simulation reset" }),
    }).catch(() => {});
  }, [isManager]);

  return {
    intervention, past, approvals, requireApproval, setRequireApproval,
    inject, approve, reject, stopMachine, resumeMachine, acknowledge, approveOther, resetAll,
    canOperate, isManager,
  };
}
