"use client";

import FactorySimulation from "@/components/FactorySimulation";
import OperatorMachineView from "@/components/OperatorMachineView";
import { useAuth } from "@/context/AuthContext";

export default function SimulationClient() {
  const { role, user } = useAuth();

  // Supervisors and admins oversee the whole line; an operator works one machine.
  let content = <FactorySimulation />;
  if (role === "USER") {
    content = user?.assignedMachine ? (
      <OperatorMachineView machineCode={user.assignedMachine} />
    ) : (
      <div className="sim-hub-banner">
        <div className="sim-banner-desc">
          No machine is assigned to your account yet. Ask your supervisor to assign you a workcell.
        </div>
      </div>
    );
  }

  return (
    <div className="sim-page-wrapper sim-embedded">
      <main className="sim-main-container">{content}</main>
    </div>
  );
}
