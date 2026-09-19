/**
 * Types shared across the multi-agent system. This is the contract that
 * every specialized agent (Production/Maintenance/Material/Workforce/
 * Safety) speaks and that the Supervisor Agent orchestrates against.
 */

export type AutonomyLevel = "SAFE" | "APPROVAL_REQUIRED" | "HUMAN_REQUIRED";
export type Phase = "observe" | "predict" | "reason" | "plan" | "act" | "verify";

export interface MachineSnap {
  id: string;
  code: string;
  label: string;
  status: "healthy" | "warning" | "critical" | "downtime";
  health: number;
  temperature: number;
  vibration: number;
  toolWear: number;
  queue: number;
  utilization: number;
  rpm: number;
}

export interface AgvSnap {
  id: string;
  code: string;
  status: string;
  from: string;
  to: string;
}

export interface PlantSnapshot {
  tick: number;
  wallClock: string;
  machines: MachineSnap[];
  agvs: AgvSnap[];
  activeAgvs: number;
  totalAgvs: number;
  bottleneckId: string | null;
  wip: number;
  oee: number;
  currentPartId: string;
  /** Active worker missions the agent has open (from Mongo). */
  activeMissionMachineCodes?: string[];
}

export type ToolName =
  | "dispatch_maintenance"
  | "raise_operator_alert"
  | "redirect_agv"
  | "throttle_upstream"
  | "increase_buffer"
  | "schedule_maintenance"
  | "assign_worker"
  | "release_worker"
  | "request_human_approval"
  | "pause_machine"
  | "resume_machine"
  | "reroute_material"
  | "create_mission"
  | "note";

export interface AgentAction {
  tool: ToolName;
  args: Record<string, any>;
  reason: string;
  autonomyLevel: AutonomyLevel;
  targetSupervisorId?: string;
  agentName: string;
  createMissionType?:
    | "predictive_maintenance"
    | "corrective_maintenance"
    | "material_dispatch"
    | "quality_inspection"
    | "safety_stop";
}

export interface AgentReport {
  agentName: string;
  thoughts: string[];
  actions: AgentAction[];
}

/** ML predictions attached to a snapshot before agents reason. */
export interface MlPredictionMap {
  [machineCode: string]: {
    failureProbability: number;
    riskLevel: string;
    confidence: number;
    recommendation?: string;
  };
}

export interface SupervisorContext {
  id: string;
  name: string;
  assignedMachines?: string[];
}
