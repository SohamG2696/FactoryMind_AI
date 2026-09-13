"use client";

import { CurrentPart, FLOW_STEPS, MachineState } from "@/hooks/useFactorySim";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCube,
  faClock,
  faLayerGroup,
  faChartLine,
  faTriangleExclamation,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  currentPart: CurrentPart;
  machines: MachineState[];
  cycleTargetMin: number;
  simSecondsPerTick: number;
  currentTick: number;
  wip: number;
  throughputPerHour: number;
  bottleneckId: string | null;
}

export default function ProductionFlowStrip({
  currentPart,
  machines,
  cycleTargetMin,
  simSecondsPerTick,
  currentTick,
  wip,
  throughputPerHour,
  bottleneckId,
}: Props) {
  const cycleTimeMin =
    ((currentTick - currentPart.enteredTick) * simSecondsPerTick) / 60;
  const cyclePct = Math.min(100, (cycleTimeMin / cycleTargetMin) * 100);

  const bottleneck = bottleneckId ? machines.find((m) => m.id === bottleneckId) : null;
  const btlUtil = bottleneck ? Math.round(bottleneck.utilization * 100) : 0;

  return (
    <div className="sim-flow-strip">
      {/* Left: 7 numbered steps */}
      <div className="sim-flow-steps">
        <div className="sim-flow-steps-label">PRODUCTION FLOW <span>(CURRENT PART)</span></div>
        <div className="sim-flow-steps-row">
          {FLOW_STEPS.map((step, idx) => {
            const isDone = idx < currentPart.currentStepIndex;
            const isActive = idx === currentPart.currentStepIndex;
            return (
              <div
                key={step.key}
                className={`sim-flow-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
              >
                <div className="sim-flow-step-circle">
                  {isDone ? <FontAwesomeIcon icon={faCheck} /> : idx + 1}
                </div>
                <div className="sim-flow-step-meta">
                  <span className="sim-flow-step-title">{step.label}</span>
                  <span className="sim-flow-step-sub">{step.sub}</span>
                </div>
                {idx < FLOW_STEPS.length - 1 && (
                  <div className={`sim-flow-step-connector ${isDone ? "done" : ""}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: metadata cards */}
      <div className="sim-flow-meta">
        <MetaCell
          icon={faCube}
          label="CURRENT PART"
          value={currentPart.id}
          sub={currentPart.name}
          accent="var(--primary)"
        />
        <MetaCell
          icon={faClock}
          label="CYCLE TIME"
          value={`${cycleTimeMin.toFixed(1)} min`}
          sub={`Target ${cycleTargetMin.toFixed(1)} min`}
          bar={cyclePct}
          accent={cyclePct > 90 ? "var(--warning)" : "var(--success)"}
        />
        <MetaCell
          icon={faLayerGroup}
          label="WIP (IN SYSTEM)"
          value={String(wip)}
          sub="parts"
          accent="var(--info)"
        />
        <MetaCell
          icon={faChartLine}
          label="THROUGHPUT (/hr)"
          value={String(throughputPerHour)}
          sub="parts"
          accent="var(--success)"
        />
        <MetaCell
          icon={faTriangleExclamation}
          label="BOTTLENECK"
          value={bottleneck?.shortLabel || "—"}
          sub={`Utilization ${btlUtil}%`}
          accent="var(--danger)"
        />
      </div>
    </div>
  );
}

function MetaCell({
  icon,
  label,
  value,
  sub,
  bar,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
  bar?: number;
  accent: string;
}) {
  return (
    <div className="sim-flow-meta-cell">
      <div className="sim-flow-meta-label">{label}</div>
      <div className="sim-flow-meta-value-row">
        <FontAwesomeIcon icon={icon} style={{ color: accent, fontSize: 18 }} />
        <span className="sim-flow-meta-value">{value}</span>
      </div>
      <div className="sim-flow-meta-sub">{sub}</div>
      {typeof bar === "number" && (
        <div className="sim-flow-meta-bar">
          <div
            className="sim-flow-meta-bar-fill"
            style={{ width: `${bar}%`, background: accent }}
          />
        </div>
      )}
    </div>
  );
}
