import type { Metadata } from "next";
import ManpowerClient from "./ManpowerClient";

export const metadata: Metadata = {
  title: "FactoryMind AI — Manpower Allocation",
  description:
    "Workforce allocation grid: which operators are on which machines, under which supervisors, across which shifts.",
};

export default function ManpowerPage() {
  return <ManpowerClient />;
}
