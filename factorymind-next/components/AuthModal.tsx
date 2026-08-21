"use client";

import React, { useState } from "react";
import { useAuth, UserAccount, UserRole } from "@/context/AuthContext";
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
  faArrowLeft,
  faShieldHalved,
  faBuildingUser,
  faKey,
} from "@fortawesome/free-solid-svg-icons";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const {
    login,
    selectUserAccount,
    user: activeUser,
    adminAccounts,
    supervisorAccounts,
    operatorAccounts,
    usersList,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"ALL" | "ADMIN" | "SUPERVISOR" | "USER">("ALL");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [password, setPassword] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAccountClick = (account: UserAccount) => {
    setSelectedUser(account);
    setPassword("");
    setError("");
  };

  const handleConfirmLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedUser && !customEmail) {
      setError("Please select an authorized account or enter your email.");
      return;
    }

    setLoading(true);

    try {
      if (selectedUser) {
        // Direct enterprise authorization for pre-assigned factory accounts
        selectUserAccount(selectedUser);
      } else {
        await login(customEmail, "USER");
      }

      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Authentication failed. Access restricted.");
    }
  };

  const filteredAccounts =
    activeTab === "ALL"
      ? usersList
      : activeTab === "ADMIN"
      ? adminAccounts
      : activeTab === "SUPERVISOR"
      ? supervisorAccounts
      : operatorAccounts;

  return (
    <div className="google-auth-backdrop" onClick={onClose}>
      <div
        className="google-auth-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top bar with close button */}
        <div className="google-auth-topbar">
          <button className="google-close-btn" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Google-style Header */}
        <div className="google-auth-header">
          {/* Google 4-Color G Emblem + Factory Logo */}
          <div className="google-logo-wrapper">
            <svg className="google-g-logo" viewBox="0 0 24 24" width="36" height="36">
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
          </div>

          <h2 className="google-auth-title">
            {selectedUser ? "Verify Password" : isCustomMode ? "Sign in with Email" : "Choose an account"}
          </h2>
          <p className="google-auth-subtitle">
            to continue to <strong style={{ color: "#38bdf8" }}>FactoryMind Industrial AI</strong>
          </p>
        </div>

        {error && <div className="google-error-alert">{error}</div>}

        {/* STEP 1: Account Chooser List */}
        {!selectedUser && !isCustomMode && (
          <div className="google-account-chooser">
            {/* Filter Tabs by Role */}
            <div className="google-role-filter-tabs">
              <button
                className={`google-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
                onClick={() => setActiveTab("ALL")}
              >
                All Accounts ({usersList.length})
              </button>
              <button
                className={`google-tab-btn admin ${activeTab === "ADMIN" ? "active" : ""}`}
                onClick={() => setActiveTab("ADMIN")}
              >
                👑 Admins ({adminAccounts.length})
              </button>
              <button
                className={`google-tab-btn supervisor ${activeTab === "SUPERVISOR" ? "active" : ""}`}
                onClick={() => setActiveTab("SUPERVISOR")}
              >
                🛡 Supervisors ({supervisorAccounts.length})
              </button>
              <button
                className={`google-tab-btn user ${activeTab === "USER" ? "active" : ""}`}
                onClick={() => setActiveTab("USER")}
              >
                👤 Operators
              </button>
            </div>

            {/* List of Google Accounts */}
            <div className="google-accounts-scroll">
              {filteredAccounts.map((account) => {
                const isCurrent = activeUser?.id === account.id;
                return (
                  <div
                    key={account.id}
                    className={`google-account-row ${isCurrent ? "current-active" : ""}`}
                    onClick={() => handleAccountClick(account)}
                  >
                    <div className="google-account-avatar-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={account.avatar} alt={account.name} className="google-avatar-img" />
                      <span className={`google-status-dot ${account.status.toLowerCase()}`} />
                    </div>

                    <div className="google-account-info">
                      <div className="google-account-name-row">
                        <span className="google-account-name">{account.name}</span>
                        {isCurrent && <span className="google-active-badge">Active Session</span>}
                      </div>
                      <div className="google-account-title">{account.title}</div>
                      <div className="google-account-email">{account.email}</div>
                    </div>

                    <div className="google-account-badge-col">
                      <span className={`google-role-pill role-${account.role.toLowerCase()}`}>
                        {account.role === "ADMIN" ? "ADMIN" : account.role === "SUPERVISOR" ? "SUPERVISOR" : "OPERATOR"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Use Another Account Button */}
            <div className="google-use-another-row" onClick={() => setIsCustomMode(true)}>
              <div className="google-another-icon">
                <FontAwesomeIcon icon={faBuildingUser} />
              </div>
              <div className="google-another-text">
                <strong>Sign in with custom work email</strong>
                <span>New users will be registered with Operator clearance</span>
              </div>
            </div>

            {/* Enterprise Clearance Footnote */}
            <div className="google-security-footnote">
              <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#10b981", marginRight: 6 }} />
              <span>Plant RBAC: 4 Administrator and 4 Supervisor slots are pre-assigned & fixed.</span>
            </div>
          </div>
        )}

        {/* STEP 2: Password Verification for Selected Account */}
        {selectedUser && !isCustomMode && (
          <form onSubmit={handleConfirmLogin} className="google-password-form">
            {/* Selected User Pill */}
            <div className="google-selected-user-pill" onClick={() => setSelectedUser(null)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedUser.avatar} alt={selectedUser.name} className="google-user-pill-avatar" />
              <div className="google-user-pill-meta">
                <span className="google-user-pill-name">{selectedUser.name}</span>
                <span className="google-user-pill-email">{selectedUser.email}</span>
              </div>
              <span className={`google-role-pill role-${selectedUser.role.toLowerCase()}`}>
                {selectedUser.role}
              </span>
              <button type="button" className="google-change-account-btn" title="Switch account">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="google-input-container">
              <label className="google-floating-label">Enter Password</label>
              <div className="google-input-wrapper">
                <FontAwesomeIcon icon={faKey} className="google-field-icon" />
                <input
                  type="password"
                  placeholder="Enter security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="google-form-hint">
                <span>Enterprise SSO Mode: Demo credentials auto-verified for plant personnel.</span>
              </div>
            </div>

            <div className="google-auth-actions-row">
              <button
                type="button"
                className="google-btn-text"
                onClick={() => setSelectedUser(null)}
              >
                <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 6 }} />
                All Accounts
              </button>

              <button
                type="submit"
                className="google-btn-primary"
                disabled={loading}
              >
                <FontAwesomeIcon icon={faRightToBracket} style={{ marginRight: 8 }} />
                {loading ? "Authenticating..." : `Sign in as ${selectedUser.name.split(" ")[0]}`}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Custom Work Email Flow */}
        {isCustomMode && (
          <form onSubmit={handleConfirmLogin} className="google-custom-form">
            <div className="google-input-container">
              <label className="google-floating-label">Work Email</label>
              <div className="google-input-wrapper">
                <FontAwesomeIcon icon={faEnvelope} className="google-field-icon" />
                <input
                  type="email"
                  placeholder="name@factorymind.ai"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="google-input-container">
              <label className="google-floating-label">Password</label>
              <div className="google-input-wrapper">
                <FontAwesomeIcon icon={faLock} className="google-field-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="google-restriction-notice">
              <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#f59e0b", marginTop: 2 }} />
              <div>
                <strong>Notice for Executive & Supervisor access:</strong>
                <p>
                  Only the 4 pre-assigned Administrators and 4 Supervisors can access elevated controls. Custom registrations are automatically provisioned with Operator clearance.
                </p>
              </div>
            </div>

            <div className="google-auth-actions-row">
              <button
                type="button"
                className="google-btn-text"
                onClick={() => {
                  setIsCustomMode(false);
                  setError("");
                }}
              >
                <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 6 }} />
                Back to Accounts
              </button>

              <button
                type="submit"
                className="google-btn-primary"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Continue"}
              </button>
            </div>
          </form>
        )}

        {/* Bottom Google / Industrial compliance footer */}
        <div className="google-auth-bottom">
          <div className="google-auth-bottom-links">
            <span>Help</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
          <div className="google-auth-secured">
            <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#10b981", marginRight: 5 }} />
            <span>Industrial Single Sign-On (SSO)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
