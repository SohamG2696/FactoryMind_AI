"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, ROLE_PERMISSIONS, UserRole } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faMicrochip,
  faRobot,
  faGears,
  faChartLine,
  faScrewdriverWrench,
  faBell,
  faFileLines,
  faUser,
  faGear,
  faIndustry,
  faSliders,
  faLock,
  faShieldHalved,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

import FactoryMindLogo from "@/components/FactoryMindLogo";

export const navItems = [
  { code: "01", icon: faHouse,              label: "Dashboard",       minRole: "USER", tag: "HUD" },
  { code: "02", icon: faMicrochip,          label: "Digital Twin",    minRole: "USER", tag: "TWIN" },
  { code: "03", icon: faRobot,              label: "AI Agent",        minRole: "SUPERVISOR", tag: "AGENT" },
  { code: "04", icon: faSliders,            label: "ML Workbench",    minRole: "ADMIN", tag: "ML" },
  { code: "05", icon: faGears,              label: "Machines",        minRole: "USER", tag: "CELLS" },
  { code: "06", icon: faChartLine,          label: "Analytics",       minRole: "SUPERVISOR", tag: "DATA" },
  { code: "07", icon: faScrewdriverWrench,  label: "Maintenance",     minRole: "USER", tag: "PLAN" },
  { code: "08", icon: faBell,               label: "Alerts",          minRole: "USER", tag: "SCADA" },
  { code: "09", icon: faFileLines,          label: "Reports",         minRole: "SUPERVISOR", tag: "DOCS" },
  { code: "10", icon: faUser,               label: "Users & Access",  minRole: "ADMIN", tag: "RBAC" },
  { code: "11", icon: faGear,               label: "Settings",        minRole: "ADMIN", tag: "CONF" },
];

interface SidebarProps {
  active: number;
  onSelect: (index: number) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export default function Sidebar({ active, onSelect, isOpen, setIsOpen }: SidebarProps) {
  const { user, role, canAccessSection } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [targetSwitchRole, setTargetSwitchRole] = useState<UserRole | null>(null);

  const currentRoleInfo = ROLE_PERMISSIONS[role];

  const handleSelect = (index: number) => {
    const hasAccess = canAccessSection(index);
    if (!hasAccess) {
      // Prompt password authentication for the required role
      const minRoleNeeded = navItems[index].minRole as UserRole;
      setTargetSwitchRole(minRoleNeeded);
      setAuthModalOpen(true);
      return;
    }

    onSelect(index);
    if (setIsOpen && window.innerWidth <= 1024) {
      setIsOpen(false);
    }
  };

  const handleQuickRoleClick = (targetRole: UserRole) => {
    if (targetRole === role) return;
    setTargetSwitchRole(targetRole);
    setAuthModalOpen(true);
  };

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        targetRole={targetSwitchRole}
      />

      <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
        <div className="logo">
          <FactoryMindLogo width={34} height={34} className="sidebar-brand-logo" />
          <div className="sidebar-brand-text">
            <h2>FactoryMind</h2>
            <span className="sidebar-sub-badge">DIGITAL TWIN AI</span>
          </div>

          {setIsOpen && (
            <button
              className="sidebar-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Collapse Sidebar"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          )}
        </div>

        <div className="sidebar-role-indicator">
          <span className="role-indicator-dot" style={{ background: currentRoleInfo.color }} />
          <span className="role-indicator-title">{currentRoleInfo.name}</span>
          <span className={`role-badge-pill role-badge-${role.toLowerCase()}`}>
            {role}
          </span>
        </div>

        <ul>
          {navItems.map((item, i) => {
            const hasAccess = canAccessSection(i);
            const isActive = active === i;

            return (
              <li
                key={item.label}
                className={`${isActive ? "active" : ""} ${!hasAccess ? "restricted-item" : ""}`}
                onClick={() => handleSelect(i)}
                title={!hasAccess ? `Requires ${item.minRole} password authentication` : item.label}
              >
                <span className="sidebar-item-code">{item.code}</span>
                <FontAwesomeIcon icon={item.icon} className="sidebar-item-icon" />
                <span className="sidebar-item-label">{item.label}</span>
                {item.tag && <span className="sidebar-item-tag">{item.tag}</span>}
                {!hasAccess && (
                  <span className="sidebar-lock-badge" title={`Locked — ${item.minRole} password required`}>
                    <FontAwesomeIcon icon={faLock} style={{ fontSize: 10 }} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {/* Live Simulation route link (external to numbered sections) */}
        <Link
          href="/simulation"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "8px 12px 4px 12px",
            padding: "10px 12px",
            background: "linear-gradient(90deg, rgba(167,139,250,0.18), rgba(56,189,248,0.12))",
            border: "1px solid rgba(167,139,250,0.45)",
            borderRadius: 8,
            color: "#A78BFA",
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
            boxShadow: "0 0 18px rgba(167,139,250,0.15)",
          }}
          title="Open live factory simulation"
        >
          <FontAwesomeIcon icon={faIndustry} />
          <span style={{ flex: 1 }}>Live Simulation</span>
          <span
            style={{
              fontSize: 8,
              padding: "2px 5px",
              background: "#4ADE8033",
              color: "#4ADE80",
              border: "1px solid #4ADE8066",
              borderRadius: 3,
              letterSpacing: "0.1em",
            }}
          >
            NEW
          </span>
        </Link>

        {/* Sidebar Footer User Card with Secure Quick Switcher */}
        <div className="sidebar-user-card">
          <div className="sidebar-user-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user?.avatar || "https://ui-avatars.com/api/?name=Admin&background=1c1917&color=f59e0b&bold=true&rounded=true&size=150"}
              alt={user?.name || "User"}
              className="sidebar-avatar"
            />
            <div className="sidebar-user-meta">
              <h4>{user?.name || "Active Session"}</h4>
              <p>{user?.title || "Industrial Operator"}</p>
            </div>
          </div>

          <div className="sidebar-quick-role-switch">
            <div className="quick-switch-label">Switch Role (Password Required):</div>
            <div className="quick-switch-buttons">
              <button
                className={`quick-role-btn ${role === "ADMIN" ? "active" : ""}`}
                onClick={() => handleQuickRoleClick("ADMIN")}
                title="Authenticate as Administrator"
              >
                ADM
              </button>
              <button
                className={`quick-role-btn ${role === "SUPERVISOR" ? "active" : ""}`}
                onClick={() => handleQuickRoleClick("SUPERVISOR")}
                title="Authenticate as Supervisor"
              >
                SUP
              </button>
              <button
                className={`quick-role-btn ${role === "USER" ? "active" : ""}`}
                onClick={() => handleQuickRoleClick("USER")}
                title="Authenticate as Operator"
              >
                USR
              </button>
            </div>
          </div>
        </div>

        {/* System Status Indicator */}
        <div className="sidebar-system-status">
          <span className="status-dot-pulse" />
          <span>System Operational</span>
        </div>
      </aside>
    </>
  );
}
