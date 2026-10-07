"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faScrewdriverWrench,
  faBullhorn,
  faArrowRight,
  faRobot,
  faUserGear,
  faIndustry,
  faCircleCheck,
  faHand,
  faPlay,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import { useSim } from "@/context/FactorySimContext";
import { CHAIN, FLOW_STEPS, MachineState } from "@/hooks/useFactorySim";
import type { Intervention } from "@/hooks/useIntervention";
import { MachineSVG } from "@/components/MachineSVGs";
import FactoryFloorSVG from "@/components/FactoryFloorSVG";
import { ChartCard } from "@/components/FactorySimulation";
import { issueFor } from "@/components/MaintenanceSection";
import { PhaseBadge, StageStepper, InterventionTimeline, ImpactSummary } from "@/components/ai/InterventionCenter";
import { profileFor } from "@/lib/cellProfiles";

function machineStatusLabel(m: MachineState): { label: string; tone: string } {
  if (m.isolated) return { label: "STOPPED · ISOLATED", tone: "downtime" };
  if (m.status === "downtime") return { label: m.breakdownTick !== undefined ? "BROKEN DOWN" : "IN MAINTENANCE", tone: "downtime" };
  if (m.status === "critical") return { label: "RUNNING · CRITICAL", tone: "critical" };
  if (m.status === "warning") return { label: "RUNNING · DEGRADED", tone: "warning" };
  return { label: "RUNNING", tone: "healthy" };
}

/** Plain-language guidance for the operator, from the intervention state or the latest ML risk. */
function recommendation(m: MachineState, iv: Intervention | null, prob: number | null, workerStatus?: string): string {
  if (iv) {
    const tech = iv.technician?.name ?? "the maintenance crew";
    switch (iv.phase) {
      case "OBSERVING":
      case "ANOMALY_DETECTED":
        return `AI is watching ${m.code}'s rising temperature and vibration. Keep monitoring.`;
      case "PREDICTING":
      case "REASONING":
        return `Failure risk is rising. Be ready to stop ${m.code}.`;
      case "PLANNING":
      case "AWAITING_APPROVAL":
        return `Stop ${m.code} and initiate maintenance — waiting for supervisor approval (you may e-stop the machine).`;
      case "ACTING":
      case "RECOVERY":
        return workerStatus === "moving"
          ? `${m.code} is isolated. ${tech} is on the way to replace the bearing — do not restart.`
          : `${m.code} is isolated. ${tech} is performing the simulated bearing replacement — do not restart.`;
      case "VERIFYING":
        return "Repair done. AI is verifying temperature, vibration, health and ML risk before restart.";
      case "RECOVERED":
        return `${m.code} verified healthy — production resumed.`;
      case "FAILED":
        return `${m.code} broke down — wait for maintenance before restarting.`;
    }
  }
  if (prob !== null && prob >= 0.55) return `Stop ${m.code} and request maintenance.`;
  if (m.status === "critical") return "Critical condition — request maintenance now.";
  if (m.status === "warning") return "Degrading — keep an eye on temperature and wear.";
  return "Operating within normal limits.";
}

function ChainNeighbour({ m, role }: { m: MachineState | undefined; role: "Upstream" | "Downstream" }) {
  const endLabel = role === "Upstream" ? "Raw material inbound" : "Finished goods";
  return (
    <div className="op-chain-node">
      <span className="op-chain-role">{role}</span>
      {m ? (
        <>
          <strong>{m.code} · {m.shortLabel}</strong>
          <span className={`sim-status-pill ${m.status}`}>{machineStatusLabel(m).label}</span>
          <span className="op-chain-meta">queue {m.queue} / {m.capacity}</span>
        </>
      ) : (
        <strong>{endLabel}</strong>
      )}
    </div>
  );
}

/**
 * Operator "My Workcell" — an operator runs one machine, so they get that
 * machine in detail, its AI assessment and machine-level actions only.
 */
