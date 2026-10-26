import type { AgentReport, PlantSnapshot, MlPredictionMap, SupervisorContext, MachineSnap } from "./types";
import { MACHINE_REQUIREMENTS } from "../seedWorkers";
import { failingParameter, formatParam, limitsFor } from "../failureModes";

/**
 * Maintenance Agent — combines sim health + ML failure probability to
 * decide when a machine needs proactive intervention. Every recommendation
 * gets HUMAN_REQUIRED autonomy since actual repair needs a technician.
 */
/**
 * Rule-based diagnosis against the machine's OWN failure signature and limits
 * (lib/failureModes.ts): the failing parameter is named first, then the other
 * signals that are outside this machine's normal range.
 */
export function diagnose(m: MachineSnap) {
  const lim = limitsFor(m.id);
  const fp = failingParameter(m.id, m);
  const evidence: string[] = [];
  if (fp.level !== "ok") {
    const which = fp.level === "crit" ? "critical" : "warning";
    evidence.push(`${fp.label} ${formatParam(fp.value, fp.param)} past the ${m.code} ${which} limit (${formatParam(fp.level === "crit" ? fp.limit.crit : fp.limit.warn, fp.param)})`);
  }
  if (fp.param !== "vibration" && m.vibration > lim.vibration.warn) evidence.push(`Vibration ${m.vibration.toFixed(2)} mm/s above the ${lim.vibration.warn} mm/s limit`);
  if (fp.param !== "temperature" && m.temperature > lim.temperature.warn) evidence.push(`Temperature ${m.temperature.toFixed(1)} °C above the ${lim.temperature.warn} °C limit`);
  if (fp.param !== "toolWear" && m.toolWear > lim.toolWear.warn) evidence.push(`Wear at ${m.toolWear.toFixed(0)}% and rising`);
  if (m.health < 72) evidence.push(`Health down to ${m.health.toFixed(0)}%`);
  // The machine's own failure mode when its failure parameter has drifted; otherwise a generic finding.
  const hot = m.temperature > lim.temperature.warn;
  const diagnosis = fp.level !== "ok" ? fp.mode.label : hot ? "Thermal overload" : "Mechanical degradation";
  return {
    diagnosis,
    evidence,
    failingParameter: fp.level !== "ok" ? { key: fp.param, label: fp.label, value: fp.value, level: fp.level } : null,
    recommendedActions: fp.level !== "ok" ? fp.mode.recommendedActions : ["Inspect the cell and its last maintenance record"],
    repairAction: fp.level !== "ok" ? fp.mode.repairAction : "general repair",
  };
}

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
    const lim = limitsFor(m.id);
    const critHealth =
      m.health < 45 || m.temperature > lim.temperature.crit || m.vibration > lim.vibration.crit ||
      failingParameter(m.id, m).level === "crit";
    const warnZone = m.toolWear > 75 || m.health < 65;

    if (highML || critHealth) {
      const req = MACHINE_REQUIREMENTS[m.code];
      const { diagnosis, evidence, failingParameter: fParam, recommendedActions, repairAction } = diagnose(m);
      if (highML) evidence.push(`ML failure probability ${(failProb * 100).toFixed(1)}% above the 55% threshold`);
      const plan = [
        { step: `Isolate and stop ${m.code}`, autonomy: "APPROVAL_REQUIRED" },
        { step: "Create maintenance mission", autonomy: "SAFE" },
        { step: "Assign best-matched technician (Workforce Agent)", autonomy: "SAFE" },
        { step: `${repairAction[0].toUpperCase()}${repairAction.slice(1)} (simulated repair)`, autonomy: "HUMAN_REQUIRED" },
        { step: "Verify temperature, vibration, health and ML risk", autonomy: "SAFE" },
        { step: "Resume production", autonomy: "SAFE" },
      ];
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
            `ML failure probability ${(failProb * 100).toFixed(1)}% (${pred?.riskLevel || "n/a"}). ` +
            `Diagnosis: ${diagnosis}.`,
          diagnosis,
          evidence,
          failingParameter: fParam,
          recommendedActions,
          plan,
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
      // Repair on a running spindle is unsafe — ask a supervisor to isolate it first.
      actions.push({
        tool: "pause_machine",
        args: {
          machineCode: m.code,
          purpose: "isolate_for_maintenance",
          diagnosis,
          evidence,
          failingParameter: fParam,
          recommendedActions,
          failureProbability: failProb,
        },
        reason: `Isolate ${m.code} before repair — ${diagnosis.toLowerCase()}${fParam ? `, ${fParam.label.toLowerCase()} ${formatParam(fParam.value, fParam.key)}` : ""} (ML ${(failProb * 100).toFixed(0)}%, health ${m.health.toFixed(0)}%)`,
        autonomyLevel: "APPROVAL_REQUIRED",
        agentName: "MaintenanceAgent",
        targetSupervisorId: supFor(m.code),
      });
      thoughts.push(
        `${m.code}: ${diagnosis.toLowerCase()} — ${evidence.join("; ")}.`,
        `${m.code} predictive maintenance recommended (ML ${(failProb * 100).toFixed(0)}%, health ${m.health.toFixed(0)}%); isolation needs supervisor approval.`
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
