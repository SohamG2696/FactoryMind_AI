"use client";

import { useState } from "react";
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
  { icon: faHouse,              label: "Dashboard",       minRole: "USER" },
  { icon: faMicrochip,          label: "Digital Twin",    minRole: "USER" },
  { icon: faRobot,              label: "AI Agent",        minRole: "SUPERVISOR" },
  { icon: faSliders,            label: "ML Workbench",    minRole: "ADMIN" },
  { icon: faGears,              label: "Machines",        minRole: "USER" },
  { icon: faChartLine,          label: "Analytics",       minRole: "SUPERVISOR" },
  { icon: faScrewdriverWrench,  label: "Maintenance",     minRole: "USER" },
  { icon: faBell,               label: "Alerts",          minRole: "USER" },
  { icon: faFileLines,          label: "Reports",         minRole: "SUPERVISOR" },
  { icon: faUser,               label: "Users & Access",  minRole: "ADMIN" },
  { icon: faGear,               label: "Settings",        minRole: "ADMIN" },
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
          <FactoryMindLogo width={32} height={48} id="sidebar_logo" />
          <h2>FactoryMind AI</h2>
          <span className="sidebar-sub-badge">Industry 4.0 Suite</span>

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
                <FontAwesomeIcon icon={item.icon} style={{ width: 20 }} />
                <span className="sidebar-item-label">{item.label}</span>
                {!hasAccess && (
                  <span className="sidebar-lock-badge" title={`Locked — ${item.minRole} password required`}>
                    <FontAwesomeIcon icon={faLock} style={{ fontSize: 11 }} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>

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
      </aside>
    </>
  );
}