export default function OperatorMachineView({ machineCode }: { machineCode: string }) {
  const { user, usersList } = useAuth();
  const { state, agent, wallClock, wallDate, dispatchMaintenance, ai, mlHealth } = useSim();
  const [report, setReport] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const m = state.machines.find((mm) => mm.code === machineCode);
  if (!m) {
    return (
      <div className="sim-hub-banner">
        <div className="sim-banner-desc">Machine {machineCode} was not found on the simulated floor.</div>
      </div>
    );
  }

  const idx = CHAIN.indexOf(m.id);
  const upstream = idx > 0 ? state.machines.find((x) => x.id === CHAIN[idx - 1]) : undefined;
  const downstream = idx >= 0 && idx < CHAIN.length - 1 ? state.machines.find((x) => x.id === CHAIN[idx + 1]) : undefined;
  const pred = agent.latest?.ml?.[m.code];
  const iv = ai.intervention?.machineCode === m.code ? ai.intervention : null;
  const ivActive = !!iv && !["RECOVERED", "FAILED"].includes(iv.phase);
  const prob = iv?.latestPrediction?.failureProbability ?? pred?.failureProbability ?? null;
  const status = machineStatusLabel(m);
  const technician = state.activeWorkers.find((w) => w.targetMachineCode === m.code);
  const events = state.events
    .filter((e) => e.machineId === m.id || e.msg.includes(m.code))
    .slice(0, 12);

  const simHours = Math.max(1 / 120, (state.tick * state.simSecondsPerTick) / 3600);
  const uptimePct = state.tick ? (m.upTicks / state.tick) * 100 : 100;
  const step = FLOW_STEPS[state.currentPart.currentStepIndex];
  const currentJob = step?.key === m.id
    ? `${state.currentPart.id} ${state.currentPart.name}`
    : m.queue > 0 ? `${m.queue} part${m.queue > 1 ? "s" : ""} queued` : "Waiting for parts";

  const hist = m.history;
  const profile = profileFor(m);
  const ctx = { upstream, downstream };
  const checks = profile.checks.map((c) => ({ label: c.label, ok: c.ok(m, ctx), detail: c.detail(m, ctx) }));
  const crew = usersList.filter((u) => u.role === "USER" && u.assignedMachine === m.code);
  const agvs = state.agvs.filter((a) => a.fromStation === m.id || a.toStation === m.id);
  const isWarehouse = m.kind === "warehouse";
  const CHARTS = {
    temp: { label: "TEMPERATURE °C", val: m.temperature.toFixed(1), data: hist.map((h) => h.temp), color: "var(--danger)" },
    vib: { label: "VIBRATION mm/s", val: m.vibration.toFixed(2), data: hist.map((h) => h.vib), color: "var(--warning)" },
    health: { label: "HEALTH %", val: m.health.toFixed(0), data: hist.map((h) => h.health), color: "var(--success)" },
    speed: { label: `${profile.speedLabel.toUpperCase()} ${profile.speedUnit}`, val: m.rpm.toFixed(0), data: hist.map((h) => h.rpm), color: "var(--primary)" },
    wear: { label: `${profile.wearLabel.toUpperCase()} %`, val: m.toolWear.toFixed(0), data: hist.map((h) => h.wear), color: "#B85A1F" },
    queue: { label: profile.queueLabel.toUpperCase(), val: String(m.queue), data: hist.map((h) => h.queue), color: "#4A6D8C" },
  };
  const sendReport = async () => {
    if (!user?.supervisorId) return;
    setReport("sending");
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorId: user.supervisorId,
          from: "operator",
          fromName: user.name,
          type: "alert",
          severity: m.status === "critical" ? "crit" : "warn",
          machineCode: m.code,
          title: `${m.code} reported by operator`,
          body: `${user.name} reports ${issueFor(m).toLowerCase()} on ${m.label}. Health ${m.health.toFixed(0)}%, ${m.temperature.toFixed(1)}°C, vibration ${m.vibration.toFixed(2)} mm/s · ${wallClock}.`,
        }),
      });
      const j = await res.json();
      setReport(j.ok ? "sent" : "failed");
    } catch {
      setReport("failed");
    }
    setTimeout(() => setReport("idle"), 4000);
  };

  return (
    <>
      {/* Banner: operator, cell, status and machine-level actions */}
      <div className="sim-hub-banner">
        <div style={{ flex: 1 }}>
          <div className="sim-banner-tag">
            <FontAwesomeIcon icon={faUserGear} style={{ fontSize: 10 }} /> MY WORKCELL · {user?.name ?? "Operator"}
            {user?.shift ? ` · SHIFT ${user.shift}` : ""}
          </div>
          <h1 className="sim-banner-heading">
            <FontAwesomeIcon icon={faIndustry} style={{ color: "var(--primary)" }} />
            {m.code} <span className="highlight">{m.label}</span>
          </h1>
          <div className="sim-banner-desc">
            {profile.role}. {profile.task}
            {!state.running && " · Simulation paused by supervisor."}
          </div>
        </div>
        <div className="sim-controls-toolbar op-actions">
          <span className={`sim-status-pill ${status.tone}`} style={{ fontSize: 12, padding: "5px 12px" }}>● {status.label}</span>
          {iv && ivActive && !iv.acknowledgedBy && (
            <button className="sim-btn danger-btn" onClick={() => ai.acknowledge(m.code)}>
              <FontAwesomeIcon icon={faEye} /> Acknowledge alert
            </button>
          )}
          {!m.isolated ? (
            <button className="sim-btn danger-btn" onClick={() => ai.stopMachine(m.code)} disabled={!state.running || m.status === "downtime"}>
              <FontAwesomeIcon icon={faHand} /> Stop machine
            </button>
          ) : (
            <button className="sim-btn" onClick={() => ai.resumeMachine(m.code)} disabled={!!m.failure || (ivActive && !!iv?.actingAt)}
              title={m.failure ? "The fault must be repaired before restart" : ivActive ? "AI restarts the machine after verification" : ""}>
              <FontAwesomeIcon icon={faPlay} /> Restart machine
            </button>
          )}
          <button className="sim-btn play-state" onClick={() => dispatchMaintenance(m.id)} disabled={m.status === "downtime" || ivActive}
            title={ivActive ? "The AI has already opened a maintenance mission for this machine" : ""}>
            <FontAwesomeIcon icon={faScrewdriverWrench} /> {ivActive ? "Maintenance mission open" : "Request maintenance"}
          </button>
          <button className="sim-btn" onClick={sendReport} disabled={!user?.supervisorId || report === "sending"}
            title={user?.supervisorId ? "Send this machine's condition to your supervisor's inbox" : "No supervisor linked to your account"}>
            <FontAwesomeIcon icon={report === "sent" ? faCircleCheck : faBullhorn} />{" "}
            {report === "sent" ? "Sent to supervisor" : report === "failed" ? "Couldn't send" : report === "sending" ? "Sending…" : "Report to supervisor"}
          </button>
        </div>
        <div className="sim-hero-clock">
          <FontAwesomeIcon icon={faClock} className="sim-hero-clock-icon" />
          <div>
            <div className="sim-hero-clock-label">SIMULATION TIME</div>
            <div className="sim-hero-clock-value">{wallDate} · {wallClock}</div>
          </div>
        </div>
      </div>

      {/* AI intervention affecting this machine */}
      {iv && (
        <div className="ai-center op-intervention">
          <div className="ai-center-head">
            <div>
              <span className="ai-eyebrow"><FontAwesomeIcon icon={faRobot} /> AI INTERVENTION ON YOUR MACHINE · {iv.id}</span>
              <h2>{iv.failureLabel}</h2>
            </div>
            <PhaseBadge phase={iv.phase} />
          </div>
          <StageStepper iv={iv} compact />
          {(iv.phase === "RECOVERED" || iv.phase === "FAILED") && <ImpactSummary iv={iv} />}
        </div>
      )}

      <div className="op-grid">
        {/* Detailed machine */}
        <div className="sim-floor-card">
          <div className="sim-floor-header">
            <span className="mp-eyebrow">LIVE MACHINE · DETAILED VIEW</span>
            {m.faultTag && m.status !== "healthy" && <span className="sim-fault-badge">{m.faultTag}</span>}
          </div>
          <div className="op-machine-stage">
            <MachineSVG m={m} />
          </div>
          <div className="op-stat-grid">
            <div><span>Health</span><strong className={m.health < 45 ? "op-crit" : ""}>{m.health.toFixed(0)}%</strong></div>
            <div><span>{profile.speedLabel}</span><strong>{m.rpm.toFixed(0)} {profile.speedUnit}</strong></div>
            <div><span>Temperature</span><strong className={m.temperature > 78 ? "op-crit" : ""}>{m.temperature.toFixed(1)} °C</strong></div>
            <div><span>Vibration</span><strong className={m.vibration > 2.2 ? "op-crit" : ""}>{m.vibration.toFixed(2)} mm/s</strong></div>
            <div><span>{profile.wearLabel}</span><strong>{m.toolWear.toFixed(0)}%</strong></div>
            {isWarehouse ? (
              <div><span>{profile.queueLabel}</span><strong>{m.queue} blanks</strong></div>
            ) : (
              <div><span>Production</span><strong>{(m.produced / simHours).toFixed(0)} parts/h</strong></div>
            )}
            <div><span>Current job</span><strong className="op-small">{currentJob}</strong></div>
            <div><span>Shift</span><strong>{user?.shift ? `Shift ${user.shift}` : "—"}</strong></div>
            <div><span>Uptime</span><strong>{uptimePct.toFixed(0)}%</strong></div>
          </div>

          <div className="op-profile">
            <div className="op-profile-col">
              <span className="mp-eyebrow">OPERATOR CHECKS · {m.shortLabel.toUpperCase()}</span>
              <ul className="op-checks">
                {checks.map((c) => (
                  <li key={c.label} className={c.ok ? "ok" : "bad"}>
                    <span className="op-check-mark">{c.ok ? "✓" : "⚠"}</span>
                    <span>{c.label}</span>
                    <span className="op-check-val">{c.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="op-profile-col">
              <span className="mp-eyebrow">CELL DETAILS</span>
              <dl className="op-spec">
                {!isWarehouse && <><dt>Rated {profile.speedLabel.toLowerCase()}</dt><dd>{m.targetRpm} {profile.speedUnit}</dd></>}
                <dt>{isWarehouse ? "Storage capacity" : "Input buffer"}</dt><dd>{m.capacity}{isWarehouse ? " blanks" : " parts"}</dd>
                <dt>AGV serving this cell</dt>
                <dd>{agvs.length ? agvs.map((a) => `${a.code} (${a.currentAction})`).join(" · ") : "Conveyor / robot transfer"}</dd>
                <dt>Cell crew</dt>
                <dd>
                  {crew.length
                    ? crew.map((u) => `${u.name}${u.shift ? ` (shift ${u.shift})` : ""}${u.id === user?.id ? " — you" : ""}`).join(" · ")
                    : user?.name}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* AI machine health + line context */}
        <div className="op-side">
          <div className="sim-ai-inference-card op-ai-card">
            <div className="sim-ai-inference-title">
              <FontAwesomeIcon icon={faRobot} /> AI MACHINE HEALTH · {m.code}
            </div>
            <div className="op-ai-metrics">
              <div><span>Failure probability</span><strong className={(prob ?? 0) >= 0.55 ? "op-crit" : ""}>{prob !== null ? `${(prob * 100).toFixed(1)}%` : "—"}</strong></div>
              <div><span>Health</span><strong>{m.health.toFixed(0)}%</strong></div>
              <div><span>Risk</span><strong>{(iv?.latestPrediction ?? pred)?.riskLevel ?? "—"}</strong></div>
              <div><span>Status</span><strong>{iv?.phase === "RECOVERED" ? "RECOVERED" : (prob ?? 0) >= 0.55 || m.status === "critical" ? "FAILURE PREDICTED" : m.status === "warning" ? "DEGRADING" : "NORMAL"}</strong></div>
            </div>
            <div className="op-reco">
              <strong>AI recommendation:</strong> “{recommendation(m, iv, prob, technician?.status)}”
            </div>
            <div className="ai-muted small">
              {(iv?.latestPrediction ?? pred)?.operationalStatus ? `Random Forest: ${(iv?.latestPrediction ?? pred)?.operationalStatus} · ` : ""}
              {technician ? `Technician ${technician.name}: ${technician.status.replace("_", " ")} · ` : ""}
              ML service {mlHealth.online === false ? "OFFLINE (fallback)" : "online"}
            </div>
          </div>

          <div className="sim-floor-card">
            <div className="sim-floor-header">
              <span className="mp-eyebrow">MY POSITION ON THE LINE</span>
            </div>
            <div className="sim-floor-viewport">
              <FactoryFloorSVG
                machines={state.machines}
                agvs={state.agvs}
                currentPart={state.currentPart}
                activeWorkers={state.activeWorkers}
              reroute={state.reroute}
                onInspect={() => {}}
                focusMachineId={m.id}
              />
            </div>
            <div className="op-chain">
              <ChainNeighbour m={upstream} role="Upstream" />
              <FontAwesomeIcon icon={faArrowRight} className="op-chain-arrow" />
              <div className="op-chain-node self">
                <span className="op-chain-role">Your workcell</span>
                <strong>{m.code}</strong>
                <span className="op-chain-meta">{m.shortLabel}</span>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="op-chain-arrow" />
              <ChainNeighbour m={downstream} role="Downstream" />
            </div>
          </div>
        </div>
      </div>

      {/* Live telemetry from the simulation */}
      <div className="sim-modal-charts-grid op-charts">
        {profile.charts.map((k) => (
          <ChartCard key={k} label={CHARTS[k].label} val={CHARTS[k].val} data={CHARTS[k].data} color={CHARTS[k].color} />
        ))}
      </div>

      <div className="op-grid">
        <div className="sim-scada-panel">
          <div className="sim-scada-header">
            <span className="mp-eyebrow">AI INTERVENTION TIMELINE · {m.code}</span>
          </div>
          <div className="op-log">
            {iv ? <InterventionTimeline entries={iv.timeline} /> : <div className="sim-log-msg" style={{ padding: 10 }}>No AI intervention on this machine.</div>}
          </div>
        </div>

        <div className="sim-scada-panel">
          <div className="sim-scada-header">
            <span className="mp-eyebrow">MACHINE EVENT LOG · {m.code}</span>
          </div>
          <div className="sim-scada-logs-container op-log">
            {events.length === 0 && <div className="sim-log-msg" style={{ padding: 10 }}>No events for this machine yet.</div>}
            {events.map((ev) => (
              <div key={`${ev.t}-${ev.msg}`} className={`sim-log-item ${ev.kind}`}>
                <span className="sim-log-time">{ev.wallClock}</span>
                <span className="sim-log-icon">{ev.icon || "•"}</span>
                <div className="sim-log-body">
                  <span className="sim-log-msg">{ev.msg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
