"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MachineKind = "cnc" | "robot" | "conveyor" | "press" | "warehouse";
export type MachineStatus = "healthy" | "warning" | "critical" | "downtime";
export type EventCategory = "machine" | "agv" | "flow" | "alert" | "ai" | "workforce" | "safety";
export type AgvStatus = "moving" | "loading" | "unloading" | "idle";

/* v2.0 — active workers on the floor (only present while on a mission) */
export type ActiveWorkerStatus = "moving" | "on_task" | "verifying";
export interface ActiveWorker {
  id: string;               // e.g. "W04"
  name: string;
  x: number;                // world coords, animated
  y: number;
  targetMachineCode: string;
  targetX: number;
  targetY: number;
  status: ActiveWorkerStatus;
  missionId?: string;
  progress: number;         // 0..1 across "moving" then across "on_task"
  taskTicksTotal: number;   // duration of on_task phase
  taskTicksLeft: number;
  arrivedAt?: number;
}

export interface HistoryPoint {
  t: number;
  temp: number;
  rpm: number;
  vib: number;
}

export interface MachineState {
  id: string;
  code: string;
  label: string;
  shortLabel: string;
  kind: MachineKind;
  x: number; // world coords in the floor SVG (0..1200)
  y: number; // world coords (0..640)
  status: MachineStatus;
  statusText: string;
  temperature: number;
  ambient: number;
  rpm: number;
  targetRpm: number;
  vibration: number;
  toolWear: number;
  health: number;
  load: number;
  queue: number;
  capacity: number;
  produced: number;
  throughput: number;
  utilization: number;
  downtimeTicksLeft: number;
  history: HistoryPoint[];
  faultTag?: string;
}

export interface AGV {
  id: string;
  code: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  fromStation: string;
  toStation: string;
  routeIndex: number;
  progress: number; // 0..1 along current leg
  ticksPerLeg: number;
  cargoPartId: string | null;
  status: AgvStatus;
  currentAction: string; // e.g. "Moving to CNC-01"
}

export interface SimEvent {
  t: number;
  wallClock: string;
  msg: string;
  kind: "info" | "warn" | "crit" | "ok";
  category: EventCategory;
  machineId?: string;
  agvId?: string;
  partId?: string;
  icon?: string;
}

export interface CurrentPart {
  id: string;
  name: string;
  enteredTick: number;
  currentStepIndex: number; // 0..6 in FLOW_STEPS
}

export interface SimState {
  running: boolean;
  speed: number;
  tick: number;
  startTs: number;
  simSecondsPerTick: number;
  machines: MachineState[];
  agvs: AGV[];
  events: SimEvent[];
  totalProduced: number;
  producedDelta: number; // last-window increment
  totalDowntime: number;
  oee: number;
  activeAlerts: number;
  wip: number;
  throughputPerHour: number;
  bottleneckId: string | null;
  currentPart: CurrentPart;
  partCounter: number;
  cycleTargetMin: number;
  kpiHistory: {
    oee: number[];
    produced: number[];
    wip: number[];
    health: number[];
  };
  /* v2.0 */
  activeWorkers: ActiveWorker[];
  aiHighlightedMachines: string[];   // machine codes touched by AI in last N ticks
  humanInterventionsCount: number;   // total workers dispatched
  autonomousActionsCount: number;    // total safe-tier agent actions applied
}

/* ────────── Chain, part naming, and canonical station coords ────────── */
export const CHAIN: string[] = ["warehouse", "cnc1", "robot", "cnc7", "press", "conveyor"];

export const FLOW_STEPS = [
  { key: "warehouse", label: "Raw Material", sub: "(AS/RS)" },
  { key: "cnc1", label: "CNC-01", sub: "Milling" },
  { key: "robot", label: "Robotic Arm", sub: "Transfer" },
  { key: "cnc7", label: "CNC-07", sub: "Lathe" },
  { key: "press", label: "Hydraulic", sub: "Press" },
  { key: "conveyor", label: "Outfeed", sub: "Conveyor" },
  { key: "finished", label: "Finished Goods", sub: "(OUT)" },
];

