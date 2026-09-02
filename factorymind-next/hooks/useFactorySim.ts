"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MachineKind = "cnc" | "robot" | "conveyor" | "press" | "warehouse";
export type MachineStatus = "healthy" | "warning" | "critical" | "downtime";

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
  kind: MachineKind;
  x: number; // grid col
  y: number; // grid row
  status: MachineStatus;
  temperature: number; // °C
  ambient: number;
  rpm: number;
  targetRpm: number;
  vibration: number; // mm/s
  toolWear: number; // 0-100
  health: number; // 0-100
  load: number; // 0-1
  queue: number; // pending units
  capacity: number;
  produced: number;
  throughput: number; // units/min moving avg
  downtimeTicksLeft: number;
  history: HistoryPoint[];
  faultTag?: string;
}

export interface SimEvent {
  t: number;
  msg: string;
  kind: "info" | "warn" | "crit" | "ok";
  machineId?: string;
}

export interface SimState {
  running: boolean;
  speed: number;
  tick: number;
  machines: MachineState[];
  events: SimEvent[];
  totalProduced: number;
  totalDowntime: number;
  oee: number;
}

const CHAIN: string[] = ["warehouse", "cnc1", "robot", "cnc7", "press", "conveyor"];

const HISTORY_LEN = 60;

function newMachine(
  id: string,
  code: string,
  label: string,
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
    kind,
    x,
    y,
    status: "healthy",
    temperature: 40 + Math.random() * 6,
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
    downtimeTicksLeft: 0,
    history: [],
  };
}

function seedMachines(): MachineState[] {
  return [
    newMachine("warehouse", "CELL-06", "AS/RS Warehouse", "warehouse", 0, 0, 0, 999, 20),
    newMachine("cnc1", "CELL-01", "CNC-01 Milling", "cnc", 1, 0, 1500, 30, 4),
    newMachine("robot", "CELL-02", "6-Axis Robotic Arm", "robot", 2, 0, 800, 25, 2),
    newMachine("cnc7", "CELL-04", "CNC-07 Heavy Lathe", "cnc", 0, 1, 1400, 30, 3),
    newMachine("press", "CELL-05", "Hydraulic Press", "press", 1, 1, 900, 20, 1),
    newMachine("conveyor", "CELL-03", "Outfeed Conveyor", "conveyor", 2, 1, 600, 40, 0),
  ];
}

