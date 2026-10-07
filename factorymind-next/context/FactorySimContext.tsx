"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useFactorySim } from "@/hooks/useFactorySim";
import { useCoordinatorAgent } from "@/hooks/useCoordinatorAgent";
import { useMlHealth, MlHealth } from "@/hooks/useMlHealth";
import { useIntervention } from "@/hooks/useIntervention";
import { useAuth } from "@/context/AuthContext";

/**
 * One simulation engine + coordinator agent for the whole workspace.
 * Lives in the (workspace) layout so the plant keeps running while the user
 * moves between Dashboard, Simulation, Scenario Lab and Manpower — and every
 * view (supervisor, operator, dashboard) reads the same live state.
 */
type FactorySimValue = ReturnType<typeof useFactorySim> & {
  agent: ReturnType<typeof useCoordinatorAgent>;
  mlHealth: MlHealth;
  agentEnabled: boolean;
  setAgentEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  ai: ReturnType<typeof useIntervention>;
};

const FactorySimContext = createContext<FactorySimValue | null>(null);

export function FactorySimProvider({ children }: { children: React.ReactNode }) {
  const sim = useFactorySim();
  const { role, user } = useAuth();
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [interventionCode, setInterventionCode] = useState<string | null>(null);
  const { applyAgentAction } = sim;

  // Respect autonomy levels: only SAFE actions touch the plant automatically.
  // APPROVAL_REQUIRED / HUMAN_REQUIRED actions wait for a person (see useIntervention),
  // and the technician for an active intervention is sent only once the machine is isolated.
  const gatedApply = useCallback(
    (a: Parameters<typeof applyAgentAction>[0] & { autonomyLevel?: string }) => {
      if (a.autonomyLevel && a.autonomyLevel !== "SAFE") return;
      if (a.tool === "assign_worker" && a.args?.machineCode === interventionCode) return;
      applyAgentAction(a);
    },
    [applyAgentAction, interventionCode]
  );

  const agent = useCoordinatorAgent(sim.state, {
    enabled: agentEnabled && sim.state.running,
    intervalMs: 6000,
    applyAgentAction: gatedApply,
  });
  const mlHealth = useMlHealth();
  const ai = useIntervention(sim, agent.latest, role, user);

  const activeCode =
    ai.intervention && !["RECOVERED", "FAILED"].includes(ai.intervention.phase) ? ai.intervention.machineCode : null;
  if (activeCode !== interventionCode) setInterventionCode(activeCode);

  return (
    <FactorySimContext.Provider
      value={{ ...sim, reset: ai.resetAll, agent, mlHealth, agentEnabled, setAgentEnabled, ai }}
    >
      {children}
    </FactorySimContext.Provider>
  );
}

export function useSim(): FactorySimValue {
  const ctx = useContext(FactorySimContext);
  if (!ctx) throw new Error("useSim must be used inside <FactorySimProvider>");
  return ctx;
}