const PART_NAMES = [
  "Gear Housing",
  "Servo Bracket",
  "Flange Adapter",
  "Bearing Race",
  "Motor Mount",
  "Coupling Sleeve",
  "Cam Follower",
];

const HISTORY_LEN = 60;
const KPI_HIST_LEN = 24;

function newMachine(
  id: string,
  code: string,
  label: string,
  shortLabel: string,
  kind: MachineKind,
  x: number,
  y: number,
  targetRpm: number,
  capacity: number,
  initialQueue: number
): MachineState {
  return {
    id,
    code,
    label,
    shortLabel,
    kind,
    x,
    y,
    status: "healthy",
    statusText: "Running",
    temperature: 42 + Math.random() * 6,
    ambient: 24,
    rpm: 0,
    targetRpm,
    vibration: 0.3,
    toolWear: 0,
    health: 100,
    load: 0.2,
    queue: initialQueue,
    capacity,
    produced: 0,
    throughput: 0,
    utilization: 0,
    downtimeTicksLeft: 0,
    history: [],
  };
}

function seedMachines(): MachineState[] {
  // World coords on a 1200 × 640 factory floor
  return [
    newMachine("warehouse", "CELL-06", "AS/RS Warehouse", "AS/RS Warehouse", "warehouse", 240, 220, 0, 999, 40),
    newMachine("cnc1",      "CELL-01", "CNC-01 Milling",   "CNC-01 Milling",   "cnc",       560, 220, 1500, 30, 6),
    newMachine("robot",     "CELL-02", "6-Axis Robotic Arm", "6-Axis Robotic Arm", "robot", 820, 220, 800, 25, 3),
    newMachine("cnc7",      "CELL-04", "CNC-07 Heavy Lathe", "CNC-07 Heavy Lathe", "cnc",   240, 480, 1400, 30, 4),
    newMachine("press",     "CELL-05", "Hydraulic Press",  "Hydraulic Press",  "press",     560, 480, 900,  20, 2),
    newMachine("conveyor",  "CELL-03", "Outfeed Conveyor", "Outfeed Conveyor", "conveyor",  820, 480, 600,  40, 0),
  ];
}

function seedAGVs(): AGV[] {
  return [
    {
      id: "agv1", code: "AGV-01",
      x: 380, y: 220, targetX: 480, targetY: 220,
      fromStation: "warehouse", toStation: "cnc1",
      routeIndex: 0, progress: 0.4, ticksPerLeg: 30,
      cargoPartId: null, status: "moving",
      currentAction: "Moving to CNC-01",
    },
    {
      id: "agv2", code: "AGV-02",
      x: 900, y: 220, targetX: 900, targetY: 480,
      fromStation: "robot", toStation: "cnc7",
      routeIndex: 0, progress: 0.2, ticksPerLeg: 50,
      cargoPartId: null, status: "moving",
      currentAction: "Moving to CNC-07",
    },
    {
      id: "agv3", code: "AGV-03",
      x: 900, y: 480, targetX: 1030, targetY: 480,
      fromStation: "conveyor", toStation: "finished",
      routeIndex: 0, progress: 0.6, ticksPerLeg: 25,
      cargoPartId: null, status: "moving",
      currentAction: "To Outfeed",
    },
  ];
}

const AGV_ROUTES: Record<string, { from: string; to: string; ticks: number }[]> = {
  agv1: [
    { from: "warehouse", to: "cnc1", ticks: 30 },
    { from: "cnc1", to: "warehouse", ticks: 30 },
  ],
  agv2: [
    { from: "robot", to: "cnc7", ticks: 50 },
    { from: "cnc7", to: "robot", ticks: 50 },
  ],
  agv3: [
    { from: "conveyor", to: "finished", ticks: 25 },
    { from: "finished", to: "conveyor", ticks: 25 },
  ],
};

const FINISHED_GOODS_POS = { x: 1050, y: 480 };

function stationCoord(machines: MachineState[], id: string): { x: number; y: number } {
  if (id === "finished") return FINISHED_GOODS_POS;
  const m = machines.find((mm) => mm.id === id);
  return m ? { x: m.x, y: m.y } : { x: 0, y: 0 };
}

