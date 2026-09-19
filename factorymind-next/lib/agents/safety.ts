import type { AgentReport, PlantSnapshot, SupervisorContext } from "./types";

/** Safety Agent — trips a pause_machine + escalation when a cell crosses
 *  dangerous thermal/vibration thresholds. Never autonomous — always
 *  APPROVAL_REQUIRED so a supervisor sees it. */
export function safetyAgent(
  snap: PlantSnapshot,
  supervisors: SupervisorContext[]
): AgentReport {
  const thoughts: string[] = [];
  const actions: AgentReport["actions"] = [];

  const supFor = (code: string) =>
    supervisors.find((s) => (s.assignedMachines || []).includes(code))?.id;

  for (const m of snap.machines) {
    if (m.temperature > 95 || m.vibration > 5.5) {
      actions.push({
        tool: "pause_machine",
        args: {
          machineId: m.id,
          machineCode: m.code,
          reason: `T=${m.temperature.toFixed(1)}°C vib=${m.vibration.toFixed(2)}mm/s — safety threshold breached`,
        },
        reason: `${m.code} exceeds safe operating envelope`,
        autonomyLevel: "APPROVAL_REQUIRED",
        agentName: "SafetyAgent",
        targetSupervisorId: supFor(m.code),
      });
      thoughts.push(`⚠ ${m.code} safety-threshold breach — pause requires approval.`);
    }
  }

  if (actions.length === 0) thoughts.push("All cells within safety envelope.");
  return { agentName: "SafetyAgent", thoughts, actions };
}
