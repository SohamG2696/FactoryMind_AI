import type {
  AgentAction,
  AgentReport,
  PlantSnapshot,
  MlPredictionMap,
  SupervisorContext,
} from "./types";
import type { SeedWorker } from "../seedWorkers";

import { maintenanceAgent } from "./maintenance";
import { productionAgent } from "./production";
import { materialAgent } from "./material";
import { workforceAgent, PendingMission } from "./workforce";
import { safetyAgent } from "./safety";
import { groqReason, isGroqEnabled } from "../groq";
import { recoveryAgents, RecoveryPlan, LINE } from "./recovery";

/**
 * Supervisor Agent — orchestrates all specialized agents.
 *
 * Flow:
 *   1. Fan out snap+ml to Maintenance / Production / Material / Safety
 *   2. Collect their actions; extract any `create_mission` actions
 *      needing a worker → hand to WorkforceAgent
 *   3. Merge WorkforceAgent's `assign_worker` actions in
 *   4. Deduplicate and enforce autonomy classification
 *   5. Optional: ask Groq for a one-line executive summary
 */

export interface SupervisorRunOutput {
  reports: AgentReport[];
  actions: AgentAction[];
  executiveSummary: string;
  llmUsed: boolean;
  /** Factory-level recovery plan (impact analysis + steps), when a cell is failing. */
  recovery: RecoveryPlan | null;
}

export async function runSupervisor(
  snap: PlantSnapshot,
  ml: MlPredictionMap,
  supervisors: SupervisorContext[],
  workers: SeedWorker[],
  openMissionMachines: Set<string>
): Promise<SupervisorRunOutput> {
  const reports: AgentReport[] = [];

  // Domain agents run in parallel (all deterministic).
  const [maint, prod, mat, safe] = [
    maintenanceAgent(snap, ml, supervisors, openMissionMachines),
    productionAgent(snap, supervisors),
    materialAgent(snap),
    safetyAgent(snap, supervisors),
  ];
  reports.push(maint, prod, mat, safe);

  // Extract mission creations that need a worker
  const pending: PendingMission[] = maint.actions
    .filter((a) => a.tool === "create_mission")
    .map((a) => ({
      id: undefined, // will be assigned on POST /api/missions
      machineCode: a.args.machineCode,
      requiredSkills: a.args.requiredSkills || [],
      requiredCertifications: a.args.requiredCertifications || [],
      priority: a.args.priority || "high",
      supervisorId: a.targetSupervisorId,
      agentReasoning: a.args.agentReasoning,
    }));

  const wf = workforceAgent(pending, workers);
  reports.push(wf);

  // Factory-level recovery: which cells are failing, what that does to the line,
  // and how to keep producing around them.
  const failing = new Set<string>(
    maint.actions.filter((a) => a.tool === "create_mission" || a.tool === "pause_machine").map((a) => String(a.args.machineCode))
  );
  for (const m of snap.machines) {
    if (LINE.includes(m.code) && (m.isolated || (m.status === "downtime" && m.health < 50))) failing.add(m.code);
  }
  const rec = recoveryAgents(snap, ml, [...failing]);
  reports.push(...rec.reports);

  // Flatten all actions; drop duplicate pause requests (Maintenance and Safety
  // can both ask to stop the same machine in one cycle — keep the first).
  const seenPause = new Set<string>();
  const allActions: AgentAction[] = [
    ...maint.actions,
    ...prod.actions,
    ...mat.actions,
    ...safe.actions,
    ...wf.actions,
    ...rec.actions,
  ].filter((a) => {
    if (a.tool !== "pause_machine") return true;
    const key = String(a.args.machineCode);
    if (seenPause.has(key)) return false;
    seenPause.add(key);
    return true;
  });

  // Optional: Groq one-line executive summary (does not gate actions)
  let executiveSummary = defaultSummary(reports, allActions);
  let llmUsed = false;
  if (isGroqEnabled() && allActions.length > 0) {
    const digest = reports
      .map((r) => `${r.agentName}: ${r.thoughts.slice(0, 2).join(" ")}`)
      .join("\n");
    const summary = await groqReason({
      system:
        "You are the Supervisor Agent of a smart factory. Given each specialized agent's short reasoning, return ONE plain-English sentence (max 30 words) explaining the plant's current top concern and what the agents are doing. No lists, no markdown.",
      user: `Snapshot: OEE=${(snap.oee * 100).toFixed(0)}%, WIP=${snap.wip}, bottleneck=${snap.bottleneckId || "none"}.\n\nAgent digests:\n${digest}`,
      temperature: 0.15,
      maxTokens: 90,
      timeoutMs: 4000,
    });
    if (summary) {
      executiveSummary = summary;
      llmUsed = true;
    }
  }

  if (rec.plan && !llmUsed) {
    executiveSummary = `${rec.plan.machineCode} failing — ${rec.plan.impact.summary}`;
  }

  return { reports, actions: allActions, executiveSummary, llmUsed, recovery: rec.plan };
}

function defaultSummary(reports: AgentReport[], actions: AgentAction[]): string {
  if (actions.length === 0) return "All specialized agents report nominal operation — no action taken this tick.";
  const named = new Set(actions.map((a) => a.agentName));
  return `${actions.length} action${actions.length > 1 ? "s" : ""} planned across ${named.size} agent${named.size > 1 ? "s" : ""} (${[...named].join(", ")}).`;
}
