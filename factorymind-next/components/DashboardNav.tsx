"use client";

import { useState, useRef, useEffect } from "react";
import { useClock } from "@/hooks/useClock";
import { useAuth, UserRole, ROLE_PERMISSIONS } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import {
  faChevronDown,
  faRightFromBracket,
  faUserShield,
  faUserTie,
  faUserGear,
  faShieldHalved,
  faRotate,
  faCircleCheck,
  faBars,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

interface DashboardNavProps {
  pageTitle?: string;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function DashboardNav({ pageTitle, sidebarOpen, setSidebarOpen }: DashboardNavProps) {
  const time = useClock();
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [modalTargetRole, setModalTargetRole] = useState<UserRole | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRoleInfo = ROLE_PERMISSIONS[role];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRoleSwitchRequest = (targetRole: UserRole) => {
    setModalTargetRole(targetRole);
    setAuthModalOpen(true);
    setDropdownOpen(false);
  };

  const handleAccountSwitchRequest = () => {
    setModalTargetRole(null);
    setAuthModalOpen(true);
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        targetRole={modalTargetRole}
      />

      <nav className="dashboard-nav">
        <div className="nav-left-group">
          {setSidebarOpen && (
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Sidebar"
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          )}
          <div className="nav-title-block">
            <div className="nav-brand-row">
              <h1>FactoryMind AI</h1>
              <span className="nav-version-tag">TWIN v2.4</span>
            </div>
            <p>{pageTitle || "Agentic Digital Twin Platform"}</p>
          </div>
        </div>

        {/* Digital Twin Live Ticker Banner */}
        <div className="nav-twin-ticker">
          <div className="ticker-item">
            <span className="ticker-pulse-dot" />
            <span className="ticker-label">TWIN SYNC:</span>
            <span className="ticker-val">100% REALTIME</span>
          </div>
          <div className="ticker-sep">|</div>
          <div className="ticker-item hide-mobile">
            <span className="ticker-label">SCADA:</span>
            <span className="ticker-val">12ms MQTT</span>
          </div>
          <div className="ticker-sep hide-mobile">|</div>
          <div className="ticker-item hide-mobile">
            <span className="ticker-label">ACTIVE SENSORS:</span>
            <span className="ticker-val">318 / 318</span>
          </div>
        </div>

        <div className="nav-right">
          <div className="clock">
            <FontAwesomeIcon icon={faClock} className="clock-icon" /> <span id="clock">{time}</span>
          </div>

          {/* User Profile & Role Dropdown */}
          <div className="profile-container" ref={dropdownRef}>
            <div
              className={`profile ${dropdownOpen ? "profile-active" : ""}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              role="button"
              tabIndex={0}
              title="Click to view profile & switch role"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user?.avatar || "https://ui-avatars.com/api/?name=Admin&background=1c1917&color=f59e0b&bold=true&rounded=true&size=150"}
                alt={user?.name || "User avatar"}
              />
              <div>
                <div className="profile-title-row">
                  <h3>{user?.name || "Plant Personnel"}</h3>
                  <span className={`role-badge-pill role-badge-${role.toLowerCase()}`}>
                    {role}
                  </span>
                </div>
                <p>{user?.title || "Factory Staff"}</p>
              </div>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`profile-arrow ${dropdownOpen ? "rotated" : ""}`}
              />
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="nav-dropdown-menu">
                <div className="dropdown-user-header">
                  <div className="dropdown-user-name">{user?.name}</div>
                  <div className="dropdown-user-email">{user?.email}</div>
                  <div className="dropdown-user-dept">{user?.department}</div>
                </div>

                <div className="dropdown-divider" />

                <div className="dropdown-section-title">
                  <FontAwesomeIcon icon={faKey} style={{ marginRight: 6 }} />
                  Switch Clearance (Requires Password)
                </div>

                <div className="dropdown-role-options">
                  <button
                    className={`dropdown-role-btn ${role === "ADMIN" ? "selected admin" : ""}`}
                    onClick={() => handleRoleSwitchRequest("ADMIN")}
                  >
                    <FontAwesomeIcon icon={faUserShield} className="role-icon-amber" />
                    <div className="role-btn-info">
                      <span className="role-btn-title">Administration</span>
                      <span className="role-btn-desc">Full governance & ML control</span>
                    </div>
                    {role === "ADMIN" && <FontAwesomeIcon icon={faCircleCheck} className="check-icon" />}
                  </button>

                  <button
                    className={`dropdown-role-btn ${role === "SUPERVISOR" ? "selected supervisor" : ""}`}
                    onClick={() => handleRoleSwitchRequest("SUPERVISOR")}
                  >
                    <FontAwesomeIcon icon={faUserTie} className="role-icon-cyan" />
                    <div className="role-btn-info">
                      <span className="role-btn-title">Supervisor</span>
                      <span className="role-btn-desc">Shift oversight & maintenance</span>
                    </div>
                    {role === "SUPERVISOR" && <FontAwesomeIcon icon={faCircleCheck} className="check-icon" />}
                  </button>

                  <button
                    className={`dropdown-role-btn ${role === "USER" ? "selected user" : ""}`}
                    onClick={() => handleRoleSwitchRequest("USER")}
                  >
                    <FontAwesomeIcon icon={faUserGear} className="role-icon-emerald" />
                    <div className="role-btn-info">
                      <span className="role-btn-title">User (Operator)</span>
                      <span className="role-btn-desc">Floor cell machine telemetry</span>
                    </div>
                    {role === "USER" && <FontAwesomeIcon icon={faCircleCheck} className="check-icon" />}
                  </button>
                </div>

                <div className="dropdown-divider" />

                <div className="dropdown-actions">
                  <button className="dropdown-action-btn" onClick={handleAccountSwitchRequest}>
                    <FontAwesomeIcon icon={faRotate} />
                    Switch Identity / Account
                  </button>
                  <button className="dropdown-action-btn danger" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    Lock & Exit Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
