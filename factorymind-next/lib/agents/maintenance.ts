import type { AgentReport, PlantSnapshot, MlPredictionMap, SupervisorContext } from "./types";
import { MACHINE_REQUIREMENTS } from "../seedWorkers";

/**
 * Maintenance Agent — combines sim health + ML failure probability to
 * decide when a machine needs proactive intervention. Every recommendation
 * gets HUMAN_REQUIRED autonomy since actual repair needs a technician.
 */
export function maintenanceAgent(
  snap: PlantSnapshot,
  ml: MlPredictionMap,
  supervisors: SupervisorContext[],
  openMissionMachines: Set<string>
): AgentReport {
  const thoughts: string[] = [];
  const actions: AgentReport["actions"] = [];

  const supFor = (code: string) =>
    supervisors.find((s) => (s.assignedMachines || []).includes(code))?.id;

  for (const m of snap.machines) {
    if (m.status === "downtime") continue;
    if (openMissionMachines.has(m.code)) continue; // don't double-book

    const pred = ml[m.code];
    const failProb = pred?.failureProbability ?? 0;
    const highML = failProb > 0.55;
    const critHealth = m.health < 45 || m.temperature > 90 || m.vibration > 4.5;
    const warnZone = m.toolWear > 75 || m.health < 65;

    if (highML || critHealth) {
      const req = MACHINE_REQUIREMENTS[m.code];
      actions.push({
        tool: "create_mission",
        args: {
          machineCode: m.code,
          priority: critHealth ? "critical" : "high",
          type: "predictive_maintenance",
          requiredSkills: req?.skills || ["mechanical"],
          requiredCertifications: req?.certifications || [],
          agentReasoning:
            `Health ${m.health.toFixed(0)}%, temp ${m.temperature.toFixed(1)}°C, ` +
            `vib ${m.vibration.toFixed(2)}mm/s, wear ${m.toolWear.toFixed(0)}%. ` +
            `ML failure probability ${(failProb * 100).toFixed(1)}% (${pred?.riskLevel || "n/a"}).`,
          mlPrediction: pred,
          expectedImpact: {
            downtimeMinutes: 8,
            productionLossUnits: 3,
          },
        },
        reason: `${m.code}: ML ${(failProb * 100).toFixed(0)}%, health ${m.health.toFixed(0)}%`,
        autonomyLevel: "HUMAN_REQUIRED",
        agentName: "MaintenanceAgent",
        targetSupervisorId: supFor(m.code),
        createMissionType: "predictive_maintenance",
      });
      thoughts.push(
        `${m.code} predictive maintenance recommended (ML ${(failProb * 100).toFixed(0)}%, health ${m.health.toFixed(0)}%).`
      );
    } else if (warnZone) {
      actions.push({
        tool: "raise_operator_alert",
        args: {
          severity: "warn",
          machineCode: m.code,
          title: `${m.code} approaching maintenance threshold`,
          body: `Tool wear ${m.toolWear.toFixed(0)}%, health ${m.health.toFixed(0)}%. Schedule intervention at next shift changeover.`,
        },
        reason: `${m.code} in degrading trend`,
        autonomyLevel: "SAFE",
        agentName: "MaintenanceAgent",
        targetSupervisorId: supFor(m.code),
      });
    }
  }

  if (actions.length === 0) {
    thoughts.push("No machines outside maintenance envelope.");
  }
  return { agentName: "MaintenanceAgent", thoughts, actions };
}
