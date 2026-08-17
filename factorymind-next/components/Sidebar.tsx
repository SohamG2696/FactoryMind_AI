"use client";

import { useAuth, ROLE_PERMISSIONS } from "@/context/AuthContext";
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


export const navItems = [
  { icon: faHouse,              label: "Dashboard",     minRole: "USER" },
  { icon: faMicrochip,          label: "Digital Twin",  minRole: "USER" },
  { icon: faRobot,              label: "AI Agent",      minRole: "SUPERVISOR" },
  { icon: faSliders,            label: "ML Workbench",  minRole: "SUPERVISOR" },
  { icon: faGears,              label: "Machines",      minRole: "USER" },
  { icon: faChartLine,          label: "Analytics",     minRole: "USER" },
  { icon: faScrewdriverWrench,  label: "Maintenance",   minRole: "USER" },
  { icon: faBell,               label: "Alerts",        minRole: "USER" },
  { icon: faFileLines,          label: "Reports",       minRole: "USER" },
  { icon: faUser,               label: "Users",         minRole: "SUPERVISOR" },
  { icon: faGear,               label: "Settings",      minRole: "SUPERVISOR" },
];

interface SidebarProps {
  active: number;
  onSelect: (index: number) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export default function Sidebar({ active, onSelect, isOpen, setIsOpen }: SidebarProps) {
  const { user, role, canAccessSection, switchRole } = useAuth();
  const currentRoleInfo = ROLE_PERMISSIONS[role];

  const handleSelect = (index: number) => {
    onSelect(index);
    if (setIsOpen && window.innerWidth <= 1024) {
      setIsOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <div className="logo">
        <FontAwesomeIcon
          icon={faIndustry}
          style={{ fontSize: 48, color: "#ffffff" }}
        />
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
              title={!hasAccess ? `Requires ${item.minRole} role or higher` : item.label}
            >
              <FontAwesomeIcon icon={item.icon} style={{ width: 20 }} />
              <span className="sidebar-item-label">{item.label}</span>
              {!hasAccess && (
                <span className="sidebar-lock-badge" title="Restricted Access">
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: 11 }} />
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Sidebar Footer User Card with Quick Switcher */}
      <div className="sidebar-user-card">
        <div className="sidebar-user-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"}
            alt={user?.name || "User"}
            className="sidebar-avatar"
          />
          <div className="sidebar-user-meta">
            <h4>{user?.name || "Active Session"}</h4>
            <p>{user?.title || "Industrial Operator"}</p>
          </div>
        </div>

        <div className="sidebar-quick-role-switch">
          <div className="quick-switch-label">Switch Role View:</div>
          <div className="quick-switch-buttons">
            <button
              className={`quick-role-btn ${role === "ADMIN" ? "active" : ""}`}
              onClick={() => switchRole("ADMIN")}
              title="Switch to Administration role"
            >
              ADM
            </button>
            <button
              className={`quick-role-btn ${role === "SUPERVISOR" ? "active" : ""}`}
              onClick={() => switchRole("SUPERVISOR")}
              title="Switch to Supervisor role"
            >
              SUP
            </button>
            <button
              className={`quick-role-btn ${role === "USER" ? "active" : ""}`}
              onClick={() => switchRole("USER")}
              title="Switch to User (Operator) role"
            >
              USR
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}


