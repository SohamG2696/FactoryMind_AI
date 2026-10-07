import type { AgentAction, AgentReport, MachineSnap, MlPredictionMap, PlantSnapshot } from "./types";

/**
 * Factory-level recovery — "what happens to the whole line if this cell fails,
 * and how do we keep producing while it is repaired?"
 *
 * Impact analysis uses the twin's live buffers: each downstream cell keeps
 * working only as long as the parts already queued in front of it last, and the
 * upstream cell blocks once the failed cell's buffer is full. The Production and
 * Material agents then propose SAFE actions that change the plant (reroute to
 * standby capacity, rebalance material release); isolation stays
 * APPROVAL_REQUIRED and the repair HUMAN_REQUIRED.
 */

/** Production order of the line (machine codes). */
export const LINE = ["CELL-06", "CELL-01", "CELL-02", "CELL-04", "CELL-05", "CELL-03"];
/** Standby capacity per cell, where the plant has one. */
export const BACKUP_CELL: Record<string, string> = { "CELL-04": "CELL-07" };

const SIM_MIN_PER_TICK = 0.5;     // 30 sim-seconds per tick
const PARTS_PER_TICK = 0.9;       // a healthy cell consumes ~1 part per tick
const EXPECTED_REPAIR_MIN = 25;   // technician travel + bearing replacement + verification
const BACKUP_RATE = 0.7;          // standby lathe runs at 70 % of CNC-07

export interface CascadeStep {
  code: string;
  label: string;
  effect: "fails" | "starves" | "blocks" | "rerouted";
  inMinutes: number | null;
  note: string;
}

export interface ImpactAnalysis {
  machineCode: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  cascade: CascadeStep[];
  expectedRepairMinutes: number;
  lossWithoutActionUnits: number;
  lossWithRecoveryUnits: number;
  backup: { code: string; label: string; available: boolean } | null;
  summary: string;
}

export interface RecoveryStep {
  key: string;
  step: string;
  agent: string;
  autonomy: "SAFE" | "APPROVAL_REQUIRED" | "HUMAN_REQUIRED";
}

export interface RecoveryPlan {
  machineCode: string;
  impact: ImpactAnalysis;
  steps: RecoveryStep[];
}

export function analyzeImpact(snap: PlantSnapshot, code: string): ImpactAnalysis | null {
  const idx = LINE.indexOf(code);
  if (idx < 0) return null;
  const by = new Map(snap.machines.map((m) => [m.code, m]));
  const failed = by.get(code)!;
  const backupCode = BACKUP_CELL[code];
  const backup = backupCode ? by.get(backupCode) : undefined;
  const backupOk = !!backup && backup.status !== "critical" && backup.status !== "downtime";

  const cascade: CascadeStep[] = [
    { code, label: failed.label, effect: "fails", inMinutes: 0, note: `${failed.label} stops for maintenance` },
  ];

  // Downstream: each cell runs until the parts already in front of it are used up.
  let buffered = 0;
  for (let j = idx + 1; j < LINE.length; j++) {
    const m = by.get(LINE[j]);
    if (!m) continue;
    buffered += m.queue;
    const minutes = Math.round((buffered / PARTS_PER_TICK) * SIM_MIN_PER_TICK);
    cascade.push({ code: m.code, label: m.label, effect: "starves", inMinutes: minutes, note: minutes < 1 ? "runs out of parts immediately" : `runs out of parts in ~${minutes} min` });
  }
  // Upstream: the feeder blocks once the failed cell's buffer is full.
  if (idx > 0) {
    const feeder = by.get(LINE[idx - 1]);
    if (feeder) {
      const room = Math.max(0, (failed.capacity ?? 30) + 20 - failed.queue);
      const minutes = Math.round((room / PARTS_PER_TICK) * SIM_MIN_PER_TICK);
      cascade.push({ code: feeder.code, label: feeder.label, effect: "blocks", inMinutes: minutes, note: `output blocked in ~${minutes} min (buffer full)` });
    }
  }
  if (backup) {
    cascade.push({
      code: backup.code, label: backup.label, effect: "rerouted", inMinutes: null,
      note: backupOk ? `standby capacity available at ${Math.round(BACKUP_RATE * 100)}% rate` : "standby capacity unavailable",
    });
  }

  const tph = snap.throughputPerHour ?? 0;
  const lossWithout = Math.round((tph * EXPECTED_REPAIR_MIN) / 60);
  const lossWith = backupOk ? Math.round(lossWithout * (1 - BACKUP_RATE)) : lossWithout;
  const firstStarve = cascade.find((c) => c.effect === "starves")?.inMinutes ?? Infinity;
  const severity: ImpactAnalysis["severity"] =
    firstStarve < EXPECTED_REPAIR_MIN ? "HIGH" : firstStarve < EXPECTED_REPAIR_MIN * 2 ? "MEDIUM" : "LOW";

  return {
    machineCode: code,
    severity,
    cascade,
    expectedRepairMinutes: EXPECTED_REPAIR_MIN,
    lossWithoutActionUnits: lossWithout,
    lossWithRecoveryUnits: lossWith,
    backup: backup ? { code: backup.code, label: backup.label, available: backupOk } : null,
    summary:
      `${failed.label} down for ~${EXPECTED_REPAIR_MIN} min starves downstream cells ${firstStarve === Infinity ? "later" : firstStarve < 1 ? "immediately" : `in ~${firstStarve} min`}` +
      (backupOk ? ` — rerouting to ${backup!.label} keeps ~${Math.round(BACKUP_RATE * 100)}% of output.` : " — no standby capacity; protect downstream buffers."),
  };
}