function statusFromHealth(m: MachineState): MachineStatus {
  if (m.downtimeTicksLeft > 0) return "downtime";
  if (m.health < 45 || m.temperature > 92 || m.vibration > 4.6) return "critical";
  if (m.health < 72 || m.temperature > 78 || m.vibration > 2.2 || m.toolWear > 70) return "warning";
  return "healthy";
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function noise(a: number) {
  return (Math.random() - 0.5) * 2 * a;
}

export function useFactorySim() {
  const [state, setState] = useState<SimState>(() => ({
    running: true,
    speed: 1,
    tick: 0,
    machines: seedMachines(),
    events: [
      { t: 0, msg: "Simulation initialized · 6 cells online", kind: "info" },
    ],
    totalProduced: 0,
    totalDowntime: 0,
    oee: 1,
  }));

  const stateRef = useRef(state);
  stateRef.current = state;

  const pushEvent = (evs: SimEvent[], ev: SimEvent) => {
    evs.unshift(ev);
    if (evs.length > 80) evs.length = 80;
  };

  const tickOnce = useCallback(() => {
    setState((prev) => {
      const next: SimState = {
        ...prev,
        tick: prev.tick + 1,
        machines: prev.machines.map((m) => ({ ...m, history: m.history.slice() })),
        events: prev.events.slice(),
      };

      const byId = new Map(next.machines.map((m) => [m.id, m]));
      let downCount = 0;

      // Warehouse constantly replenishes its queue (raw material supply)
      const wh = byId.get("warehouse")!;
      wh.queue = Math.min(999, wh.queue + 2);

      for (let i = 0; i < CHAIN.length; i++) {
        const m = byId.get(CHAIN[i])!;
        const prevStatus = m.status;

        // Downtime countdown & auto-repair
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
              t: next.tick,
              machineId: m.id,
              kind: "ok",
              msg: `✅ ${m.code} — auto-repair complete, cell back online`,
            });
          }
          downCount++;
        } else {
          // Load from queue
          const utilization = clamp(m.queue / m.capacity, 0, 1);
          m.load = m.load * 0.7 + utilization * 0.3;

          // RPM ramps toward target, degraded by wear
          const rpmCap = m.targetRpm * (1 - m.toolWear / 220);
          m.rpm += (rpmCap * (0.65 + m.load * 0.5) - m.rpm) * 0.15 + noise(20);
          if (m.rpm < 0) m.rpm = 0;

          // Temperature dynamics
          const targetT = m.ambient + 20 + m.load * 45 + m.toolWear * 0.35;
          m.temperature += (targetT - m.temperature) * 0.05 + noise(0.4);
          if (m.temperature > 88) m.temperature += 0.15; // thermal runaway

          // Vibration
          m.vibration = clamp(
            0.35 + m.toolWear * 0.035 + m.load * 0.9 + (m.temperature > 85 ? 1.2 : 0) + noise(0.15),
            0,
            8
          );

          // Tool wear accumulates with load & heat
          m.toolWear = clamp(m.toolWear + m.load * 0.15 + (m.temperature > 82 ? 0.08 : 0), 0, 100);

          // Health derived
          const raw =
            100 - m.toolWear * 0.45 - Math.max(0, m.temperature - 70) * 1.3 - Math.max(0, m.vibration - 2) * 5;
          m.health = clamp(m.health * 0.85 + raw * 0.15, 0, 100);

          // Production: consume from own queue, feed next
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
            }
          }
          m.throughput = m.throughput * 0.9 + consumed * 60 * 0.1;

          // Warehouse dispatches to first station
          if (i === 0) {
            if (Math.random() < 0.7 && m.queue > 0) {
              const first = byId.get(CHAIN[1])!;
              if (first.queue < first.capacity) {
                m.queue -= 1;
                first.queue += 1;
              }
            }
          }
        }

        m.status = statusFromHealth(m);

        // Emit transition events
        if (m.status !== prevStatus) {
          if (m.status === "critical") {
            pushEvent(next.events, {
              t: next.tick,
              machineId: m.id,
              kind: "crit",
              msg: `🔴 ${m.code} entered CRITICAL — T=${m.temperature.toFixed(1)}°C · vib=${m.vibration.toFixed(2)}mm/s`,
            });
          } else if (m.status === "warning") {
            pushEvent(next.events, {
              t: next.tick,
              machineId: m.id,
              kind: "warn",
              msg: `🟡 ${m.code} degraded — health ${m.health.toFixed(0)}% · wear ${m.toolWear.toFixed(0)}%`,
            });
          } else if (m.status === "downtime") {
            pushEvent(next.events, {
              t: next.tick,
              machineId: m.id,
              kind: "crit",
              msg: `⛔ ${m.code} DOWN — auto-maintenance dispatched`,
            });
          } else if (m.status === "healthy" && prevStatus === "warning") {
            pushEvent(next.events, {
              t: next.tick,
              machineId: m.id,
              kind: "ok",
              msg: `🟢 ${m.code} recovered to healthy`,
            });
          }
        }

        // Auto-trigger downtime on sustained critical
        if (m.status === "critical" && m.health < 25 && m.downtimeTicksLeft === 0) {
          m.downtimeTicksLeft = 24;
        }

        // Push history
        m.history.push({
          t: next.tick,
          temp: m.temperature,
          rpm: m.rpm,
          vib: m.vibration,
        });
        if (m.history.length > HISTORY_LEN) m.history.shift();
      }

      next.totalDowntime = prev.totalDowntime + downCount;
      const uptime = 1 - downCount / next.machines.length;
      const avgHealth =
        next.machines.reduce((s, m) => s + m.health, 0) / next.machines.length / 100;
      next.oee = clamp(uptime * 0.5 + avgHealth * 0.5, 0, 1);

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
  const reset = () =>
    setState({
      running: true,
      speed: 1,
      tick: 0,
      machines: seedMachines(),
      events: [{ t: 0, msg: "Simulation reset · all cells re-initialized", kind: "info" }],
      totalProduced: 0,
      totalDowntime: 0,
      oee: 1,
    });

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
        return {
          ...m,
          temperature: m.temperature + 18,
          faultTag: "COOLANT LOSS",
        };
      });
      const label =
        kind === "wear" ? "bearing wear" : kind === "thermal" ? "coolant loss" : "plant-wide power surge";
      const events = s.events.slice();
      pushEvent(events, {
        t: s.tick,
        machineId: kind === "surge" ? undefined : id,
        kind: "warn",
        msg: `⚡ Fault injected · ${label}${kind === "surge" ? "" : ` on ${id.toUpperCase()}`}`,
      });
      return { ...s, machines, events };
    });
  };

  const dispatchMaintenance = (id: string) => {
    setState((s) => {
      const machines = s.machines.map((m) =>
        m.id === id ? { ...m, downtimeTicksLeft: 20, faultTag: "MAINT" } : m
      );
      const events = s.events.slice();
      pushEvent(events, {
        t: s.tick,
        machineId: id,
        kind: "info",
        msg: `🔧 Manual maintenance dispatched to ${id.toUpperCase()}`,
      });
      return { ...s, machines, events };
    });
  };

  return { state, play, pause, setSpeed, reset, injectFault, dispatchMaintenance };
}
