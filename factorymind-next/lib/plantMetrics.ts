import type { MachineState, SimState } from "@/hooks/useFactorySim";
import type { MlPredictionMap } from "@/lib/agents/types";
import type { MlHealth } from "@/hooks/useMlHealth";

/** Live signals streamed per cell by the simulation: temperature, RPM, vibration, tool wear. */
export const SIGNALS_PER_CELL = 4;

export interface PlantSummary {
  totalCells: number;
  runningCells: number;
  avgHealth: number;
  criticalCells: number;
  warningCells: number;
  /** Production cells (excludes the warehouse) — the ones the ML models score. */
  productionCells: MachineState[];
  riskiest: MachineState | undefined;
  avgFailureProbability: number | null;
  /** True when at least one prediction came from the real LightGBM + RF models. */
  mlLive: boolean;
}

export function summarizePlant(state: SimState, ml: MlPredictionMap): PlantSummary {
  // The standby lathe only counts while it is running rerouted work.
  const cells = state.machines.filter((m) => !m.standby || m.statusText !== "Standby");
  const productionCells = cells.filter((m) => m.kind !== "warehouse");
  const preds = productionCells.map((m) => ml[m.code]).filter(Boolean);

  // Riskiest: highest ML failure probability, ties (or no predictions yet) broken by lowest health.
  const riskiest = productionCells.slice().sort((a, b) => {
    const pa = ml[a.code]?.failureProbability;
    const pb = ml[b.code]?.failureProbability;
    if (pa !== undefined && pb !== undefined && pa !== pb) return pb - pa;
    return a.health - b.health;
  })[0];

  return {
    totalCells: cells.length,
    runningCells: cells.filter((m) => m.status !== "downtime").length,
    avgHealth: cells.reduce((sum, m) => sum + m.health, 0) / Math.max(1, cells.length),
    criticalCells: cells.filter((m) => m.status === "critical" || m.status === "downtime").length,
    warningCells: cells.filter((m) => m.status === "warning").length,
    productionCells,
    riskiest,
    avgFailureProbability: preds.length
      ? preds.reduce((sum, p) => sum + p.failureProbability, 0) / preds.length
      : null,
    mlLive: preds.some((p) => p.source === "ml-service"),
  };
}

/** Short label for where predictions are coming from right now. */
export function mlSourceLabel(health: MlHealth, mlLive: boolean): string {
  if (health.online === null) return "Connecting to ML service…";
  if (mlLive) return "Live · FastAPI ML service";
  if (health.source === "python_cli") return "Models loaded · Python CLI";
  if (health.online) return "ML service online";
  return "ML service offline · analytical fallback";
}

export function formatAccuracy(health: MlHealth): string {
  return health.accuracy !== null ? `${(health.accuracy * 100).toFixed(1)}%` : "—";
}