function statusFromHealth(m: MachineState): MachineStatus {
  if (m.downtimeTicksLeft > 0) return "downtime";
  if (m.health < 45 || m.temperature > 92 || m.vibration > 4.6) return "critical";
  if (m.health < 72 || m.temperature > 78 || m.vibration > 2.2 || m.toolWear > 70) return "warning";
  return "healthy";
}

function statusTextFor(m: MachineState): string {
  if (m.status === "downtime") return "Down · Maint.";
  if (m.status === "critical") return "Critical";
  if (m.status === "warning") return "Degraded";
  if (m.kind === "warehouse") return "Dispatching";
  if (m.kind === "robot") return "Operating";
  if (m.kind === "conveyor") return "Running";
  if (m.kind === "press") return "Operating";
  return m.queue > 0 ? "Processing" : "Idle";
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function noise(a: number) {
  return (Math.random() - 0.5) * 2 * a;
}

function formatWallClock(startTs: number, tick: number, simSecondsPerTick: number): string {
  const d = new Date(startTs + tick * simSecondsPerTick * 1000);
  return d.toLocaleTimeString("en-GB", { hour12: false });
}

/** Sim clock anchor — today at 08:00 local (start of shift A).
 *  Keeps the SIMULATION TIME chip current instead of frozen at 2026-10-10. */
function todayShiftStart(): number {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  return d.getTime();
}

/* Machine `code` (CELL-01) → machine `id` (cnc1). */
const CODE_TO_ID: Record<string, string> = {
  "CELL-01": "cnc1",
  "CELL-02": "robot",
  "CELL-03": "conveyor",
  "CELL-04": "cnc7",
  "CELL-05": "press",
  "CELL-06": "warehouse",
};
function codeToId(code: string): string {
  return CODE_TO_ID[code] || code;
}

export function useFactorySim() {
  const [state, setState] = useState<SimState>(() => {
    const startTs = todayShiftStart();
    const machines = seedMachines();
    const agvs = seedAGVs();
    return {
      running: true,
      speed: 1,
      tick: 0,
      startTs,
      simSecondsPerTick: 30,
      machines,
      agvs,
      events: [
        {
          t: 0,
          wallClock: formatWallClock(startTs, 0, 30),
          msg: "Simulation initialized · 6 cells, 3 AGVs online",
          kind: "info",
          category: "machine",
        },
      ],
      totalProduced: 0,
      producedDelta: 0,
      totalDowntime: 0,
      oee: 1,
      activeAlerts: 0,
      wip: 0,
      throughputPerHour: 0,
      bottleneckId: null,
      currentPart: {
        id: "#A780",
        name: "Gear Housing",
        enteredTick: 0,
        currentStepIndex: 0,
      },
      partCounter: 780,
      cycleTargetMin: 10,
      kpiHistory: {
        oee: [],
        produced: [],
        wip: [],
        health: [],
      },
      activeWorkers: [],
      aiHighlightedMachines: [],
      humanInterventionsCount: 0,
      autonomousActionsCount: 0,
    };
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const pushEvent = (evs: SimEvent[], ev: SimEvent) => {
    evs.unshift(ev);
    if (evs.length > 100) evs.length = 100;
  };

  const tickOnce = useCallback(() => {
    setState((prev) => {
      const next: SimState = {
        ...prev,
        tick: prev.tick + 1,
        machines: prev.machines.map((m) => ({ ...m, history: m.history.slice() })),
        agvs: prev.agvs.map((a) => ({ ...a })),
        events: prev.events.slice(),
        kpiHistory: {
          oee: prev.kpiHistory.oee.slice(),
          produced: prev.kpiHistory.produced.slice(),
          wip: prev.kpiHistory.wip.slice(),
          health: prev.kpiHistory.health.slice(),
        },
      };

      const wallClock = formatWallClock(next.startTs, next.tick, next.simSecondsPerTick);
      const byId = new Map(next.machines.map((m) => [m.id, m]));

      /* ────── Machine physics ────── */
      let downCount = 0;
      const wh = byId.get("warehouse")!;
      wh.queue = Math.min(999, wh.queue + 2);

      for (let i = 0; i < CHAIN.length; i++) {
        const m = byId.get(CHAIN[i])!;
        const prevStatus = m.status;

        if (m.downtimeTicksLeft > 0) {
          m.downtimeTicksLeft -= 1;
          m.temperature += (m.ambient - m.temperature) * 0.08;
          m.rpm *= 0.85;
          m.vibration *= 0.85;
          m.toolWear = Math.max(0, m.toolWear - 3);
          m.health = clamp(m.health + 4, 0, 100);
          m.load = 0;
          if (m.downtimeTicksLeft === 0) {
            m.health = 96;
            m.toolWear = 0;
            m.faultTag = undefined;
            pushEvent(next.events, {
              t: next.tick, wallClock, category: "machine", machineId: m.id, kind: "ok",
              msg: `${m.code} — auto-repair complete, cell back online`,
            });
          }
          downCount++;
        } else {
          const utilization = clamp(m.queue / m.capacity, 0, 1);
          m.load = m.load * 0.7 + utilization * 0.3;
          m.utilization = m.load;

          const rpmCap = m.targetRpm * (1 - m.toolWear / 220);
          m.rpm += (rpmCap * (0.65 + m.load * 0.5) - m.rpm) * 0.15 + noise(20);
          if (m.rpm < 0) m.rpm = 0;

          const targetT = m.ambient + 20 + m.load * 45 + m.toolWear * 0.35;
          m.temperature += (targetT - m.temperature) * 0.05 + noise(0.4);
          if (m.temperature > 88) m.temperature += 0.15;

          m.vibration = clamp(
            0.35 + m.toolWear * 0.035 + m.load * 0.9 + (m.temperature > 85 ? 1.2 : 0) + noise(0.15),
            0,
            8
          );

          m.toolWear = clamp(m.toolWear + m.load * 0.15 + (m.temperature > 82 ? 0.08 : 0), 0, 100);

          const raw =
            100 - m.toolWear * 0.45 - Math.max(0, m.temperature - 70) * 1.3 - Math.max(0, m.vibration - 2) * 5;
          m.health = clamp(m.health * 0.85 + raw * 0.15, 0, 100);

          const rate = clamp(m.health / 100, 0.1, 1) * (m.kind === "warehouse" ? 0 : 1);
          const consumed = Math.min(m.queue, Math.random() < rate ? 1 : 0);
          if (consumed > 0) {
            m.queue -= consumed;
            m.produced += consumed;
            const nextIdx = i + 1;
            if (nextIdx < CHAIN.length) {
              const nxt = byId.get(CHAIN[nextIdx])!;
              nxt.queue = Math.min(nxt.capacity + 20, nxt.queue + consumed);
            } else {
              next.totalProduced += consumed;
              pushEvent(next.events, {
                t: next.tick, wallClock, category: "flow", partId: next.currentPart.id, kind: "ok", icon: "📦",
                msg: `${next.currentPart.id} completed — moved to Finished Goods`,
              });
              // roll to next part
              next.partCounter += 1;
              next.currentPart = {
                id: `#A${next.partCounter}`,
                name: PART_NAMES[next.partCounter % PART_NAMES.length],
                enteredTick: next.tick,
                currentStepIndex: 0,
              };
            }
          }
          m.throughput = m.throughput * 0.9 + consumed * 60 * 0.1;

          if (i === 0 && Math.random() < 0.7 && m.queue > 0) {
            const first = byId.get(CHAIN[1])!;
            if (first.queue < first.capacity) {
              m.queue -= 1;
              first.queue += 1;
            }
          }
        }

        m.status = statusFromHealth(m);
        m.statusText = statusTextFor(m);

        if (m.status !== prevStatus) {
          if (m.status === "critical") {
            pushEvent(next.events, {
              t: next.tick, wallClock, category: "alert", machineId: m.id, kind: "crit", icon: "🔴",
              msg: `${m.code} entered CRITICAL — T=${m.temperature.toFixed(1)}°C · vib=${m.vibration.toFixed(2)}mm/s`,
            });
          } else if (m.status === "warning") {
            pushEvent(next.events, {
              t: next.tick, wallClock, category: "alert", machineId: m.id, kind: "warn", icon: "🟡",
              msg: `${m.code} degraded — health ${m.health.toFixed(0)}% · wear ${m.toolWear.toFixed(0)}%`,
            });
          } else if (m.status === "downtime") {
            pushEvent(next.events, {
              t: next.tick, wallClock, category: "alert", machineId: m.id, kind: "crit", icon: "⛔",
              msg: `${m.code} DOWN — auto-maintenance dispatched`,
            });
          } else if (m.status === "healthy" && prevStatus === "warning") {
            pushEvent(next.events, {
              t: next.tick, wallClock, category: "machine", machineId: m.id, kind: "ok", icon: "🟢",
              msg: `${m.code} recovered to healthy`,
            });
          }
        }
        if (m.status === "critical" && m.health < 25 && m.downtimeTicksLeft === 0) {
          m.downtimeTicksLeft = 24;
        }

        m.history.push({ t: next.tick, temp: m.temperature, rpm: m.rpm, vib: m.vibration });
        if (m.history.length > HISTORY_LEN) m.history.shift();
      }

      /* ────── Current-part step tracking (visual only) ────── */
      const cp = next.currentPart;
      const stepEvery = 40; // ~ every 40 ticks advance a step visually
      const desired = Math.min(6, Math.floor((next.tick - cp.enteredTick) / stepEvery));
      if (desired !== cp.currentStepIndex) {
        const oldIdx = cp.currentStepIndex;
        cp.currentStepIndex = desired;
        const step = FLOW_STEPS[desired];
        if (step && desired > oldIdx) {
          pushEvent(next.events, {
            t: next.tick, wallClock, category: "flow", partId: cp.id, kind: "info", icon: "→",
            msg: `${cp.id} advanced to ${step.label} ${step.sub}`,
          });
        }
      }

      /* ────── AGV motion ────── */
      let activeAgvs = 0;
      for (const agv of next.agvs) {
        const routes = AGV_ROUTES[agv.id];
        if (!routes) continue;
        const leg = routes[agv.routeIndex % routes.length];
        const from = stationCoord(next.machines, leg.from);
        const to = stationCoord(next.machines, leg.to);
        agv.progress += 1 / leg.ticks;

        if (agv.progress >= 1) {
          // Arrived
          agv.progress = 0;
          agv.routeIndex = (agv.routeIndex + 1) % routes.length;
          const nextLeg = routes[agv.routeIndex];
          agv.fromStation = nextLeg.from;
          agv.toStation = nextLeg.to;
          agv.status = "loading";
          agv.currentAction = `At ${leg.to.toUpperCase()} · loading`;
          agv.x = to.x;
          agv.y = to.y;

          if (Math.random() < 0.5) {
            pushEvent(next.events, {
              t: next.tick, wallClock, category: "agv", agvId: agv.id, kind: "info", icon: "🚚",
              msg: `${agv.code} arrived at ${leg.to === "cnc1" ? "CNC-01"
                    : leg.to === "cnc7" ? "CNC-07"
                    : leg.to === "warehouse" ? "AS/RS Warehouse"
                    : leg.to === "robot" ? "Robotic Arm"
                    : leg.to === "conveyor" ? "Outfeed Conveyor"
                    : leg.to === "press" ? "Hydraulic Press"
                    : leg.to === "finished" ? "Finished Goods"
                    : leg.to}`,
            });
          }
        } else {
          // Interpolate along leg — slight curve via mid-y bump
          const p = agv.progress;
          const midBump = Math.sin(p * Math.PI) * 20 * (from.y === to.y ? 0 : 1);
          agv.x = from.x + (to.x - from.x) * p;
          agv.y = from.y + (to.y - from.y) * p + midBump;
          agv.targetX = to.x;
          agv.targetY = to.y;
          agv.status = "moving";
          const dest = leg.to === "cnc1" ? "CNC-01"
                      : leg.to === "cnc7" ? "CNC-07"
                      : leg.to === "warehouse" ? "AS/RS"
                      : leg.to === "robot" ? "Robot"
                      : leg.to === "conveyor" ? "Conveyor"
                      : leg.to === "press" ? "Press"
                      : leg.to === "finished" ? "Outfeed"
                      : leg.to;
          agv.currentAction = `Moving to ${dest}`;
          activeAgvs++;
        }
      }

      /* ────── KPIs ────── */
      const avgHealth = next.machines.reduce((s, m) => s + m.health, 0) / next.machines.length;
      const uptime = 1 - downCount / next.machines.length;
      next.oee = clamp(uptime * 0.5 + (avgHealth / 100) * 0.5, 0, 1);
      next.activeAlerts = next.machines.filter((m) => m.status === "critical" || m.status === "downtime").length;
      next.wip = next.machines.slice(1).reduce((s, m) => s + m.queue, 0); // exclude raw warehouse
      // Throughput per hour: rolling window of last 60 ticks (30 real sec × 60 = 30 sim-min ≈ 0.5 sim-hour → x2)
      const producedInWindow = next.machines.reduce((s, m) => s + m.produced, 0);
      const windowSimHours = (Math.min(next.tick, 60) * next.simSecondsPerTick) / 3600 || 0.5;
      next.throughputPerHour = Math.round((producedInWindow / windowSimHours) * 0.4);

      // Bottleneck: highest utilization × queue
      let btl = { id: "press", score: 0 };
      for (const m of next.machines) {
        if (m.kind === "warehouse") continue;
        const score = m.utilization * (m.queue + 1) + (m.status === "critical" ? 1 : 0);
        if (score > btl.score) btl = { id: m.id, score };
      }
      next.bottleneckId = btl.id;

      // KPI history push (every 5 ticks)
      if (next.tick % 5 === 0) {
        const kh = next.kpiHistory;
        kh.oee.push(next.oee);
        kh.produced.push(next.producedDelta);
        kh.wip.push(next.wip);
        kh.health.push(avgHealth);
        for (const arr of [kh.oee, kh.produced, kh.wip, kh.health]) {
          if (arr.length > KPI_HIST_LEN) arr.shift();
        }
      }

      /* ────── Active worker motion + task progress ────── */
      next.activeWorkers = next.activeWorkers
        .map((w) => {
          const nw = { ...w };
          const targetM = byId.get(codeToId(nw.targetMachineCode));
          if (targetM) {
            nw.targetX = targetM.x;
            nw.targetY = targetM.y;
          }
          if (nw.status === "moving") {
            nw.progress = Math.min(1, nw.progress + 0.05); // ~20 ticks to arrive
            nw.x = nw.x + (nw.targetX - nw.x) * 0.12;
            nw.y = nw.y + (nw.targetY - nw.y) * 0.12;
            if (nw.progress >= 1) {
              nw.status = "on_task";
              nw.progress = 0;
              nw.arrivedAt = next.tick;
              pushEvent(next.events, {
                t: next.tick, wallClock, category: "workforce", kind: "info", icon: "🧰",
                msg: `${nw.id} ${nw.name} arrived at ${nw.targetMachineCode} — starting repair`,
              });
            }
          } else if (nw.status === "on_task") {
            nw.taskTicksLeft = Math.max(0, nw.taskTicksLeft - 1);
            nw.progress = 1 - nw.taskTicksLeft / Math.max(1, nw.taskTicksTotal);
            // Actively heal the machine during on_task
            if (targetM) {
              targetM.temperature += (targetM.ambient - targetM.temperature) * 0.15;
              targetM.toolWear = Math.max(0, targetM.toolWear - 4);
              targetM.vibration *= 0.85;
              targetM.health = clamp(targetM.health + 3, 0, 100);
              targetM.rpm *= 0.6;
              targetM.faultTag = "UNDER REPAIR";
            }
            if (nw.taskTicksLeft === 0) {
              nw.status = "verifying";
              nw.progress = 0;
              pushEvent(next.events, {
                t: next.tick, wallClock, category: "workforce", kind: "ok", icon: "🔍",
                msg: `${nw.id} completed physical repair on ${nw.targetMachineCode} — verifying`,
              });
              if (targetM) targetM.faultTag = "VERIFYING";
            }
          } else if (nw.status === "verifying") {
            nw.progress = Math.min(1, nw.progress + 0.15); // ~7 ticks
            if (targetM && nw.progress >= 1) {
              targetM.health = clamp(targetM.health + 6, 0, 100);
              targetM.toolWear = 0;
              targetM.faultTag = undefined;
              pushEvent(next.events, {
                t: next.tick, wallClock, category: "workforce", kind: "ok", icon: "✅",
                msg: `${nw.id} verified ${nw.targetMachineCode} recovery — health ${targetM.health.toFixed(0)}%`,
              });
              return null; // remove worker
            }
          }
          return nw;
        })
        .filter((w): w is ActiveWorker => w !== null);

      next.totalDowntime = prev.totalDowntime + downCount;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!state.running) return;
    const interval = 500 / state.speed;
    const id = setInterval(tickOnce, interval);
    return () => clearInterval(id);
  }, [state.running, state.speed, tickOnce]);

  const play = () => setState((s) => ({ ...s, running: true }));
  const pause = () => setState((s) => ({ ...s, running: false }));
  const setSpeed = (speed: number) => setState((s) => ({ ...s, speed }));
  const reset = () => {
    const startTs = todayShiftStart();
    setState({
      running: true,
      speed: 1,
      tick: 0,
      startTs,
      simSecondsPerTick: 30,
      machines: seedMachines(),
      agvs: seedAGVs(),
      events: [
        {
          t: 0,
          wallClock: formatWallClock(startTs, 0, 30),
          msg: "Simulation reset · all cells re-initialized",
          kind: "info",
          category: "machine",
        },
      ],
      totalProduced: 0,
      producedDelta: 0,
      totalDowntime: 0,
      oee: 1,
      activeAlerts: 0,
      wip: 0,
      throughputPerHour: 0,
      bottleneckId: null,
      currentPart: { id: "#A785", name: PART_NAMES[0], enteredTick: 0, currentStepIndex: 0 },
      partCounter: 785,
      cycleTargetMin: 10,
      kpiHistory: { oee: [], produced: [], wip: [], health: [] },
      activeWorkers: [],
      aiHighlightedMachines: [],
      humanInterventionsCount: 0,
      autonomousActionsCount: 0,
    });
  };

  const injectFault = (id: string, kind: "wear" | "thermal" | "surge") => {
    setState((s) => {
      const machines = s.machines.map((m) => {
        if (kind === "surge") {
          return {
            ...m,
            temperature: m.temperature + 12,
            vibration: m.vibration + 1.8,
            toolWear: Math.min(100, m.toolWear + 12),
            faultTag: "POWER SURGE",
          };
        }
        if (m.id !== id) return m;
        if (kind === "wear") {
          return { ...m, toolWear: Math.min(100, m.toolWear + 45), faultTag: "BEARING WEAR" };
        }
        return { ...m, temperature: m.temperature + 18, faultTag: "COOLANT LOSS" };
      });
      const wallClock = formatWallClock(s.startTs, s.tick, s.simSecondsPerTick);
      const label = kind === "wear" ? "bearing wear" : kind === "thermal" ? "coolant loss" : "plant-wide power surge";
      const events = s.events.slice();
      pushEvent(events, {
        t: s.tick, wallClock, category: "alert", kind: "warn", icon: "⚡",
        machineId: kind === "surge" ? undefined : id,
        msg: `Fault injected · ${label}${kind === "surge" ? "" : ` on ${id.toUpperCase()}`}`,
      });
      return { ...s, machines, events };
    });
  };

  const dispatchMaintenance = (id: string) => {
    setState((s) => {
      const machines = s.machines.map((m) =>
        m.id === id ? { ...m, downtimeTicksLeft: 20, faultTag: "MAINT" } : m
      );
      const wallClock = formatWallClock(s.startTs, s.tick, s.simSecondsPerTick);
      const events = s.events.slice();
      pushEvent(events, {
        t: s.tick, wallClock, category: "machine", machineId: id, kind: "info", icon: "🔧",
        msg: `Manual maintenance dispatched to ${id.toUpperCase()}`,
      });
      return { ...s, machines, events };
    });
  };

  /** v2.0 — Workforce Agent dispatches a worker to a machine.
   *  Worker enters the sim at their zone spawn point, moves to machine,
   *  performs on_task repair, verifies, then despawns. */
  const dispatchWorker = useCallback(
    (opts: {
      id: string;
      name: string;
      targetMachineCode: string;
      missionId?: string;
      taskTicks?: number;
    }) => {
      setState((s) => {
        // Prevent duplicate on same target
        if (s.activeWorkers.some((w) => w.id === opts.id)) return s;
        const target = s.machines.find((m) => m.id === codeToId(opts.targetMachineCode));
        if (!target) return s;
        // Spawn at floor edge closest to the target
        const spawnX = 40;
        const spawnY = target.y > 400 ? 570 : 90;
        const nw: ActiveWorker = {
          id: opts.id,
          name: opts.name,
          x: spawnX,
          y: spawnY,
          targetMachineCode: opts.targetMachineCode,
          targetX: target.x,
          targetY: target.y,
          status: "moving",
          missionId: opts.missionId,
          progress: 0,
          taskTicksTotal: opts.taskTicks || 24,
          taskTicksLeft: opts.taskTicks || 24,
        };
        const wallClock = formatWallClock(s.startTs, s.tick, s.simSecondsPerTick);
        const events = s.events.slice();
        pushEvent(events, {
          t: s.tick, wallClock, category: "workforce", kind: "info", icon: "🧑‍🔧",
          msg: `${opts.id} ${opts.name} dispatched to ${opts.targetMachineCode}`,
        });
        return {
          ...s,
          activeWorkers: [...s.activeWorkers, nw],
          events,
          humanInterventionsCount: s.humanInterventionsCount + 1,
          aiHighlightedMachines: [
            opts.targetMachineCode,
            ...s.aiHighlightedMachines.filter((c) => c !== opts.targetMachineCode),
          ].slice(0, 5),
        };
      });
    },
    []
  );

  /** v2.0 — apply arbitrary agent action to local sim state. Called
   *  by useCoordinatorAgent for every executed action returned from /api/agent. */
  const applyAgentAction = useCallback(
    (action: { tool: string; args: any; agentName?: string }) => {
      const { tool, args } = action;
      if (tool === "dispatch_maintenance") {
        if (args.machineId) dispatchMaintenance(args.machineId);
      } else if (tool === "assign_worker") {
        dispatchWorker({
          id: args.workerId,
          name: args.workerName || args.workerId,
          targetMachineCode: args.machineCode,
          missionId: args.missionId,
          taskTicks: 24,
        });
      } else if (tool === "pause_machine") {
        const id = codeToId(args.machineCode);
        setState((s) => {
          const machines = s.machines.map((m) =>
            m.id === id ? { ...m, downtimeTicksLeft: Math.max(m.downtimeTicksLeft, 12), faultTag: "SAFETY PAUSE" } : m
          );
          return { ...s, machines };
        });
      } else if (tool === "throttle_upstream" || tool === "reroute_material" || tool === "raise_operator_alert") {
        // These are informational for the sim; the audit is in Mongo already.
        setState((s) => ({
          ...s,
          autonomousActionsCount: s.autonomousActionsCount + 1,
          aiHighlightedMachines: args.machineCode
            ? [args.machineCode, ...s.aiHighlightedMachines.filter((c) => c !== args.machineCode)].slice(0, 5)
            : s.aiHighlightedMachines,
        }));
      }
    },
    [dispatchMaintenance, dispatchWorker]
  );

  const wallClock = formatWallClock(state.startTs, state.tick, state.simSecondsPerTick);
  const wallDate = new Date(state.startTs + state.tick * state.simSecondsPerTick * 1000)
    .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return {
    state, play, pause, setSpeed, reset, injectFault, dispatchMaintenance,
    dispatchWorker, applyAgentAction,
    wallClock, wallDate,
  };
}
