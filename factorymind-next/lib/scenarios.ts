/**
 * Scenario engine — runs a lightweight discrete-event sim in-memory to
 * quantify what-if impact. Uses the same physics constants as
 * useFactorySim.ts but strips the visual state so we can spin up
 * thousands of ticks in milliseconds.
 *
 * Every scenario has a "baseline" run (no intervention) and a "with AI"
 * run (agent responds to critical machines). We return before/after
 * KPIs so the UI can compare.
 */

export interface ScenarioInput {
  scenario: "cnc_failure" | "press_failure" | "agv_failure" | "worker_shortage"
    | "raw_shortage" | "production_surge" | "overheating" | "multi_fault";
  durationTicks?: number; // default 200
  aiEnabled: boolean;
}

export interface ScenarioResult {
  scenario: string;
  aiEnabled: boolean;
  durationTicks: number;
  oee: number;
  throughputPerHour: number;
  downtimeMinutes: number;
  totalProduced: number;
  humanInterventions: number;
  criticalIncidents: number;
  peakBottleneck: string | null;
}

interface SimMachine {
  code: string;
  health: number;
  temperature: number;
  vibration: number;
  toolWear: number;
  queue: number;
  capacity: number;
  produced: number;
  downtimeTicksLeft: number;
  isBottleneck: boolean;
}

const CHAIN = ["CELL-06", "CELL-01", "CELL-02", "CELL-04", "CELL-05", "CELL-03"];

function seed(): SimMachine[] {
  return CHAIN.map((c) => ({
    code: c,
    health: 96,
    temperature: 42,
    vibration: 0.4,
    toolWear: 0,
    queue: c === "CELL-06" ? 40 : 4,
    capacity: c === "CELL-06" ? 999 : 30,
    produced: 0,
    downtimeTicksLeft: 0,
    isBottleneck: false,
  }));
}

function applyScenario(machines: SimMachine[], scenario: string, tick: number) {
  if (scenario === "cnc_failure" && tick > 20) {
    const cnc = machines.find((m) => m.code === "CELL-04");
    if (cnc) { cnc.toolWear += 1.5; cnc.temperature += 0.4; }
  } else if (scenario === "press_failure" && tick > 20) {
    const p = machines.find((m) => m.code === "CELL-05");
    if (p) { p.vibration += 0.15; p.temperature += 0.3; }
  } else if (scenario === "overheating" && tick > 15) {
    machines.forEach((m) => (m.temperature += 0.3));
  } else if (scenario === "production_surge") {
    const first = machines.find((m) => m.code === "CELL-01");
    if (first) first.queue = Math.min(first.capacity, first.queue + 2);
  } else if (scenario === "raw_shortage" && tick > 25) {
    const wh = machines.find((m) => m.code === "CELL-06");
    if (wh) wh.queue = Math.max(0, wh.queue - 3);
  } else if (scenario === "multi_fault" && tick > 30) {
    machines.forEach((m) => {
      m.toolWear += 0.8;
      m.temperature += 0.2;
    });
  }
  // agv_failure & worker_shortage handled by lowering AI mitigation cap
}

function tickPhysics(machines: SimMachine[]) {
  for (let i = 0; i < machines.length; i++) {
    const m = machines[i];
    if (m.downtimeTicksLeft > 0) {
      m.downtimeTicksLeft--;
      m.temperature += (24 - m.temperature) * 0.15;
      m.health = Math.min(100, m.health + 4);
      m.toolWear = Math.max(0, m.toolWear - 3);
      m.vibration *= 0.8;
      continue;
    }
    const util = Math.min(1, m.queue / m.capacity);
    m.temperature += (44 + util * 45 + m.toolWear * 0.3 - m.temperature) * 0.06;
    m.vibration = 0.4 + m.toolWear * 0.03 + util * 0.9 + (m.temperature > 85 ? 1.2 : 0);
    m.toolWear = Math.min(100, m.toolWear + util * 0.15 + (m.temperature > 82 ? 0.08 : 0));
    const raw = 100 - m.toolWear * 0.45 - Math.max(0, m.temperature - 70) * 1.3 - Math.max(0, m.vibration - 2) * 5;
    m.health = m.health * 0.85 + raw * 0.15;

    if (m.health < 25 && m.downtimeTicksLeft === 0) {
      m.downtimeTicksLeft = 24; // hard failure
    }

    // Consumption
    if (m.code !== "CELL-06" && m.queue > 0 && Math.random() < m.health / 100) {
      m.queue--;
      m.produced++;
      const nextIdx = i + 1;
      if (nextIdx < machines.length) {
        const nx = machines[nextIdx];
        if (nx.queue < nx.capacity + 20) nx.queue++;
      }
    }
    // Warehouse dispatch
    if (m.code === "CELL-06" && m.queue > 0 && Math.random() < 0.7) {
      m.queue--;
      const cnc1 = machines.find((mm) => mm.code === "CELL-01");
      if (cnc1 && cnc1.queue < cnc1.capacity) cnc1.queue++;
    }
    if (m.code === "CELL-06") m.queue = Math.min(999, m.queue + 2);
  }
}

