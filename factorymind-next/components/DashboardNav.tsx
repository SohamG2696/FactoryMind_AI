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
  const { user, role, switchRole, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
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

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
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
          <div>
            <h1>FactoryMind AI</h1>
            <p>{pageTitle || "Agentic Digital Twin Platform"}</p>
          </div>
        </div>


        <div className="nav-right">
          <div className="clock">
            <FontAwesomeIcon icon={faClock} /> <span id="clock">{time}</span>
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
                src={user?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"}
                alt={user?.name || "User avatar"}
              />
              <div>
                <div className="profile-title-row">
                  <h3>{user?.name || "Dr. Sarah Chen"}</h3>
                  <span className={`role-badge-pill role-badge-${role.toLowerCase()}`}>
                    {role}
                  </span>
                </div>
                <p>{user?.title || "Factory Manager"}</p>
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
                  <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 6 }} />
                  Active Security Role
                </div>

                <div className="dropdown-role-options">
                  <button
                    className={`dropdown-role-btn ${role === "ADMIN" ? "selected admin" : ""}`}
                    onClick={() => handleRoleChange("ADMIN")}
                  >
                    <FontAwesomeIcon icon={faUserShield} className="role-icon-amber" />
                    <div className="role-btn-info">
                      <span className="role-btn-title">Administration</span>
                      <span className="role-btn-desc">Full system, users & ML control</span>
                    </div>
                    {role === "ADMIN" && <FontAwesomeIcon icon={faCircleCheck} className="check-icon" />}
                  </button>

                  <button
                    className={`dropdown-role-btn ${role === "SUPERVISOR" ? "selected supervisor" : ""}`}
                    onClick={() => handleRoleChange("SUPERVISOR")}
                  >
                    <FontAwesomeIcon icon={faUserTie} className="role-icon-cyan" />
                    <div className="role-btn-info">
                      <span className="role-btn-title">Supervisor</span>
                      <span className="role-btn-desc">Shift oversight & work orders</span>
                    </div>
                    {role === "SUPERVISOR" && <FontAwesomeIcon icon={faCircleCheck} className="check-icon" />}
                  </button>

                  <button
                    className={`dropdown-role-btn ${role === "USER" ? "selected user" : ""}`}
                    onClick={() => handleRoleChange("USER")}
                  >
                    <FontAwesomeIcon icon={faUserGear} className="role-icon-emerald" />
                    <div className="role-btn-info">
                      <span className="role-btn-title">User (Operator)</span>
                      <span className="role-btn-desc">Floor monitoring & checklist tasks</span>
                    </div>
                    {role === "USER" && <FontAwesomeIcon icon={faCircleCheck} className="check-icon" />}
                  </button>
                </div>

                <div className="dropdown-divider" />

                <div className="dropdown-actions">
                  <button
                    className="dropdown-action-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      setAuthModalOpen(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faRotate} />
                    Switch User / Login
                  </button>

                  <button
                    className="dropdown-action-btn logout"
                    onClick={handleLogout}
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    Sign Out
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

