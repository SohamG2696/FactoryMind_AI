"use client";

import FactorySimulation from "@/components/FactorySimulation";

export default function SimulationClient() {
  return (
    <div className="sim-page-wrapper sim-embedded">
      <main className="sim-main-container">
        <FactorySimulation />
      </main>
    </div>
  );
}
