"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMissions } from "@/hooks/useMissions";
import { useWorkers } from "@/hooks/useWorkers";
import { useInbox } from "@/hooks/useInbox";
import FactoryMindLogo from "@/components/FactoryMindLogo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faHouse, faIndustry, faRobot, faClock, faShieldHalved,
  faBrain, faListCheck, faScrewdriverWrench, faLayerGroup, faSignal,
  faCircleCheck, faTriangleExclamation, faEye, faLightbulb, faBolt,
  faChartLine, faInbox, faEnvelope, faEnvelopeOpen, faUserShield,
  faUserTie, faUserGear, faGears,
} from "@fortawesome/free-solid-svg-icons";

interface AgentDecision {
  id: string;
  timestamp: string;
  agentName: string;
  phase: string;
  machineCode?: string;
  reasoning?: string;
  actionCount?: number;
  llmUsed?: boolean;
  snapshot?: { tick?: number; oee?: number; wip?: number };
}

const ROLE_ICON: Record<string, any> = {
  ADMIN: faUserShield,
  SUPERVISOR: faUserTie,
  USER: faUserGear,
};

const AUTONOMY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  SAFE: { color: "#3F7A5F", bg: "rgba(63,122,95,0.12)", label: "AUTONOMOUS" },
  APPROVAL_REQUIRED: { color: "#C87D1F", bg: "rgba(200,125,31,0.14)", label: "APPROVAL REQ." },
  HUMAN_REQUIRED: { color: "#B23A3A", bg: "rgba(178,58,58,0.14)", label: "HUMAN REQ." },
};

