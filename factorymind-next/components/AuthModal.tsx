"use client";

import React, { useState, useEffect } from "react";
import { useAuth, UserAccount, UserRole, validateAccountPassword } from "@/context/AuthContext";
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

import FactoryMindLogo from "@/components/FactoryMindLogo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedUser?: UserAccount | null;
  targetRole?: UserRole | null;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedUser = null,
  targetRole = null,
}: AuthModalProps) {
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

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (targetRole) {
        setActiveTab(targetRole);
        setSelectedUser(null);
      } else if (preSelectedUser) {
        setSelectedUser(preSelectedUser);
        setActiveTab(preSelectedUser.role);
      } else {
        setSelectedUser(null);
        setActiveTab("ALL");
      }
      setPassword("");
      setError("");
      setIsCustomMode(false);
    }
  }, [isOpen, preSelectedUser, targetRole]);

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
      setError("Please select an authorized account or enter your work email.");
      return;
    }

    if (!password || password.trim().length === 0) {
      setError("Account security password is required to authenticate.");
      return;
    }

    setLoading(true);

    try {
      if (selectedUser) {
        // Enforce exact password check
        const isMatch = validateAccountPassword(selectedUser, password);
        if (!isMatch) {
          setError("Invalid security password. Access denied.");
          setLoading(false);
          return;
        }
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

        {/* FactoryMind AI Auth Header */}
        <div className="google-auth-header">
          <div className="google-logo-wrapper">
            <FactoryMindLogo width={42} height={42} />
          </div>

          <h2 className="google-auth-title">
            {selectedUser ? "Verify Password" : isCustomMode ? "Sign in with Email" : "Choose an account"}
          </h2>
          <p className="google-auth-subtitle">
            {selectedUser ? (
              <span>Confirm security credentials for <strong>{selectedUser.name}</strong></span>
            ) : (
              <span>to switch identity in <strong style={{ color: "#A78BFA" }}>FactoryMind AI</strong></span>
            )}
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
                All ({usersList.length})
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

            {/* List of Accounts */}
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
                        {isCurrent && <span className="google-active-badge">Current</span>}
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
                <span>New personnel are registered with Operator clearance</span>
              </div>
            </div>

            {/* Enterprise Clearance Footnote */}
            <div className="google-security-footnote">
              <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#4ADE80", marginRight: 6 }} />
              <span>Plant RBAC: 4 Administrator and 4 Supervisor slots are pre-assigned & locked.</span>
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
              <label className="google-floating-label">Account Security Password</label>
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
                <span>Enter authorized security credentials to proceed.</span>
              </div>
            </div>

            <div className="google-auth-actions-row">
              <button
                type="button"
                className="google-btn-text"
                onClick={() => setSelectedUser(null)}
              >
                <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 6 }} />
                Switch Account
              </button>

              <button
                type="submit"
                className="google-btn-primary"
                disabled={loading}
              >
                <FontAwesomeIcon icon={faRightToBracket} style={{ marginRight: 8 }} />
                {loading ? "Verifying..." : "Verify & Switch"}
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
                  Only the 4 pre-assigned Administrators and 4 Supervisors can access elevated controls. Custom registrations are provisioned with Operator clearance.
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

        {/* Bottom compliance footer */}
        <div className="google-auth-bottom">
          <div className="google-auth-bottom-links">
            <span>Help</span>
            <span>Security Policy</span>
            <span>RBAC Clearance</span>
          </div>
          <div className="google-auth-secured">
            <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#10b981", marginRight: 5 }} />
            <span>Encrypted Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
