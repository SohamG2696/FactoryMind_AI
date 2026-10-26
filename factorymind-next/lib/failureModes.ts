/**
 * Machine-specific failure modes and alarm limits.
 *
 * Every cell fails differently: the milling cutter wears out, the robot's joint
 * reducer starts to vibrate, the lathe's spindle bearing runs hot and rough, the
 * press's hydraulic oil overheats and the conveyor belt slips. Each failure mode
 * names the ONE parameter that drives it, the machine's own warning / critical
 * limits for that parameter, how the injected fault changes the simulated
 * telemetry, and what maintenance should do about it.
 *
 * Shared by the simulation (physics + status), the agents (diagnosis + plan)
 * and the UI (failing parameter + recommended actions). No client-only imports.
 */

export type FailureParam = "temperature" | "vibration" | "toolWear" | "speed";

export interface Limit {
  warn: number;
  crit: number;
}

/** Alarm limits for one machine. Speed is % of commanded speed and alarms when it drops BELOW the limit. */
export interface MachineLimits {
  temperature: Limit;
  vibration: Limit;
  toolWear: Limit;
  speed: Limit;
}

export interface FailureMode {
  key: string;
  label: string;
  component: string;
  /** The parameter whose drift causes (and reveals) this failure. */
  parameter: FailureParam;
  /** What that parameter is called on this machine. */
  parameterLabel: string;
  cause: string;
  /** Telemetry change at full development (progress = 1). */
  effect: {
    heat: number;      // °C added to the temperature target
    vib: number;       // mm/s added to vibration
    wear: number;      // wear % the component reaches
    speedLoss: number; // fraction of commanded speed lost (0..1)
  };
  tag: { developing: string; failed: string };
  recommendedActions: string[];
  repairAction: string;
  repairMinutes: number;
  breakdown: string;
}

export const PARAM_META: Record<FailureParam, { label: string; unit: string; below?: boolean; digits: number }> = {
  temperature: { label: "Temperature", unit: "°C", digits: 1 },
  vibration: { label: "Vibration", unit: "mm/s", digits: 2 },
  toolWear: { label: "Wear", unit: "%", digits: 0 },
  speed: { label: "Speed", unit: "% of commanded", below: true, digits: 0 },
};

const DEFAULT_LIMITS: MachineLimits = {
  temperature: { warn: 78, crit: 92 },
  vibration: { warn: 2.2, crit: 4.6 },
  toolWear: { warn: 70, crit: 90 },
  speed: { warn: 80, crit: 60 },
};

/** Per-machine limits (by sim machine id). */
export const MACHINE_LIMITS: Record<string, MachineLimits> = {
  cnc1: { ...DEFAULT_LIMITS, toolWear: { warn: 60, crit: 85 } },
  robot: { ...DEFAULT_LIMITS, temperature: { warn: 70, crit: 85 }, vibration: { warn: 1.8, crit: 3.5 } },
  cnc7: { ...DEFAULT_LIMITS, vibration: { warn: 2.2, crit: 4.5 } },
  press: { ...DEFAULT_LIMITS, temperature: { warn: 65, crit: 80 }, vibration: { warn: 2.5, crit: 5.0 } },
  conveyor: { ...DEFAULT_LIMITS, temperature: { warn: 72, crit: 88 }, vibration: { warn: 2.5, crit: 5.0 } },
};

