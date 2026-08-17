"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole, ROLE_PERMISSIONS } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield,
  faUserTie,
  faUserGear,
  faRightToBracket,
  faCircleUser,
  faArrowRight,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

export default function LandingPage() {
  const [transitioning, setTransitioning] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("ADMIN");
  const router = useRouter();
  const { user, quickLoginAsRole, isAuthenticated } = useAuth();

  const handleEnterDashboard = (roleToUse?: UserRole) => {
    if (transitioning) return;
    const targetRole = roleToUse || selectedRole;
    quickLoginAsRole(targetRole);
    setTransitioning(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1100);
  };

  const currentRoleConfig = ROLE_PERMISSIONS[selectedRole];

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => handleEnterDashboard()}
      />

      {/* Door grow overlay — expands to fill screen */}
      {transitioning && (
        <div className="door-grow" aria-hidden="true" />
      )}

      <div className={`landing-stage${transitioning ? " lp-fading" : ""}`}>
        {/* Video Background */}
        <div className="plate">
          <video
            className="plate-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4"
              type="video/mp4"
            />
          </video>
        </div>

        {/* Top Header with Brand on Left & Auth on Right */}
        <header className="lp-header">
          <div className="lp-brand">
            <svg
              width="28"
              height="42"
              viewBox="0 0 31.5 48.5"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="bg1lp"
                  x1="8"
                  y1="0"
                  x2="34.1"
                  y2="28.9"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" stopColor="#9e9e9e" />
                  <stop offset=".28" stopColor="#a6a6a6" />
                  <stop offset=".40" stopColor="#3a3a3a" />
                  <stop offset=".60" stopColor="#7a7a7a" />
                  <stop offset=".80" stopColor="#a9a9a9" />
                  <stop offset="1" stopColor="#cccccc" />
                </linearGradient>
              </defs>
              <path
                d="M21.5 0 L21.5 19.5 L31.5 19.5 L31.5 29 L10 48.5 L10 28.5 L0.5 28.5 L0.5 18.5 Z"
                fill="url(#bg1lp)"
              />
              <rect x="0.5" y="18.5" width="9" height="10" fill="#fdfdfd" />
              <rect x="22" y="19.5" width="9.5" height="9.5" fill="#fdfdfd" />
            </svg>
            <span className="lp-brand-name">FactoryMind AI</span>
          </div>

          <div className="lp-auth-actions">
            {isAuthenticated && user ? (
              <div
                className="lp-user-pill"
                onClick={() => setAuthModalOpen(true)}
                title="Active identity — click to switch"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar} alt={user.name} className="lp-user-avatar" />
                <div className="lp-user-info">
                  <span className="lp-user-name">{user.name}</span>
                  <span className={`role-badge-pill role-badge-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </div>
              </div>
            ) : null}

            <button
              className="lp-signin-btn"
              onClick={() => setAuthModalOpen(true)}
              disabled={transitioning}
            >
              <FontAwesomeIcon icon={faRightToBracket} />
              <span>{isAuthenticated ? "Switch Account" : "Sign In"}</span>
            </button>
          </div>
        </header>

        {/* Hero Section (Left-Aligned, Framed Cleanly) */}
        <main className="lp-hero">
          <div className="lp-content-card">
            <div className="lp-eyebrow">
              <span className="lp-dot" />
              <span>INDUSTRY 4.0 &nbsp;·&nbsp; DIGITAL TWIN &nbsp;·&nbsp; 3-ROLE RBAC</span>
            </div>

            <h1 className="lp-title">
              Autonomous Smart Factory <span>Intelligence</span>
            </h1>

            <p className="lp-desc">
              Real-time digital twin monitoring and autonomous predictive AI tailored for <strong>Administration</strong>, <strong>Supervisors</strong>, and <strong>Operators</strong>.
            </p>

            {/* Interactive 3-Role Fast-Track Selector */}
            <div className="lp-role-section">
              <div className="lp-role-section-header">
                <FontAwesomeIcon icon={faShieldHalved} style={{ color: currentRoleConfig.color, fontSize: 13 }} />
                <span>Select Access Clearance:</span>
              </div>

              <div className="lp-role-tabs">
                <button
                  type="button"
                  className={`lp-role-tab admin ${selectedRole === "ADMIN" ? "active" : ""}`}
                  onClick={() => setSelectedRole("ADMIN")}
                >
                  <FontAwesomeIcon icon={faUserShield} className="role-tab-icon" />
                  <div className="role-tab-meta">
                    <strong>Administration</strong>
                    <span>Full System Control</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`lp-role-tab supervisor ${selectedRole === "SUPERVISOR" ? "active" : ""}`}
                  onClick={() => setSelectedRole("SUPERVISOR")}
                >
                  <FontAwesomeIcon icon={faUserTie} className="role-tab-icon" />
                  <div className="role-tab-meta">
                    <strong>Supervisor</strong>
                    <span>Shift & Operations</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`lp-role-tab user ${selectedRole === "USER" ? "active" : ""}`}
                  onClick={() => setSelectedRole("USER")}
                >
                  <FontAwesomeIcon icon={faUserGear} className="role-tab-icon" />
                  <div className="role-tab-meta">
                    <strong>Operator</strong>
                    <span>Floor Telemetry</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="lp-actions">
              <button
                className="lp-cta"
                onClick={() => handleEnterDashboard(selectedRole)}
                disabled={transitioning}
                id="enter-dashboard-btn"
              >
                <span>Launch Dashboard as {currentRoleConfig.name}</span>
                <FontAwesomeIcon icon={faArrowRight} className="lp-cta-arrow" />
              </button>

              {/* Stats row */}
              <div className="lp-stats">
                <div className="lp-stat">
                  <strong>26</strong>
                  <span>Active Machines</span>
                </div>
                <div className="lp-divider" />
                <div className="lp-stat">
                  <strong>318</strong>
                  <span>IoT Sensors</span>
                </div>
                <div className="lp-divider" />
                <div className="lp-stat">
                  <strong>97%</strong>
                  <span>AI Accuracy</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom bar */}
        <div className="lp-bottom-bar">
          <span>Powered by Agentic AI</span>
          <span className="lp-sep">·</span>
          <span>Dual-Model Predictive Maintenance</span>
          <span className="lp-sep">·</span>
          <span>ISO/IEC Industrial Security Standards</span>
        </div>
      </div>
    </>
  );
}