/** Simple AI mitigation — if a machine crosses predictive threshold and
 *  we're allowed to dispatch a technician, schedule a controlled downtime
 *  BEFORE it becomes a hard failure. Cheaper than full multi-agent for
 *  a scenario evaluator. */
function aiMitigate(machines: SimMachine[], workerCap: number, activeInterventions: { count: number; total: number }) {
  for (const m of machines) {
    if (activeInterventions.count >= workerCap) break;
    if (m.downtimeTicksLeft > 0) continue;
    if (m.health < 55 || m.toolWear > 80) {
      m.downtimeTicksLeft = 20;
      m.toolWear = 0;
      activeInterventions.count++;
      activeInterventions.total++;
    }
  }
}

export function runScenario(input: ScenarioInput): ScenarioResult {
  const ticks = input.durationTicks || 200;
  const machines = seed();
  let totalProduced = 0;
  let downtimeTicks = 0;
  let criticalIncidents = 0;
  const workerCap = input.scenario === "worker_shortage" ? 1 : 2;
  const activeInterventions = { count: 0, total: 0 };
  const oeeSamples: number[] = [];
  const bottleneckCounts = new Map<string, number>();

  for (let tick = 0; tick < ticks; tick++) {
    applyScenario(machines, input.scenario, tick);

    // Snapshot criticals BEFORE physics tick
    for (const m of machines) if (m.health < 45) criticalIncidents++;

    // AI mitigation phase (only if enabled) — reduces failures
    if (input.aiEnabled) aiMitigate(machines, workerCap, activeInterventions);

    tickPhysics(machines);

    // Decrement active interventions when machines come back online
    activeInterventions.count = machines.filter((m) => m.downtimeTicksLeft > 0).length;

    // Sample OEE + downtime
    const down = machines.filter((m) => m.downtimeTicksLeft > 0).length;
    downtimeTicks += down;
    const avgHealth = machines.reduce((s, m) => s + m.health, 0) / machines.length;
    const oee = Math.max(0, Math.min(1, (1 - down / machines.length) * 0.5 + (avgHealth / 100) * 0.5));
    oeeSamples.push(oee);

    // Bottleneck
    let btl = { code: "", score: 0 };
    for (const m of machines) {
      if (m.code === "CELL-06") continue;
      const score = (m.queue / m.capacity) * (m.queue + 1);
      if (score > btl.score) btl = { code: m.code, score };
    }
    if (btl.code) bottleneckCounts.set(btl.code, (bottleneckCounts.get(btl.code) || 0) + 1);

    // Count produced from last chain step
    const conveyor = machines[machines.length - 1];
    if (conveyor.produced > totalProduced) totalProduced = conveyor.produced;
  }

  // Convert ticks to sim minutes (30s per tick × 60 = 30 sim-min per 60 real-sec, so 1 tick = 0.5 sim min)
  const simMinutesTotal = ticks * 0.5;
  const throughputPerHour = Math.round((totalProduced / simMinutesTotal) * 60);
  const avgOee = oeeSamples.reduce((s, x) => s + x, 0) / oeeSamples.length;
  const downtimeMinutes = downtimeTicks * 0.5 / machines.length;
  const peakBottleneck = [...bottleneckCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    scenario: input.scenario,
    aiEnabled: input.aiEnabled,
    durationTicks: ticks,
    oee: Number(avgOee.toFixed(3)),
    throughputPerHour,
    downtimeMinutes: Number(downtimeMinutes.toFixed(1)),
    totalProduced,
    humanInterventions: activeInterventions.total,
    criticalIncidents,
    peakBottleneck,
  };
}
