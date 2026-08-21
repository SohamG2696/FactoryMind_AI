"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightToBracket,
  faArrowRight,
  faCircleUser,
} from "@fortawesome/free-solid-svg-icons";

export default function LandingPage() {
  const [transitioning, setTransitioning] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const handleEnterDashboard = () => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1100);
  };

  const handleLoginCtaClick = () => {
    // Always open auth modal with password challenge before proceeding
    setAuthModalOpen(true);
  };

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleEnterDashboard}
        preSelectedUser={user || null}
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
                title="Selected Account — click to change or verify password"
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

            {/* Google Single Sign-On / Select Account Button */}
            <button
              className="lp-signin-btn"
              onClick={() => setAuthModalOpen(true)}
              disabled={transitioning}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: 4 }}>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAuthenticated && user ? "Switch Account" : "Select Account / SSO"}</span>
            </button>
          </div>
        </header>

        {/* Hero Section (Clean text on natural background) */}
        <main className="lp-hero">
          <div className="lp-content-card">
            <div className="lp-eyebrow">
              <span className="lp-dot" />
              <span>INDUSTRY 4.0 &nbsp;·&nbsp; DIGITAL TWIN &nbsp;·&nbsp; SECURE RBAC</span>
            </div>

            <h1 className="lp-title">
              Autonomous Smart Factory <span>Intelligence</span>
            </h1>

            <p className="lp-desc">
              Real-time digital twin monitoring and autonomous predictive AI with strict role clearance for <strong>4 Executive Administrators</strong>, <strong>4 Shift Supervisors</strong>, and factory <strong>Operators</strong>.
            </p>

            {/* Launch CTA */}
            <div className="lp-actions" style={{ marginTop: 24 }}>
              <button
                className="lp-cta"
                onClick={handleLoginCtaClick}
                disabled={transitioning}
                id="enter-dashboard-btn"
              >
                <span>Login To Digital Twin</span>
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
          <span>Enterprise SSO · 4 Admin & 4 Supervisor Clearance Lock</span>
        </div>
      </div>
    </>
  );
}