function isFailing(m: MachineSnap, ml: MlPredictionMap) {
  return (ml[m.code]?.failureProbability ?? 0) > 0.55 || m.health < 45 || m.isolated || m.status === "downtime";
}

/** Production + Material agents' factory-level proposals, and the plan the Supervisor will present. */
export function recoveryAgents(
  snap: PlantSnapshot,
  ml: MlPredictionMap,
  failingCodes: string[]
): { reports: AgentReport[]; actions: AgentAction[]; plan: RecoveryPlan | null } {
  const prodThoughts: string[] = [];
  const matThoughts: string[] = [];
  const actions: AgentAction[] = [];
  let plan: RecoveryPlan | null = null;
  const by = new Map(snap.machines.map((m) => [m.code, m]));

  // Restore the original plan once the failed cell is back to health.
  if (snap.reroute) {
    const failed = by.get(snap.reroute.from);
    const back = failed && !failed.isolated && failed.status === "healthy" && (ml[failed.code]?.failureProbability ?? 0) < 0.2;
    if (back) {
      actions.push({
        tool: "restore_route", args: { machineCode: failed!.code }, autonomyLevel: "SAFE", agentName: "ProductionAgent",
        reason: `${failed!.code} verified healthy — return work from ${snap.reroute.to} to the original line`,
      });
      prodThoughts.push(`${failed!.code} is healthy again; restoring the original production plan.`);
    } else {
      prodThoughts.push(`Line running on ${snap.reroute.to} while ${snap.reroute.from} is repaired.`);
    }
  }

  for (const code of failingCodes) {
    const m = by.get(code);
    if (!m || m.standby || !isFailing(m, ml)) continue;
    const impact = analyzeImpact(snap, code);
    if (!impact) continue;
    prodThoughts.push(`Impact analysis for ${code}: ${impact.summary}`);

    const steps: RecoveryStep[] = [
      { key: "isolate", step: `Isolate ${code} (${m.label})`, agent: "Safety / Maintenance Agent", autonomy: "APPROVAL_REQUIRED" },
      { key: "dispatch", step: "Dispatch best-matched technician", agent: "Workforce Agent", autonomy: "SAFE" },
    ];
    if (impact.backup?.available && !snap.reroute) {
      actions.push({
        tool: "activate_backup_route",
        args: { machineCode: code, backupCode: impact.backup.code, impact },
        reason: `Reroute ${code} work to ${impact.backup.label} — keeps ~70% output while ${code} is repaired`,
        autonomyLevel: "SAFE",
        agentName: "ProductionAgent",
      });
      steps.push(
        { key: "reroute", step: `Move ${code} work to ${impact.backup.label}`, agent: "Production Agent", autonomy: "SAFE" },
        { key: "agv", step: `Redirect AGV-02 to ${impact.backup.code}`, agent: "Production Agent", autonomy: "SAFE" },
      );
    }
    if (!snap.throttled) {
      actions.push({
        tool: "rebalance_material", args: { machineCode: code, throttle: true },
        reason: `Throttle AS/RS release to match reduced ${code} capacity and avoid WIP pile-up`,
        autonomyLevel: "SAFE", agentName: "MaterialAgent",
      });
      matThoughts.push(`Throttling raw-material release while ${code} capacity is reduced.`);
    }
    steps.push(
      { key: "material", step: "Rebalance material release (AS/RS throttle)", agent: "Material Agent", autonomy: "SAFE" },
      { key: "protect", step: "Keep downstream cells fed (no starvation)", agent: "Production Agent", autonomy: "SAFE" },
      { key: "repair", step: `Repair ${code} in parallel (simulated)`, agent: "Technician", autonomy: "HUMAN_REQUIRED" },
      { key: "restore", step: "Verify and restore the original production plan", agent: "Supervisor Agent", autonomy: "SAFE" },
    );
    plan = plan ?? { machineCode: code, impact, steps };
  }

  return {
    reports: [
      { agentName: "ProductionAgent·Recovery", thoughts: prodThoughts, actions: actions.filter((a) => a.agentName === "ProductionAgent") },
      { agentName: "MaterialAgent·Recovery", thoughts: matThoughts, actions: actions.filter((a) => a.agentName === "MaterialAgent") },
    ].filter((r) => r.thoughts.length || r.actions.length),
    actions,
    plan,
  };
}
