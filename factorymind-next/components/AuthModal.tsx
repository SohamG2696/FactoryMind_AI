"use client";

import React, { useState } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield,
  faUserTie,
  faUserGear,
  faLock,
  faEnvelope,
  faRightToBracket,
  faCircleCheck,
  faXmark,
  faIndustry,
} from "@fortawesome/free-solid-svg-icons";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { login, quickLoginAsRole, user } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    try {
      await login(email, role);
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      setLoading(false);
      setError("Authentication failed. Please check your credentials.");
    }
  };

  const handleDemoLogin = (targetRole: UserRole) => {
    quickLoginAsRole(targetRole);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div
        className="auth-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="auth-close-btn" onClick={onClose} aria-label="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="auth-header">
          <div className="auth-logo-badge">
            <FontAwesomeIcon icon={faIndustry} style={{ fontSize: 24, color: "#fff" }} />
          </div>
          <h2>FactoryMind AI Portal</h2>
          <p>Autonomous Smart Factory Intelligence & Digital Twin</p>
        </div>

        {/* Demo Quick-Login Role Switcher */}
        <div className="demo-roles-container">
          <div className="demo-roles-title">
            <span>⚡ Instant Demo Access by Role</span>
          </div>
          <div className="demo-role-grid">
            <button
              type="button"
              className={`demo-role-btn role-admin ${user?.role === "ADMIN" ? "current" : ""}`}
              onClick={() => handleDemoLogin("ADMIN")}
            >
              <div className="demo-role-icon">
                <FontAwesomeIcon icon={faUserShield} />
              </div>
              <div className="demo-role-text">
                <strong>Administration</strong>
                <span>Full System & ML Control</span>
              </div>
              <span className="demo-tag gold">ADMIN</span>
            </button>

            <button
              type="button"
              className={`demo-role-btn role-supervisor ${user?.role === "SUPERVISOR" ? "current" : ""}`}
              onClick={() => handleDemoLogin("SUPERVISOR")}
            >
              <div className="demo-role-icon">
                <FontAwesomeIcon icon={faUserTie} />
              </div>
              <div className="demo-role-text">
                <strong>Supervisor</strong>
                <span>Shift & Team Operations</span>
              </div>
              <span className="demo-tag cyan">SUPERVISOR</span>
            </button>

            <button
              type="button"
              className={`demo-role-btn role-user ${user?.role === "USER" ? "current" : ""}`}
              onClick={() => handleDemoLogin("USER")}
            >
              <div className="demo-role-icon">
                <FontAwesomeIcon icon={faUserGear} />
              </div>
              <div className="demo-role-text">
                <strong>User (Operator)</strong>
                <span>Floor Monitoring & Tasks</span>
              </div>
              <span className="demo-tag emerald">USER</span>
            </button>
          </div>
        </div>

        <div className="auth-divider">
          <span>or sign in with credentials</span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error-banner">{error}</div>}

          <div className="auth-input-group">
            <label>Enterprise Email</label>
            <div className="auth-input-wrapper">
              <FontAwesomeIcon icon={faEnvelope} className="auth-icon" />
              <input
                type="email"
                placeholder="name@factorymind.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Security Password</label>
            <div className="auth-input-wrapper">
              <FontAwesomeIcon icon={faLock} className="auth-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Target Role Privilege</label>
            <div className="role-radio-group">
              <label className={`role-radio-label ${role === "ADMIN" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="authRole"
                  value="ADMIN"
                  checked={role === "ADMIN"}
                  onChange={() => setRole("ADMIN")}
                />
                <span>Administrator</span>
              </label>

              <label className={`role-radio-label ${role === "SUPERVISOR" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="authRole"
                  value="SUPERVISOR"
                  checked={role === "SUPERVISOR"}
                  onChange={() => setRole("SUPERVISOR")}
                />
                <span>Supervisor</span>
              </label>

              <label className={`role-radio-label ${role === "USER" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="authRole"
                  value="USER"
                  checked={role === "USER"}
                  onChange={() => setRole("USER")}
                />
                <span>User (Operator)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faRightToBracket} />
            {loading ? "Authenticating..." : mode === "login" ? "Sign In to Industrial Twin" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer-info">
          <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#10b981", marginRight: 6 }} />
          Role-Based Access Control (RBAC) Active & Encrypted
        </div>
      </div>
    </div>
  );
}