const AGENT_COLORS: Record<string, string> = {
  MaintenanceAgent: "#B23A3A",
  ProductionAgent: "#FF5A1F",
  MaterialAgent: "#4A6D8C",
  WorkforceAgent: "#3F7A5F",
  SafetyAgent: "#7A2626",
  SupervisorAgent: "#7C3AED",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ProfileClient() {
  const { user, role } = useAuth();
  const { missions } = useMissions({ intervalMs: 6000 });
  const { workers } = useWorkers(6000);
  const supervisorId = role === "SUPERVISOR" ? user?.id : undefined;
  const { messages, unreadCount, markRead, resolve } = useInbox(supervisorId);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [loadingDecisions, setLoadingDecisions] = useState(true);
  const [wallClock, setWallClock] = useState("");

  useEffect(() => {
    const tick = () => setWallClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const res = await fetch("/api/agent/decisions?limit=40", { cache: "no-store" });
        const json = await res.json();
        if (json?.ok) setDecisions(json.decisions || []);
      } catch { /* swallow */ }
      finally { setLoadingDecisions(false); }
    };
    fetchDecisions();
    const id = setInterval(fetchDecisions, 6000);
    return () => clearInterval(id);
  }, []);

  const openMissions = useMemo(
    () => missions.filter((m) => m.status !== "complete" && m.status !== "cancelled"),
    [missions]
  );
  const criticalMissions = openMissions.filter((m) => m.priority === "critical");
  const completedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return missions.filter((m) => m.status === "complete" && new Date(m.createdAt) >= today).length;
  }, [missions]);

  const workersOnTask = workers.filter((w) => w.status === "moving" || w.status === "on_task" || w.status === "verifying");
  const llmDecisions = decisions.filter((d) => d.llmUsed).length;
  const llmPct = decisions.length > 0 ? Math.round((llmDecisions / decisions.length) * 100) : 0;

  // Group decisions by agent for the mini bar
  const agentStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of decisions) map.set(d.agentName, (map.get(d.agentName) || 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [decisions]);

  // Compute "recent activity" section grouping — supervisors see inbox, admins see decisions
  const showInbox = role === "SUPERVISOR" && supervisorId;

  return (
    <div className="sim-page-wrapper">
      <div className="background-grid" />

      <header className="sim-topbar">
        <div className="sim-topbar-brand">
          <FactoryMindLogo width={32} height={32} />
          <div>
            <div className="sim-brand-title">FactoryMind AI</div>
            <div className="sim-brand-subtitle">PROFILE · AI ACTIVITY FEED</div>
          </div>
        </div>
        <div className="sim-topbar-center">
          <span className="dt-pulse" />
          <span>LIVE FROM MONGODB · AGENT_DECISIONS · MISSIONS</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard" className="sim-nav-btn primary"><FontAwesomeIcon icon={faArrowLeft} /><span>Dashboard</span></Link>
          <Link href="/simulation" className="sim-nav-btn secondary"><FontAwesomeIcon icon={faIndustry} /><span>Simulation</span></Link>
          <Link href="/" className="sim-nav-btn secondary"><FontAwesomeIcon icon={faHouse} /><span>Home</span></Link>
        </div>
      </header>

      <main className="sim-main-container">
        {/* Profile hero */}
        <div className="profile-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user?.avatar} alt={user?.name || "User"} className="profile-avatar" />
          <div className="profile-hero-body">
            <div className="profile-hero-role">
              <FontAwesomeIcon icon={ROLE_ICON[role]} />
              <span>{role}</span>
              <span className="profile-hero-dept">{user?.department}</span>
            </div>
            <h1 className="profile-hero-name">{user?.name || "Signed-out session"}</h1>
            <div className="profile-hero-title">{user?.title}</div>
            <div className="profile-hero-meta">
              <span><FontAwesomeIcon icon={faInbox} style={{ marginRight: 4 }} />{user?.email}</span>
              <span><FontAwesomeIcon icon={faClock} style={{ marginRight: 4 }} />{wallClock}</span>
            </div>
          </div>
          <div className="profile-hero-actions">
            <Link href="/manpower" className="sim-btn">
              <FontAwesomeIcon icon={faScrewdriverWrench} /> Workforce Control
            </Link>
            <Link href="/simulation" className="sim-btn play-state">
              <FontAwesomeIcon icon={faIndustry} /> Open Digital Twin
            </Link>
          </div>
        </div>

        {/* KPI strip — 5 real cards */}
        <div className="sim-kpi-mini mp-5">
          <MpKpi icon={faBrain} label="AI DECISIONS (last)" value={String(decisions.length)} sub={`${llmDecisions} used LLM (${llmPct}%)`} />
          <MpKpi icon={faLayerGroup} label="OPEN MISSIONS" value={String(openMissions.length)} sub={`${criticalMissions.length} critical`} statusDot={criticalMissions.length > 0 ? "var(--danger)" : "var(--success)"} />
          <MpKpi icon={faCircleCheck} label="COMPLETED TODAY" value={String(completedToday)} sub="mission cycles closed" />
          <MpKpi icon={faGears} label="WORKERS ON TASK" value={String(workersOnTask.length)} sub={`of ${workers.length} total`} />
          <MpKpi icon={faSignal} label={showInbox ? "UNREAD INBOX" : "AGENT SIGNAL"} value={showInbox ? String(unreadCount) : (llmPct + "%")} sub={showInbox ? "personal alerts" : "LLM adoption"} statusDot={showInbox && unreadCount > 0 ? "var(--warning)" : "var(--success)"} />
        </div>

        {/* Main grid: AI decision feed + right sidebar (open missions + inbox for sups) */}
        <div className="sim-grid-layout">
          <div className="mp-grid-card sim-floor-card">
            <div className="sim-floor-header">
              <span className="mp-eyebrow">
                <FontAwesomeIcon icon={faRobot} style={{ marginRight: 6, color: "var(--primary)" }} />
                AI DECISION FEED · LAST {decisions.length}
              </span>
              <span className="mp-legend" style={{ fontSize: 10 }}>
                Direct from <code style={{ fontFamily: "var(--font-mono)", color: "var(--primary-dark)" }}>agent_decisions</code> in Mongo
              </span>
            </div>

            {/* Per-agent activity bars */}
            {agentStats.length > 0 && (
              <div className="profile-agent-bars">
                {agentStats.map(([name, count]) => {
                  const pct = (count / decisions.length) * 100;
                  return (
                    <div key={name} className="profile-agent-bar">
                      <span className="profile-agent-bar-name" style={{ color: AGENT_COLORS[name] || "#7A7770" }}>
                        {name}
                      </span>
                      <div className="profile-agent-bar-track">
                        <div className="profile-agent-bar-fill" style={{ width: `${pct}%`, background: AGENT_COLORS[name] || "#7A7770" }} />
                      </div>
                      <span className="profile-agent-bar-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {loadingDecisions && <div className="mp-empty-state">Loading decisions…</div>}

            {!loadingDecisions && decisions.length === 0 && (
              <div className="mp-empty-state">
                <FontAwesomeIcon icon={faLightbulb} style={{ fontSize: 20, color: "var(--text-muted)" }} />
                <div>No agent decisions yet.</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Open <Link href="/simulation" style={{ color: "var(--primary)" }}>/simulation</Link> — the Coordinator ticks every 6s.
                </div>
              </div>
            )}

            <div className="profile-decision-list">
              {decisions.map((d) => (
                <div key={d.id} className="profile-decision">
                  <div className="profile-decision-time">
                    <FontAwesomeIcon icon={faClock} style={{ fontSize: 10, opacity: 0.6 }} />
                    {new Date(d.timestamp).toLocaleTimeString("en-GB", { hour12: false })}
                    <span className="profile-decision-age">{timeAgo(d.timestamp)}</span>
                  </div>
                  <div className="profile-decision-body">
                    <div className="profile-decision-head">
                      <span className="profile-decision-agent" style={{ color: AGENT_COLORS[d.agentName] || "#7A7770" }}>
                        {d.agentName}
                      </span>
                      <span className="profile-decision-phase">{d.phase.toUpperCase()}</span>
                      {d.llmUsed && (
                        <span className="profile-decision-llm">
                          <FontAwesomeIcon icon={faBrain} style={{ fontSize: 9 }} /> GROQ
                        </span>
                      )}
                      {typeof d.actionCount === "number" && (
                        <span className="profile-decision-count">{d.actionCount} action{d.actionCount !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <div className="profile-decision-reason">{d.reasoning || "—"}</div>
                    {d.snapshot && (
                      <div className="profile-decision-snap">
                        tick {d.snapshot.tick} · OEE {d.snapshot.oee ? (d.snapshot.oee * 100).toFixed(0) + "%" : "—"} · WIP {d.snapshot.wip ?? "—"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="sim-scada-panel mp-ai-panel" style={{ maxHeight: "none" }}>
            <div className="sim-scada-header">
              <span style={{ fontSize: 12, color: "var(--text-main)", letterSpacing: "0.08em", fontWeight: 800 }}>
                <FontAwesomeIcon icon={faListCheck} style={{ color: "var(--primary)", marginRight: 6 }} />
                {showInbox ? "MY INBOX" : "OPEN MISSIONS"}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {showInbox ? `${unreadCount} unread` : `${openMissions.length} active`}
              </span>
            </div>

            {showInbox ? (
              messages.length === 0 ? (
                <div className="mp-empty-state" style={{ padding: 20 }}>
                  <FontAwesomeIcon icon={faEnvelopeOpen} style={{ fontSize: 20, color: "var(--text-muted)" }} />
                  <div style={{ fontSize: 12 }}>Inbox clear.</div>
                </div>
              ) : (
                <div className="profile-inbox-list">
                  {messages.slice(0, 8).map((m) => {
                    const sev = m.severity;
                    const c = sev === "crit" ? "#B23A3A" : sev === "warn" ? "#C87D1F" : "#4A6D8C";
                    return (
                      <div key={m.id} className={`profile-inbox-item ${m.read ? "read" : "unread"}`} style={{ borderLeftColor: c }}>
                        <div className="profile-inbox-head">
                          <span className="profile-inbox-title">{m.title}</span>
                          <span className="profile-inbox-sev" style={{ color: c, borderColor: c }}>{sev.toUpperCase()}</span>
                        </div>
                        <div className="profile-inbox-body">{m.body}</div>
                        <div className="profile-inbox-actions">
                          <span className="profile-inbox-time">{timeAgo(m.createdAt)}</span>
                          {!m.read && (
                            <button className="inbox-btn" onClick={() => markRead(m.id)}>
                              <FontAwesomeIcon icon={faEnvelopeOpen} /> Mark read
                            </button>
                          )}
                          {!m.resolvedAt && (
                            <button className="inbox-btn ok" onClick={() => resolve(m.id)}>
                              <FontAwesomeIcon icon={faCircleCheck} /> Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              openMissions.length === 0 ? (
                <div className="mp-empty-state" style={{ padding: 20 }}>
                  <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 20, color: "var(--success)" }} />
                  <div style={{ fontSize: 12 }}>No open missions — plant is nominal.</div>
                </div>
              ) : (
                <div className="profile-mission-list">
                  {openMissions.slice(0, 8).map((m) => {
                    const auto = AUTONOMY_STYLE[m.autonomyLevel] || AUTONOMY_STYLE.SAFE;
                    return (
                      <div key={m.id} className="profile-mission-item">
                        <div className="profile-mission-head">
                          <span className="profile-mission-id">{m.id}</span>
                          <span className="profile-mission-cell">{m.machineCode}</span>
                          <span className="profile-mission-status">{m.status.toUpperCase()}</span>
                        </div>
                        <div className="profile-mission-reason">
                          {m.agentReasoning?.slice(0, 140)}{(m.agentReasoning?.length || 0) > 140 ? "…" : ""}
                        </div>
                        <div className="profile-mission-footer">
                          <span className="profile-mission-autonomy" style={{ color: auto.color, background: auto.bg, borderColor: auto.color }}>
                            {auto.label}
                          </span>
                          <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            {m.assignedWorkerName ? `→ ${m.assignedWorkerName}` : "unassigned"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function MpKpi({ icon, label, value, sub, statusDot }: { icon: any; label: string; value: string; sub?: string; statusDot?: string }) {
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
    </div>
  );
}
