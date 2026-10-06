"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faTriangleExclamation,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useSim } from "@/context/FactorySimContext";
import type { SimEvent } from "@/hooks/useFactorySim";

const KIND_STYLE: Record<Exclude<SimEvent["kind"], "info">, { cls: string; icon: typeof faCircleCheck }> = {
  crit: { cls: "critical", icon: faCircleExclamation },
  warn: { cls: "warning", icon: faTriangleExclamation },
  ok: { cls: "success", icon: faCircleCheck },
};

const MAX_ALERTS = 5;

/** Sim minutes elapsed since an event, as "just now" / "4 min ago" / "1h 10m ago". */
function sinceLabel(ticksAgo: number, secondsPerTick: number): string {
  const mins = Math.floor((ticksAgo * secondsPerTick) / 60);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function AlertsSection() {
  const { state } = useSim();

  // Events are stored newest-first. "info" entries and part-flow completions are
  // routine log lines; alerts are warnings, criticals and machine recoveries.
  const alerts = state.events
    .filter((e) => e.kind !== "info" && e.category !== "flow")
    .slice(0, MAX_ALERTS);
  const critical = state.machines.filter((m) => m.status === "critical" || m.status === "downtime").length;
  const warning = state.machines.filter((m) => m.status === "warning").length;

  return (
    <section className="alerts-section">
      <div className="alerts-card">
        <div className="section-title live-card-title">
          <h2>🚨 Real-Time Alerts</h2>
          <span className="live-pill">
            <span className="live-dot" /> LIVE · {critical} critical · {warning} warning
          </span>
        </div>

        {alerts.length === 0 && (
          <div className="alert success">
            <span className="alert-icon">
              <FontAwesomeIcon icon={faCircleCheck} />
            </span>
            <div>
              <h4>All cells nominal</h4>
              <p>No warnings raised this shift</p>
            </div>
          </div>
        )}

        {alerts.map((e) => {
          const style = KIND_STYLE[e.kind as keyof typeof KIND_STYLE];
          return (
            <div key={`${e.t}-${e.msg}`} className={`alert ${style.cls}`}>
              <span className="alert-icon">
                <FontAwesomeIcon icon={style.icon} />
              </span>
              <div>
                <h4>{e.msg}</h4>
                <p>
                  {e.wallClock} · {sinceLabel(state.tick - e.t, state.simSecondsPerTick)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
