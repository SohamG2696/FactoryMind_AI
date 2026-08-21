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

import FactoryMindLogo from "@/components/FactoryMindLogo";

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
            <FactoryMindLogo width={26} height={40} id="lp_header_logo" />
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

            {/* FactoryMind Single Sign-On / Select Account Button */}
            <button
              className="lp-signin-btn"
              onClick={() => setAuthModalOpen(true)}
              disabled={transitioning}
            >
              <FactoryMindLogo width={14} height={20} id="lp_btn_logo" />
              <span style={{ marginLeft: 4 }}>
                {isAuthenticated && user ? "Switch Account" : "Select Account / SSO"}
              </span>
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
