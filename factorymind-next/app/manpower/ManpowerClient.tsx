"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FactoryMindLogo from "@/components/FactoryMindLogo";
import { useWorkers, Worker } from "@/hooks/useWorkers";
import { useMissions, Mission } from "@/hooks/useMissions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faHouse, faIndustry, faPeopleGroup, faSpinner, faDatabase,
  faCircleCheck, faExclamation, faClock, faRobot, faShieldHalved,
  faLayerGroup, faSignal, faBell, faUserGear, faGears, faScrewdriverWrench,
  faTriangleExclamation, faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

const SKILL_LABELS: Record<string, { label: string; color: string }> = {
  mechanical: { label: "Mechanical", color: "#B23A3A" },
  electrical: { label: "Electrical", color: "#C87D1F" },
  robotics:   { label: "Robotics", color: "#7C3AED" },
  hydraulic:  { label: "Hydraulic", color: "#4A6D8C" },
  quality:    { label: "Quality", color: "#3F7A5F" },
  logistics:  { label: "Logistics", color: "#B85A1F" },
};

const AUTONOMY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  SAFE: { color: "#3F7A5F", bg: "rgba(63,122,95,0.12)", label: "AUTONOMOUS" },
  APPROVAL_REQUIRED: { color: "#C87D1F", bg: "rgba(200,125,31,0.14)", label: "APPROVAL REQ." },
  HUMAN_REQUIRED: { color: "#B23A3A", bg: "rgba(178,58,58,0.14)", label: "HUMAN REQ." },
};

