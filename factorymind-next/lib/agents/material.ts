import type { AgentReport, PlantSnapshot } from "./types";

/** Material Flow Agent — currently monitors AGV utilization and warehouse
 *  supply. Future: redirect_agv when a cell is starved. */
export function materialAgent(snap: PlantSnapshot): AgentReport {
  const thoughts: string[] = [];
  const actions: AgentReport["actions"] = [];

  const idleAgvs = snap.agvs.filter((a) => a.status !== "moving").length;
  if (idleAgvs === snap.totalAgvs) {
    thoughts.push("All AGVs idle — no material flow this tick.");
  } else {
    thoughts.push(`${snap.activeAgvs}/${snap.totalAgvs} AGVs in motion.`);
  }

  // Warehouse-first-cell starvation check
  const wh = snap.machines.find((m) => m.code === "CELL-06");
  const first = snap.machines.find((m) => m.code === "CELL-01");
  if (wh && first && first.queue < 3 && wh.queue > 20 && first.status !== "downtime") {
    actions.push({
      tool: "reroute_material",
      args: { fromCode: "CELL-06", toCode: "CELL-01" },
      reason: `CELL-01 queue ${first.queue}, warehouse holds ${wh.queue} → prioritize dispatch`,
      autonomyLevel: "SAFE",
      agentName: "MaterialAgent",
    });
    thoughts.push("CNC-01 starving → prioritized warehouse dispatch.");
  }

  return { agentName: "MaterialAgent", thoughts, actions };
}
