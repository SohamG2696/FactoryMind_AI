"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();

  const handleEnterDashboard = () => {
    if (transitioning) return;
    setTransitioning(true);
    // Wait for the door panels to slide apart, then navigate
    setTimeout(() => {
      router.push("/dashboard");
    }, 1100);
  };

  return (
    <>
      {/* Door grow overlay — white rectangle starts at door position, expands to fill screen */}
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

        {/* Top-Left Brand */}
        <header className="lp-header">
          <div className="lp-brand">
            <svg
              width="26"
              height="40"
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
        </header>

        {/* Hero */}
        <main className="lp-hero">
          <div className="lp-content">
            <div className="lp-eyebrow">
              <span className="lp-dot" />
              INDUSTRY 4.0 &nbsp;·&nbsp; DIGITAL TWIN &nbsp;·&nbsp; PREDICTIVE
              AI
            </div>

            <h1 className="lp-title">FactoryMind AI</h1>

            <p className="lp-sub">
              Autonomous Digital Twin Platform
              <br />
              for Smart Factory Intelligence
            </p>

            <p className="lp-desc">
              Monitor every machine in real-time. Predict failures before they
              happen. Automate maintenance with AI agents — all from one unified
              dashboard.
            </p>

            <div className="lp-actions">
              <button
                className="lp-cta"
                onClick={handleEnterDashboard}
                disabled={transitioning}
                id="enter-dashboard-btn"
              >
                Enter Dashboard
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              <div className="lp-stats">
                <div className="lp-stat">
                  <strong>26</strong>
                  <span>Machines</span>
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
          <span>Real-Time Digital Twin</span>
          <span className="lp-sep">·</span>
          <span>Predictive Maintenance</span>
        </div>
      </div>
    </>
  );
}
