import type { MachineState } from "@/hooks/useFactorySim";
import { limitsFor, speedPct } from "@/lib/failureModes";

/**
 * What each production cell is and what its operator checks. Telemetry is the
 * same simulated signals for every machine (speed, temperature, vibration,
 * wear, queue); the profile names them in the cell's own terms and defines the
 * cell-specific checks the operator works through, against the machine's own
 * warning limits (lib/failureModes.ts).
 */

export interface CellCheck {
  label: string;
  /** Live evaluation against the machine (and its neighbours). */
  ok: (m: MachineState, ctx: { upstream?: MachineState; downstream?: MachineState }) => boolean;
  detail: (m: MachineState, ctx: { upstream?: MachineState; downstream?: MachineState }) => string;
}

export interface CellProfile {
  role: string;
  task: string;
  speedLabel: string;
  speedUnit: string;
  wearLabel: string;
  queueLabel: string;
  /** Charts to show for this cell, in order. */
  charts: ("temp" | "vib" | "health" | "speed" | "wear" | "queue")[];
  checks: CellCheck[];
}

const lim = limitsFor;
const tempCheck = (part: string, limit: number): CellCheck => ({
  label: `${part} temperature below ${limit} °C`,
  ok: (m) => m.temperature < limit,
  detail: (m) => `${m.temperature.toFixed(1)} °C`,
});
const vibCheck = (part: string, limit: number): CellCheck => ({
  label: `${part} vibration below ${limit} mm/s`,
  ok: (m) => m.vibration < limit,
  detail: (m) => `${m.vibration.toFixed(2)} mm/s`,
});
const wearCheck = (part: string, limit: number): CellCheck => ({
  label: `${part} below ${limit}%`,
  ok: (m) => m.toolWear < limit,
  detail: (m) => `${m.toolWear.toFixed(0)}%`,
});
const fedCheck = (what: string): CellCheck => ({
  label: `${what} available`,
  ok: (m) => m.queue > 0,
  detail: (m) => `${m.queue} waiting`,
});
const outletCheck = (next: string): CellCheck => ({
  label: `Output not blocked by ${next}`,
  ok: (_m, { downstream }) => !downstream || downstream.queue < downstream.capacity,
  detail: (_m, { downstream }) => (downstream ? `${downstream.code} queue ${downstream.queue}/${downstream.capacity}` : "to finished goods"),
});