const PRIORITY_STYLE: Record<string, string> = {
  critical: "#B23A3A", high: "#C87D1F", medium: "#4A6D8C", low: "#7A7770",
};

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function ManpowerClient() {
  const { workers, refresh: refreshWorkers } = useWorkers(5000);
  const { missions, refresh: refreshMissions, updateStatus, reassign } = useMissions({ intervalMs: 5000 });
  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wallClock, setWallClock] = useState("");
  const [draggingWorker, setDraggingWorker] = useState<string | null>(null);
  const [dropTargetMission, setDropTargetMission] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setWallClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const openMissions = useMemo(
    () => missions.filter((m) => m.status !== "complete" && m.status !== "cancelled"),
    [missions]
  );

  const completedRecent = useMemo(
    () => missions.filter((m) => m.status === "complete").slice(0, 5),
    [missions]
  );

  const available = workers.filter((w) => w.status === "available");
  const onTask = workers.filter((w) => w.status === "on_task" || w.status === "moving" || w.status === "verifying");
  const offShift = workers.filter((w) => w.status === "off_shift");

  // Skill coverage — % of skills that have at least 1 available worker
  const allSkills = Object.keys(SKILL_LABELS);
  const coveredSkills = allSkills.filter((s) => available.some((w) => w.skills.includes(s)));
  const coveragePct = Math.round((coveredSkills.length / allSkills.length) * 100);

  // Avg response time (avg mins from mission createdAt to first "assign" timeline entry)
  const responseTimes: number[] = [];
  for (const m of missions.slice(0, 30)) {
    const assign = m.timeline?.find((t) => t.status === "assign");
    if (assign) {
      const diff = new Date(assign.at).getTime() - new Date(m.createdAt).getTime();
      responseTimes.push(diff / 60000);
    }
  }
  const avgResp = responseTimes.length
    ? (responseTimes.reduce((s, x) => s + x, 0) / responseTimes.length).toFixed(1)
    : "—";

  const runSeed = async () => {
    setSeeding(true); setNotice(null); setError(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "seed failed");
      setNotice(`Seeded ${json.seeded.users} users, ${json.seeded.machines} machines, ${json.seeded.workers} workers.`);
      refreshWorkers(); refreshMissions();
    } catch (e: any) {
      setError(e?.message || "seed error");
    } finally {
      setSeeding(false);
    }
  };

  const handleDragStart = (workerId: string) => setDraggingWorker(workerId);
  const handleDragEnd = () => { setDraggingWorker(null); setDropTargetMission(null); };
  const handleDrop = async (missionId: string) => {
    if (!draggingWorker) return;
    const ok = await reassign(missionId, draggingWorker, "Drag-drop override on /manpower");
    if (ok) {
      setNotice(`Manual override recorded — ${draggingWorker} → ${missionId}. AI will re-evaluate on next tick.`);
      setTimeout(() => setNotice(null), 5000);
    }
    handleDragEnd();
  };

  return (
    <div className="sim-page-wrapper">
      <div className="background-grid" />

      <header className="sim-topbar">
        <div className="sim-topbar-brand">
          <FactoryMindLogo width={32} height={32} />
          <div>
            <div className="sim-brand-title">FactoryMind AI</div>
            <div className="sim-brand-subtitle">INTELLIGENT WORKFORCE CONTROL</div>
          </div>
        </div>
        <div className="sim-topbar-center">
          <span className="dt-pulse" />
          <span>HUMAN INTERVENTION AS A SERVICE · LIVE FROM MONGODB</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard" className="sim-nav-btn primary"><FontAwesomeIcon icon={faArrowLeft} /><span>Dashboard</span></Link>
          <Link href="/simulation" className="sim-nav-btn secondary"><FontAwesomeIcon icon={faIndustry} /><span>Simulation</span></Link>
          <Link href="/" className="sim-nav-btn secondary"><FontAwesomeIcon icon={faHouse} /><span>Home</span></Link>
        </div>
      </header>

      <main className="sim-main-container">
        {/* Hero */}
        <div className="sim-hub-banner">
          <div style={{ flex: 1 }}>
            <div className="sim-banner-tag">
              <FontAwesomeIcon icon={faDatabase} style={{ fontSize: 10 }} /> MONGODB · workers · missions · assignment_changes
            </div>
            <h1 className="sim-banner-heading">
              <FontAwesomeIcon icon={faPeopleGroup} style={{ color: "var(--primary)" }} />
              Intelligent <span className="highlight">Workforce Control</span>
            </h1>
            <div className="sim-banner-desc">
              Workers are HUMAN INTERVENTION RESOURCES, not floor staff. The Workforce Agent
              matches skills · certifications · zone · workload · experience to open missions.
              Drag a worker onto a mission card to override the AI's choice.
            </div>
          </div>
          <div className="sim-controls-toolbar">
            <button className="sim-btn" onClick={() => { refreshWorkers(); refreshMissions(); }}>Refresh</button>
            <button className="sim-btn play-state" onClick={runSeed} disabled={seeding}>
              <FontAwesomeIcon icon={seeding ? faSpinner : faDatabase} spin={seeding} />
              {seeding ? "Seeding…" : "Seed DB"}
            </button>
          </div>
          <div className="sim-hero-clock">
            <FontAwesomeIcon icon={faClock} className="sim-hero-clock-icon" />
            <div>
              <div className="sim-hero-clock-label">CONTROL ROOM CLOCK</div>
              <div className="sim-hero-clock-value">
                {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })} &nbsp;
                <span>{wallClock}</span>
              </div>
            </div>
          </div>
        </div>

        {notice && <div className="mp-notice ok"><FontAwesomeIcon icon={faCircleCheck} /> {notice}</div>}
        {error && <div className="mp-notice err"><FontAwesomeIcon icon={faExclamation} /> {error}</div>}

        {/* KPI strip — 6 cards, all live */}
        <div className="sim-kpi-mini mp-6">
          <MpKpi icon={faPeopleGroup} label="TOTAL WORKFORCE" value={String(workers.length)} sub={`${offShift.length} off shift`} />
          <MpKpi icon={faUserGear} label="AVAILABLE" value={String(available.length)} sub="ready to dispatch" statusDot="var(--success)" />
          <MpKpi icon={faScrewdriverWrench} label="ON TASK" value={String(onTask.length)} sub="active missions" statusDot={onTask.length > 0 ? "var(--warning)" : "var(--text-muted)"} />
          <MpKpi icon={faTriangleExclamation} label="OPEN MISSIONS" value={String(openMissions.length)} sub="awaiting resolution" />
          <MpKpi icon={faLayerGroup} label="SKILL COVERAGE" value={`${coveragePct}%`} sub={`${coveredSkills.length}/${allSkills.length} skills`} bar={coveragePct} />
          <MpKpi icon={faSignal} label="AVG RESPONSE" value={typeof avgResp === "string" ? avgResp : `${avgResp}m`} sub="detect → assign" />
        </div>

        {/* Main grid: active tasks + AI recommendations */}
        <div className="sim-grid-layout">
          <div className="mp-grid-card sim-floor-card">
            <div className="sim-floor-header">
              <span className="mp-eyebrow"><FontAwesomeIcon icon={faScrewdriverWrench} style={{ marginRight: 6, color: "var(--primary)" }} />ACTIVE HUMAN TASKS · {openMissions.length}</span>
              <span className="mp-legend" style={{ fontSize: 10 }}>
                Drop workers onto a task to override the AI
              </span>
            </div>

            {openMissions.length === 0 && (
              <div className="mp-empty-state">
                <FontAwesomeIcon icon={faCircleCheck} style={{ color: "var(--success)", fontSize: 24 }} />
                <div>No open missions — the plant is running autonomously.</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Trigger one from <Link href="/simulation" style={{ color: "var(--primary)" }}>/simulation</Link> (Surge, or Wear/Heat on a machine)
                </div>
              </div>
            )}

            <div className="mp-mission-list">
              {openMissions.map((m) => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  workers={workers}
                  onDropWorker={() => handleDrop(m.id)}
                  onDragOver={(e) => { e.preventDefault(); setDropTargetMission(m.id); }}
                  onDragLeave={() => setDropTargetMission(null)}
                  isDropTarget={dropTargetMission === m.id}
                  onAdvance={(next, note) => updateStatus(m.id, next, note)}
                />
              ))}
            </div>

            {completedRecent.length > 0 && (
              <>
                <div className="mp-section-divider">RECENTLY COMPLETED · {completedRecent.length}</div>
                <div className="mp-completed-strip">
                  {completedRecent.map((m) => (
                    <div key={m.id} className="mp-completed-chip">
                      <FontAwesomeIcon icon={faCircleCheck} style={{ color: "var(--success)" }} />
                      <b>{m.id}</b> · {m.machineCode}
                      <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
                        {m.assignedWorkerName || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* AI Recommendations + Workforce availability side panel */}
          <div className="sim-scada-panel mp-ai-panel" style={{ maxHeight: "none" }}>
            <div className="sim-scada-header">
              <span style={{ fontSize: 12, color: "var(--text-main)", letterSpacing: "0.08em", fontWeight: 800 }}>
                <FontAwesomeIcon icon={faRobot} style={{ color: "var(--primary)", marginRight: 6 }} />
                WORKFORCE AGENT
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>DETERMINISTIC</span>
            </div>

            {/* Skill availability strip */}
            <div className="mp-section-sub">SKILL AVAILABILITY</div>
            <div className="mp-skill-grid">
              {allSkills.map((skill) => {
                const meta = SKILL_LABELS[skill];
                const count = available.filter((w) => w.skills.includes(skill)).length;
                return (
                  <div key={skill} className="mp-skill-chip" style={{ borderLeftColor: meta.color }}>
                    <span className="mp-skill-name">{meta.label}</span>
                    <span className="mp-skill-count" style={{ color: count > 0 ? meta.color : "var(--text-muted)" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mp-section-sub">AI RECOMMENDATIONS</div>
            {openMissions.length === 0 ? (
              <div className="mp-suggestion info" style={{ marginTop: 6 }}>
                <div className="mp-suggestion-title"><FontAwesomeIcon icon={faShieldHalved} />All clear</div>
                <div className="mp-suggestion-body">No open missions and skill coverage at {coveragePct}%. No intervention required.</div>
              </div>
            ) : (
              openMissions.slice(0, 3).map((m) => {
                const rec = m.assignedWorkerId ? workers.find((w) => w.id === m.assignedWorkerId) : null;
                return (
                  <div key={m.id} className={`mp-suggestion ${m.autonomyLevel === "HUMAN_REQUIRED" ? "warn" : "info"}`}>
                    <div className="mp-suggestion-title">
                      <FontAwesomeIcon icon={faBell} />
                      {m.id} · {m.machineCode}
                    </div>
                    <div className="mp-suggestion-body">
                      {rec ? (
                        <>
                          Selected <b>{rec.name}</b> ({rec.id}) — skills {rec.skills.join("/")}, zone {rec.zone}, workload {(rec.workload * 100).toFixed(0)}%.
                        </>
                      ) : (
                        <>Waiting for Workforce Agent assignment. Required skills: {m.requiredSkills.join(", ") || "—"}.</>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Worker roster with drag handles */}
        <div className="mp-grid-card sim-floor-card">
          <div className="sim-floor-header">
            <span className="mp-eyebrow"><FontAwesomeIcon icon={faPeopleGroup} style={{ marginRight: 6, color: "var(--primary)" }} />WORKER ROSTER · {workers.length}</span>
            <span className="mp-legend" style={{ fontSize: 10 }}>
              <span><span className="mp-shift-dot A" /> Available</span>
              <span><span className="mp-shift-dot B" /> On task</span>
              <span><span className="mp-shift-dot C" /> Off shift</span>
            </span>
          </div>

          <div className="mp-worker-grid">
            {workers.map((w) => (
              <WorkerCard
                key={w.id}
                w={w}
                draggable={w.status === "available"}
                onDragStart={() => handleDragStart(w.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggingWorker === w.id}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ────────── mission card ────────── */
function MissionCard({
  mission, workers, onDropWorker, onDragOver, onDragLeave, isDropTarget, onAdvance,
}: {
  mission: Mission;
  workers: Worker[];
  onDropWorker: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  isDropTarget: boolean;
  onAdvance: (next: string, note?: string) => void;
}) {
  const autonomy = AUTONOMY_STYLE[mission.autonomyLevel] || AUTONOMY_STYLE.SAFE;
  const assigned = mission.assignedWorkerId ? workers.find((w) => w.id === mission.assignedWorkerId) : null;
  const priColor = PRIORITY_STYLE[mission.priority] || "#7A7770";
  const ml = mission.mlPrediction?.failureProbability;

  const nextStatus =
    mission.status === "diagnose" ? "plan"
    : mission.status === "plan" ? "assign"
    : mission.status === "assign" ? "execute"
    : mission.status === "execute" ? "verify"
    : mission.status === "verify" ? "complete"
    : null;

  return (
    <div
      className={`mp-mission-card ${isDropTarget ? "drop-target" : ""}`}
      onDrop={onDropWorker}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={{ borderLeftColor: priColor }}
    >
      <div className="mp-mission-head">
        <div>
          <div className="mp-mission-id">{mission.id}</div>
          <div className="mp-mission-title">
            {mission.machineCode} · {mission.type.replace(/_/g, " ")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span className="mp-mission-priority" style={{ color: priColor, borderColor: priColor }}>
            {mission.priority.toUpperCase()}
          </span>
          <span
            className="mp-mission-autonomy"
            style={{ color: autonomy.color, background: autonomy.bg, borderColor: autonomy.color }}
          >
            {autonomy.label}
          </span>
        </div>
      </div>

      {/* Status pipeline */}
      <div className="mp-mission-pipeline">
        {["detect", "diagnose", "plan", "assign", "execute", "verify", "complete"].map((s, i, arr) => {
          const currentIdx = arr.indexOf(mission.status);
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s} className={`mp-pipe-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
              <span className="mp-pipe-dot" />
              <span className="mp-pipe-label">{s.toUpperCase()}</span>
            </div>
          );
        })}
      </div>

      <div className="mp-mission-body">
        <div className="mp-mission-reason">{mission.agentReasoning || "—"}</div>

        <div className="mp-mission-meta">
          <span>Requires:{" "}
            {mission.requiredSkills.map((s) => (
              <span key={s} className="mp-req-pill">{s}</span>
            ))}
            {mission.requiredCertifications.map((c) => (
              <span key={c} className="mp-req-pill cert">{c}</span>
            ))}
          </span>
          {ml && (
            <span className="mp-mission-ml">
              ML failure prob <b>{Math.round(ml * 100)}%</b>
            </span>
          )}
          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
            Created {timeSince(mission.createdAt)}
          </span>
        </div>

        <div className="mp-mission-assigned">
          {assigned ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assigned.avatar} alt={assigned.name} className="mp-avatar" />
              <div style={{ flex: 1 }}>
                <div className="mp-sup-name">{assigned.name} <span style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 400 }}>· {assigned.id}</span></div>
                <div className="mp-sup-title">
                  {assigned.skills.join(" / ")} · zone {assigned.zone} · {(assigned.workload * 100).toFixed(0)}% load
                </div>
              </div>
              <span className="mp-worker-status" data-status={assigned.status}>{assigned.status.replace("_", " ")}</span>
            </>
          ) : (
            <div className="mp-mission-unassigned">
              <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: "var(--warning)" }} />
              Awaiting assignment — drag a worker here or wait for the next agent tick
            </div>
          )}
        </div>

        {nextStatus && (
          <div className="mp-mission-actions">
            <button
              className="sim-btn"
              onClick={() => onAdvance(nextStatus, "Manually advanced from /manpower")}
              title={`Advance mission to ${nextStatus}`}
            >
              Advance to {nextStatus} <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 4, fontSize: 10 }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────── worker card (draggable) ────────── */
function WorkerCard({
  w, draggable, onDragStart, onDragEnd, isDragging,
}: {
  w: Worker;
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const statusColor =
    w.status === "available" ? "var(--success)" :
    w.status === "off_shift" ? "var(--text-muted)" :
    "var(--warning)";
  return (
    <div
      className={`mp-worker-card ${draggable ? "draggable" : ""} ${isDragging ? "dragging" : ""}`}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", w.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <div className="mp-worker-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={w.avatar} alt={w.name} className="mp-avatar" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mp-sup-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {w.name} <span style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}>{w.id}</span>
          </div>
          <div className="mp-sup-title">Zone {w.zone} · Shift {w.shift} · {w.experienceYears}y</div>
        </div>
        <span className="mp-worker-status" data-status={w.status}>
          <span className="mp-shift-dot" style={{ background: statusColor }} />
          {w.status.replace("_", " ")}
        </span>
      </div>

      <div className="mp-worker-skills">
        {w.skills.map((s) => (
          <span key={s} className="mp-req-pill" style={{ borderColor: SKILL_LABELS[s]?.color, color: SKILL_LABELS[s]?.color }}>
            {SKILL_LABELS[s]?.label || s}
          </span>
        ))}
      </div>

      <div className="mp-worker-certs">
        {w.certifications.map((c) => (
          <span key={c} className="mp-req-pill cert">{c}</span>
        ))}
      </div>

      <div className="mp-worker-footer">
        <div className="mp-workload-bar-wrap">
          <div className="mp-workload-bar">
            <div className="mp-workload-fill" style={{ width: `${w.workload * 100}%`, background: w.workload > 0.7 ? "var(--danger)" : w.workload > 0.4 ? "var(--warning)" : "var(--success)" }} />
          </div>
          <span className="mp-workload-lbl">Load {(w.workload * 100).toFixed(0)}%</span>
        </div>
        {w.currentTarget && (
          <span className="mp-worker-current">
            <FontAwesomeIcon icon={faGears} style={{ fontSize: 10 }} /> {w.currentTarget}
          </span>
        )}
      </div>
    </div>
  );
}

/* ────────── KPI card ────────── */
function MpKpi({
  icon, label, value, sub, statusDot, bar,
}: {
  icon: any; label: string; value: string; sub?: string; statusDot?: string; bar?: number;
}) {
  return (
    <div className="sim-kpi-mini-card">
      <div className="sim-kpi-mini-head">
        <FontAwesomeIcon icon={icon} className="sim-kpi-mini-icon" />
        <span className="sim-kpi-mini-label">{label}</span>
      </div>
      <div className="sim-kpi-mini-body">
        <div className="sim-kpi-mini-value">{value}</div>
        {sub && (
          <span className="sim-kpi-mini-sub">
            {statusDot && <span className="sim-kpi-mini-dot" style={{ background: statusDot }} />}
            {sub}
          </span>
        )}
      </div>
      {typeof bar === "number" && (
        <div className="mp-kpi-bar">
          <div className="mp-kpi-bar-fill" style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}
