"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SimState } from "./useFactorySim";

export interface AgentAction {
  tool: string;
  args: Record<string, any>;
  reason: string;
  autonomyLevel: "SAFE" | "APPROVAL_REQUIRED" | "HUMAN_REQUIRED";
  agentName: string;
  targetSupervisorId?: string;
  missionId?: string;
}

export interface AgentSubReport {
  agentName: string;
  thoughts: string[];
  actions: AgentAction[];
}

export interface AgentDecision {
  wallClock: string;
  brain: string;
  executiveSummary: string;
  reports: AgentSubReport[];
  actions: AgentAction[];
  ml: Record<string, { failureProbability: number; riskLevel: string; confidence: number; recommendation?: string }>;
}

interface UseCoordinatorAgentOpts {
  enabled: boolean;
  intervalMs?: number;
  applyAgentAction?: (a: { tool: string; args: any; agentName?: string }) => void;
}

/** Client hook — every intervalMs POST snapshot to /api/agent, apply the
 *  returned actions to the local sim, and keep the decision history so
 *  the AI Control Center can render the full OBSERVE→VERIFY lifecycle. */
export function useCoordinatorAgent(
  state: SimState,
  { enabled, intervalMs = 6000, applyAgentAction }: UseCoordinatorAgentOpts
) {
  const [history, setHistory] = useState<AgentDecision[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const tick = useCallback(async () => {
    setBusy(true);
    try {
      const s = stateRef.current;
      const snapshot = {
        tick: s.tick,
        wallClock: new Date(s.startTs + s.tick * s.simSecondsPerTick * 1000)
          .toLocaleTimeString("en-GB", { hour12: false }),
        machines: s.machines.map((m) => ({
          id: m.id, code: m.code, label: m.label, status: m.status,
          health: m.health, temperature: m.temperature, vibration: m.vibration,
          toolWear: m.toolWear, queue: m.queue, utilization: m.utilization, rpm: m.rpm,
        })),
        agvs: s.agvs.map((a) => ({
          id: a.id, code: a.code, status: a.status, from: a.fromStation, to: a.toStation,
        })),
        activeAgvs: s.agvs.filter((a) => a.status === "moving").length,
        totalAgvs: s.agvs.length,
        bottleneckId: s.bottleneckId,
        wip: s.wip,
        oee: s.oee,
        currentPartId: s.currentPart.id,
        activeMissionMachineCodes: s.activeWorkers.map((w) => w.targetMachineCode),
      };

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setLastError(json?.error || "agent error");
        return;
      }
      const decision: AgentDecision = {
        wallClock: json.wallClock,
        brain: json.brain,
        executiveSummary: json.executiveSummary,
        reports: json.reports || [],
        actions: json.actions || [],
        ml: json.ml || {},
      };

      // Apply mutating actions locally
      if (applyAgentAction) {
        for (const a of decision.actions) {
          try { applyAgentAction(a); } catch (e) { console.warn("applyAgentAction", e); }
        }
      }

      setHistory((prev) => [decision, ...prev].slice(0, 30));
      setLastError(null);
    } catch (e: any) {
      setLastError(e?.message || "network error");
    } finally {
      setBusy(false);
    }
  }, [applyAgentAction]);

  useEffect(() => {
    if (!enabled) return;
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, tick]);

  return { history, busy, lastError, latest: history[0] || null };
}