export const CELL_PROFILES: Record<string, CellProfile> = {
  warehouse: {
    role: "Automated storage & retrieval — first station of the line",
    task: "Keep raw-material stock above the reorder level and dispatch blanks to CNC-01 via AGV-01.",
    speedLabel: "Shuttle drive",
    speedUnit: "rpm",
    wearLabel: "Shuttle wear",
    queueLabel: "Stock on hand",
    charts: ["queue", "temp", "health", "wear"],
    checks: [
      { label: "Stock above reorder level (100 blanks)", ok: (m) => m.queue >= 100, detail: (m) => `${m.queue} blanks` },
      { label: "CNC-01 is receiving blanks", ok: (_m, { downstream }) => !!downstream && downstream.queue > 0, detail: (_m, { downstream }) => `CNC-01 queue ${downstream?.queue ?? 0}` },
      tempCheck("Shuttle motor", lim("warehouse").temperature.warn),
      wearCheck("Shuttle rail wear", lim("warehouse").toolWear.warn),
    ],
  },
  cnc1: {
    role: "CNC milling — first machining operation",
    task: "Mill raw blanks to spec and keep the robotic arm supplied.",
    speedLabel: "Spindle speed",
    speedUnit: "RPM",
    wearLabel: "Cutter wear",
    queueLabel: "Blanks waiting",
    charts: ["temp", "vib", "health", "speed", "wear"],
    checks: [
      tempCheck("Spindle", lim("cnc1").temperature.warn),
      vibCheck("Spindle", lim("cnc1").vibration.warn),
      wearCheck("Cutter wear", lim("cnc1").toolWear.warn),
      fedCheck("Blanks from AS/RS"),
      outletCheck("the robotic arm"),
    ],
  },
  robot: {
    role: "6-axis robotic transfer between milling and turning",
    task: "Transfer milled parts to the CNC-07 lathe (AGV-02 lane) without stalling the cell.",
    speedLabel: "Joint drive speed",
    speedUnit: "rpm",
    wearLabel: "Gripper / joint wear",
    queueLabel: "Parts to transfer",
    charts: ["temp", "vib", "health", "speed", "wear"],
    checks: [
      tempCheck("Joint servo", lim("robot").temperature.warn),
      vibCheck("Arm joint", lim("robot").vibration.warn),
      wearCheck("Gripper wear", lim("robot").toolWear.warn),
      fedCheck("Milled parts"),
      outletCheck("CNC-07"),
    ],
  },
  cnc7: {
    role: "CNC heavy turning — main spindle bearing is the critical component",
    task: "Turn parts on the heavy lathe; watch spindle bearing heat and vibration.",
    speedLabel: "Spindle speed",
    speedUnit: "RPM",
    wearLabel: "Bearing / tool wear",
    queueLabel: "Parts waiting",
    charts: ["temp", "vib", "health", "speed", "wear"],
    checks: [
      tempCheck("Spindle bearing", lim("cnc7").temperature.warn),
      vibCheck("Spindle bearing", lim("cnc7").vibration.warn),
      wearCheck("Bearing / tool wear", lim("cnc7").toolWear.warn),
      fedCheck("Parts from the robotic arm"),
      outletCheck("the hydraulic press"),
    ],
  },
  press: {
    role: "Hydraulic forming press",
    task: "Form turned parts; watch hydraulic oil temperature and ram vibration.",
    speedLabel: "Pump speed",
    speedUnit: "rpm",
    wearLabel: "Seal / die wear",
    queueLabel: "Parts waiting",
    charts: ["temp", "vib", "health", "speed", "wear"],
    checks: [
      tempCheck("Hydraulic oil", lim("press").temperature.warn),
      vibCheck("Ram", lim("press").vibration.warn),
      wearCheck("Seal / die wear", lim("press").toolWear.warn),
      fedCheck("Turned parts"),
      outletCheck("the outfeed conveyor"),
    ],
  },
  lathe2: {
    role: "Standby CNC lathe — backup capacity for CNC-07",
    task: "Idle until the AI reroutes CNC-07 work here; then turn parts at ~70% of CNC-07's rate.",
    speedLabel: "Spindle speed",
    speedUnit: "RPM",
    wearLabel: "Tool wear",
    queueLabel: "Rerouted parts",
    charts: ["queue", "temp", "vib", "health", "speed"],
    checks: [tempCheck("Spindle", lim("lathe2").temperature.warn), vibCheck("Spindle", lim("lathe2").vibration.warn), wearCheck("Tool wear", lim("lathe2").toolWear.warn)],
  },
  conveyor: {
    role: "Outfeed conveyor and final QA scan point",
    task: "Move finished parts to finished goods and flag anything that fails the scan.",
    speedLabel: "Belt drive",
    speedUnit: "rpm",
    wearLabel: "Belt wear",
    queueLabel: "Parts on belt",
    charts: ["queue", "temp", "vib", "health", "wear"],
    checks: [
      tempCheck("Belt drive motor", lim("conveyor").temperature.warn),
      vibCheck("Belt", lim("conveyor").vibration.warn),
      wearCheck("Belt wear", lim("conveyor").toolWear.warn),
      {
        label: `Belt speed at least ${lim("conveyor").speed.warn}% of commanded`,
        ok: (m) => !!m.isolated || m.status === "downtime" || speedPct(m) >= lim("conveyor").speed.warn,
        detail: (m) => `${speedPct(m).toFixed(0)}%`,
      },
      { label: "Belt not overloaded", ok: (m) => m.queue < m.capacity, detail: (m) => `${m.queue}/${m.capacity} parts` },
    ],
  },
};

export function profileFor(m: MachineState): CellProfile {
  return CELL_PROFILES[m.id] ?? CELL_PROFILES.cnc1;
}
