"use client";

import { createContext, useContext, useState } from "react";
import { useFactorySim } from "@/hooks/useFactorySim";
import { useCoordinatorAgent } from "@/hooks/useCoordinatorAgent";
import { useMlHealth, MlHealth } from "@/hooks/useMlHealth";

/**
 * One simulation engine + coordinator agent for the whole workspace.
 * Lives in the (workspace) layout so the plant keeps running while the user
 * moves between Dashboard, Simulation, Scenario Lab and Manpower — and every
 * dashboard card reads the same live state the floor view shows.
 */
type FactorySimValue = ReturnType<typeof useFactorySim> & {
  agent: ReturnType<typeof useCoordinatorAgent>;
  mlHealth: MlHealth;
  agentEnabled: boolean;
  setAgentEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

const FactorySimContext = createContext<FactorySimValue | null>(null);

export function FactorySimProvider({ children }: { children: React.ReactNode }) {
  const sim = useFactorySim();
  const [agentEnabled, setAgentEnabled] = useState(true);
  const agent = useCoordinatorAgent(sim.state, {
    enabled: agentEnabled,
    intervalMs: 6000,
    applyAgentAction: sim.applyAgentAction,
  });
  const mlHealth = useMlHealth();

  return (
    <FactorySimContext.Provider value={{ ...sim, agent, mlHealth, agentEnabled, setAgentEnabled }}>
      {children}
    </FactorySimContext.Provider>
  );
}

export function useSim(): FactorySimValue {
  const ctx = useContext(FactorySimContext);
  if (!ctx) throw new Error("useSim must be used inside <FactorySimProvider>");
  return ctx;
}
