import type { Metadata } from "next";
import SimulationClient from "./SimulationClient";

export const metadata: Metadata = {
  title: "FactoryMind AI — Live Factory Simulation",
  description:
    "Real-time discrete-event simulation of a smart-factory floor. Machines evolve state each tick — inject faults, watch failures propagate, dispatch maintenance.",
};

export default function SimulationPage() {
  return <SimulationClient />;
}
