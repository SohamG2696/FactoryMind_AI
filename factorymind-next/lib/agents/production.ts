import type { AgentReport, PlantSnapshot, SupervisorContext } from "./types";

/** Production Agent — watches queues, WIP, throughput, bottleneck. */
export function productionAgent(
  snap: PlantSnapshot,
  supervisors: SupervisorContext[]
): AgentReport {
  const thoughts: string[] = [];
  const actions: AgentReport["actions"] = [];

  const supFor = (code: string) =>
    supervisors.find((s) => (s.assignedMachines || []).includes(code))?.id;

  // OEE drop → surface the bottleneck
  if (snap.oee < 0.7 && snap.bottleneckId) {
    const btl = snap.machines.find((m) => m.id === snap.bottleneckId);
    if (btl) {
      actions.push({
        tool: "raise_operator_alert",
        args: {
          severity: "warn",
          machineCode: btl.code,
          title: `OEE ${(snap.oee * 100).toFixed(0)}% — bottleneck at ${btl.code}`,
          body: `${btl.label} at ${(btl.utilization * 100).toFixed(0)}% utilization with ${btl.queue} in queue. Consider throttling upstream.`,
        },
        reason: `Plant OEE below target, bottleneck ${btl.code}`,
        autonomyLevel: "SAFE",
        agentName: "ProductionAgent",
        targetSupervisorId: supFor(btl.code),
      });
      thoughts.push(`Bottleneck detected at ${btl.code}.`);
    }
  }

  // Queue overflow on non-warehouse cells
  for (const m of snap.machines) {
    if (m.code === "CELL-06") continue;
    if (m.queue >= 22 && m.status !== "downtime") {
      actions.push({
        tool: "throttle_upstream",
        args: { machineCode: m.code, factor: 0.7 },
        reason: `${m.code} queue ${m.queue} → throttle upstream 30%`,
        autonomyLevel: "SAFE",
        agentName: "ProductionAgent",
        targetSupervisorId: supFor(m.code),
      });
      thoughts.push(`${m.code} queue high — throttling upstream.`);
    }
  }

  if (actions.length === 0) thoughts.push("Production line balanced.");
  return { agentName: "ProductionAgent", thoughts, actions };
}
