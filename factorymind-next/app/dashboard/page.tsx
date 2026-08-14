import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FactoryMind AI — Smart Factory Dashboard",
  description:
    "Real-time digital twin dashboard for monitoring factory machines, predictive maintenance, and AI-powered insights.",
};

import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return <DashboardClient />;
}
