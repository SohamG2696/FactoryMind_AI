import type { Metadata } from "next";
import ScenarioLabClient from "./ScenarioLabClient";

export const metadata: Metadata = {
  title: "FactoryMind AI — What-If Scenario Lab",
  description:
    "Run parameterized what-if simulations against a baseline and an AI-mitigated factory. Real physics, real KPIs, no fake numbers.",
};

export default function ScenarioLabPage() {
  return <ScenarioLabClient />;
}
