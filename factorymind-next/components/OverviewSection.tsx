"use client";

import { useAuth } from "@/context/AuthContext";

export default function OverviewSection() {
  const { role, user } = useAuth();
  const isAdmin = role === "ADMIN";
  const isSupervisor = role === "SUPERVISOR";

  return (
    <section className="overview">
      <div className="overview-card">
        <h3>{isAdmin ? "Total Plant Production" : isSupervisor ? "Shift Target Output" : "Workcell Output"}</h3>
        <h1>{isAdmin ? "18,450" : isSupervisor ? "4,850 / 5,200" : "840"}</h1>
        <p>{isAdmin ? "Units Produced Today" : isSupervisor ? "Current Shift Pace (93%)" : "Machined Parts"}</p>
      </div>

      <div className="overview-card">
        <h3>{isAdmin ? "Maintenance Saved" : isSupervisor ? "Line Yield Pass" : "Cycle Time avg"}</h3>
        <h1>{isAdmin ? "₹2.8 Lakh" : isSupervisor ? "98.2%" : "38.2s"}</h1>
        <p>{isAdmin ? "Estimated Cost Reduction" : isSupervisor ? "Quality Metrology Pass" : "Per Component Spec"}</p>
      </div>

      <div className="overview-card">
        <h3>{isAdmin ? "Average Machine Efficiency" : isSupervisor ? "Floor Technicians" : "Cell Defect Rate"}</h3>
        <h1>{isAdmin ? "92.4%" : isSupervisor ? "12 Active" : "0.02%"}</h1>
        <p>{isAdmin ? "Across All Departments" : isSupervisor ? "Assigned on Current Shift" : "Target: < 0.10%"}</p>
      </div>

      <div className="overview-card">
        <h3>{isAdmin ? "Autonomous AI Decisions" : isSupervisor ? "Predictive Warnings" : "Shift Time Left"}</h3>
        <h1>{isAdmin ? "18" : isSupervisor ? "03" : "2h 45m"}</h1>
        <p>{isAdmin ? "Executed System-Wide" : isSupervisor ? "Logged for Preventive Check" : "Shift-A Floor Schedule"}</p>
      </div>
    </section>
  );
}