/** Failure mode per production cell (by sim machine id). */
export const FAILURE_MODES: Record<string, FailureMode> = {
  cnc1: {
    key: "cutter_wear",
    label: "Cutter Wear / Tool Breakage",
    component: "End mill / cutting insert",
    parameter: "toolWear",
    parameterLabel: "Cutter wear",
    cause: "The cutting edge dulls; cutting forces, spindle heat and chatter rise until the tool chips or breaks.",
    effect: { heat: 4, vib: 0.6, wear: 95, speedLoss: 0 },
    tag: { developing: "CUTTER WEAR", failed: "TOOL BREAKAGE" },
    recommendedActions: [
      "Stop the spindle and replace the end mill / cutting insert",
      "Re-measure the tool-length offset and re-zero the work offset",
      "Check coolant concentration and nozzle flow",
      "Inspect the last parts for surface finish and dimensions",
    ],
    repairAction: "cutting tool replacement",
    repairMinutes: 15,
    breakdown: "cutting tool broke in the cut",
  },
  robot: {
    key: "joint_reducer",
    label: "Joint Reducer Backlash / Servo Vibration",
    component: "J2/J3 harmonic reducer & servo",
    parameter: "vibration",
    parameterLabel: "Arm joint vibration",
    cause: "Wear in the joint reducer adds backlash; the servo hunts, the arm vibrates and the motor heats up.",
    effect: { heat: 8, vib: 2.4, wear: 45, speedLoss: 0.1 },
    tag: { developing: "JOINT VIBRATION", failed: "REDUCER FAILURE" },
    recommendedActions: [
      "Stop the arm and lock out the cell (LOTO)",
      "Inspect the J2/J3 harmonic reducer for backlash and replace if worn",
      "Check servo motor current and encoder feedback",
      "Re-grease the joints and recalibrate the tool centre point",
    ],
    repairAction: "joint reducer replacement & recalibration",
    repairMinutes: 30,
    breakdown: "joint reducer seized — arm stopped mid-transfer",
  },
  cnc7: {
    key: "spindle_bearing",
    label: "Spindle Bearing Wear / Overheating",
    component: "Main spindle bearing",
    parameter: "vibration",
    parameterLabel: "Spindle bearing vibration",
    cause: "The bearing race wears; vibration rises first, then friction heat follows.",
    effect: { heat: 6, vib: 0.8, wear: 75, speedLoss: 0 },
    tag: { developing: "BEARING WEAR", failed: "BEARING FAILURE" },
    recommendedActions: [
      "Isolate CNC-07 and lock out the spindle (LOTO)",
      "Replace the main spindle bearing",
      "Check spindle lubrication / grease quantity",
      "Restart with a controlled run-in at ≤ 65 % load",
    ],
    repairAction: "spindle bearing replacement",
    repairMinutes: 25,
    breakdown: "spindle bearing seized",
  },
  press: {
    key: "hydraulic_overheat",
    label: "Hydraulic Oil Overheating / Seal Leak",
    component: "Hydraulic power unit, oil cooler & ram seals",
    parameter: "temperature",
    parameterLabel: "Hydraulic oil temperature",
    cause: "The oil cooler clogs and a ram seal leaks internally; oil temperature climbs and viscosity drops.",
    effect: { heat: 32, vib: 0.6, wear: 35, speedLoss: 0.05 },
    tag: { developing: "OIL OVERHEAT", failed: "HYDRAULIC FAILURE" },
    recommendedActions: [
      "Stop the pump and relieve system pressure",
      "Clean the oil cooler / heat exchanger and check the cooler fan",
      "Inspect ram and cylinder seals for leaks and replace them",
      "Check oil level and condition (ISO VG 46); top up or replace",
    ],
    repairAction: "oil cooler service & seal replacement",
    repairMinutes: 30,
    breakdown: "hydraulic oil overheated — pump tripped and ram seal blew",
  },
  conveyor: {
    key: "belt_slip",
    label: "Belt Slip / Drive Motor Overload",
    component: "Belt, drive roller & motor",
    parameter: "speed",
    parameterLabel: "Belt speed",
    cause: "The belt loses tension and slips on the drive roller; belt speed drops while the motor overheats.",
    effect: { heat: 14, vib: 0.9, wear: 40, speedLoss: 0.55 },
    tag: { developing: "BELT SLIP", failed: "BELT STALLED" },
    recommendedActions: [
      "Stop the belt and lock out the drive",
      "Re-tension the belt and check its tracking",
      "Inspect the drive roller lagging and idler rollers",
      "Check motor current and the overload relay",
    ],
    repairAction: "belt re-tension & drive roller service",
    repairMinutes: 20,
    breakdown: "belt stalled — drive motor tripped on overload",
  },
};

export function limitsFor(id: string): MachineLimits {
  return MACHINE_LIMITS[id] ?? DEFAULT_LIMITS;
}

export function failureModeFor(id: string): FailureMode {
  return FAILURE_MODES[id] ?? FAILURE_MODES.cnc7;
}

/** The telemetry fields the limits read. */
export interface Telemetry {
  temperature: number;
  vibration: number;
  toolWear: number;
  rpm: number;
  targetRpm?: number;
  /** Smoothed load 0..1 (utilization). */
  utilization: number;
  /** Ticks since the machine last started (0 while stopped). */
  runTicks?: number;
}

/** A drive needs ~10 s to reach commanded speed after a start — not judged as slipping meanwhile. */
const SPIN_UP_TICKS = 20;

/** Actual speed as % of the speed the controller commands at this load. */
export function speedPct(m: Telemetry): number {
  if (!m.targetRpm || (m.runTicks ?? 0) < SPIN_UP_TICKS) return 100;
  const commanded = m.targetRpm * (0.65 + m.utilization * 0.5);
  return commanded > 0 ? (m.rpm / commanded) * 100 : 100;
}

export function paramValue(m: Telemetry, p: FailureParam): number {
  if (p === "speed") return speedPct(m);
  return m[p];
}

export type Level = "ok" | "warn" | "crit";

export function paramLevel(value: number, p: FailureParam, lim: Limit): Level {
  if (PARAM_META[p].below) return value < lim.crit ? "crit" : value < lim.warn ? "warn" : "ok";
  return value > lim.crit ? "crit" : value > lim.warn ? "warn" : "ok";
}

export function formatParam(value: number, p: FailureParam): string {
  const meta = PARAM_META[p];
  return `${value.toFixed(meta.digits)} ${meta.unit}`;
}

/** "warn > 65 °C · critical > 80 °C" (or "<" for speed). */
export function formatLimits(p: FailureParam, lim: Limit): string {
  const op = PARAM_META[p].below ? "<" : ">";
  return `warning ${op} ${formatParam(lim.warn, p)} · critical ${op} ${formatParam(lim.crit, p)}`;
}

/** Live reading of a machine's failure parameter against its own limits. */
export function failingParameter(id: string, m: Telemetry) {
  const mode = failureModeFor(id);
  const lim = limitsFor(id)[mode.parameter];
  const value = paramValue(m, mode.parameter);
  return { mode, param: mode.parameter, label: mode.parameterLabel, value, limit: lim, level: paramLevel(value, mode.parameter, lim) };
}
