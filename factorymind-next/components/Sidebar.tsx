"use client";

import { Fragment, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, ROLE_PERMISSIONS, UserRole } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faMicrochip,
  faRobot,
  faChartLine,
  faGear,
  faIndustry,
  faSliders,
  faLock,
  faChevronLeft,
  faFlaskVial,
  faPeopleGroup,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

import FactoryMindLogo from "@/components/FactoryMindLogo";

// Navigation follows the demo story: Monitor -> Predict & Decide -> Operate -> Admin.
// `section` items are index-based views inside DashboardClient's activeSection switch
// (the index is also what ROLE_PERMISSIONS.allowedSections refers to);
// `route` items navigate to a separate URL.
export interface NavItem {
  code: string;
  icon: typeof faHouse;
  label: string;
  minRole: UserRole;
  tag: string;
  group: string;
  section?: number;
  route?: string;
}

export const navItems: NavItem[] = [
  { code: "01", icon: faHouse,       label: "Dashboard",       minRole: "USER",       tag: "HUD",   group: "Monitor",            section: 0 },
  { code: "02", icon: faMicrochip,   label: "Digital Twin",    minRole: "USER",       tag: "TWIN",  group: "Monitor",            section: 1 },
  { code: "03", icon: faIndustry,    label: "Live Simulation", minRole: "USER",       tag: "SIM",   group: "Monitor",            route: "/simulation" },
  { code: "04", icon: faRobot,       label: "AI Agent",        minRole: "SUPERVISOR", tag: "AGENT", group: "Predict & Decide",   section: 2 },
  { code: "05", icon: faFlaskVial,   label: "Scenario Lab",    minRole: "USER",       tag: "WHAT-IF", group: "Predict & Decide", route: "/scenario" },
  { code: "06", icon: faSliders,     label: "ML Workbench",    minRole: "ADMIN",      tag: "ML",    group: "Predict & Decide",   section: 3 },
  { code: "07", icon: faChartLine,   label: "Analytics",       minRole: "SUPERVISOR", tag: "DATA",  group: "Operate",            section: 4 },
  { code: "08", icon: faPeopleGroup, label: "Manpower",        minRole: "USER",       tag: "CREW",  group: "Operate",            route: "/manpower" },
  { code: "09", icon: faUserShield,  label: "Users & Access",  minRole: "ADMIN",      tag: "RBAC",  group: "Admin",              section: 5 },
  { code: "10", icon: faGear,        label: "Settings",        minRole: "ADMIN",      tag: "CONF",  group: "Admin",              section: 6 },
];

interface SidebarProps {
  active: number;
  onSelect: (index: number) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export default function Sidebar({ active, onSelect, isOpen, setIsOpen }: SidebarProps) {
  const { user, role, canAccessSection } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [targetSwitchRole, setTargetSwitchRole] = useState<UserRole | null>(null);

  const currentRoleInfo = ROLE_PERMISSIONS[role];

  const closeOnMobile = () => {
    if (setIsOpen && window.innerWidth <= 1024) {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: NavItem) => {
    // Route items live in the app router — no numbered-section RBAC gating.
    if (item.route) {
      router.push(item.route);
      closeOnMobile();
      return;
    }

    const section = item.section!;
    if (!canAccessSection(section)) {
      // Prompt password authentication for the required role
      setTargetSwitchRole(item.minRole);
      setAuthModalOpen(true);
      return;
    }

    onSelect(section);
    closeOnMobile();
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
            const hasAccess = item.route ? true : canAccessSection(item.section!);
            const isActive = item.route ? pathname === item.route : active === item.section;
            const startsGroup = i === 0 || navItems[i - 1].group !== item.group;

            return (
              <Fragment key={item.label}>
                {startsGroup && <li className="sidebar-group-label">{item.group}</li>}
                <li
                  className={`${isActive ? "active" : ""} ${!hasAccess ? "restricted-item" : ""}`}
                  onClick={() => handleSelect(item)}
                  title={!hasAccess ? `Requires ${item.minRole} password authentication` : item.label}
                >
                  <span className="sidebar-item-code">{item.code}</span>
                  <FontAwesomeIcon icon={item.icon} className="sidebar-item-icon" />
                  <span className="sidebar-item-label">
                    {role === "USER" && item.route === "/simulation" ? "My Workcell" : item.label}
                  </span>
                  {item.tag && <span className="sidebar-item-tag">{item.tag}</span>}
                  {!hasAccess && (
                    <span className="sidebar-lock-badge" title={`Locked — ${item.minRole} password required`}>
                      <FontAwesomeIcon icon={faLock} style={{ fontSize: 10 }} />
                    </span>
                  )}
                </li>
              </Fragment>
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

        {/* System Status Indicator */}
        <div className="sidebar-system-status">
          <span className="status-dot-pulse" />
          <span>System Operational</span>
        </div>
      </aside>
    </>
  );
}
