"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardNav from "@/components/DashboardNav";

// Views
import HeroSection from "@/components/HeroSection";
import KpiSection from "@/components/KpiSection";
import OverviewSection from "@/components/OverviewSection";
import ProductionFlow from "@/components/ProductionFlow";
import DigitalTwin from "@/components/DigitalTwin";
import AiSection from "@/components/AiSection";
import AgentsSection from "@/components/AgentsSection";
import DecisionSummary from "@/components/DecisionSummary";
import ChatSection from "@/components/ChatSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import MaintenanceSection from "@/components/MaintenanceSection";
import AlertsSection from "@/components/AlertsSection";
import OverviewSection2 from "@/components/OverviewSection";
import UsersPage from "@/components/UsersPage";
import SettingsPage from "@/components/SettingsPage";
import DashboardFooter from "@/components/DashboardFooter";
import MlWorkbench from "@/components/MlWorkbench";

import { useNotifications } from "@/hooks/useNotifications";
import { useAuth, ROLE_PERMISSIONS, UserRole } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faShieldHalved,
  faUserShield,
  faUserTie,
  faArrowRotateLeft,
  faRobot,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";


/* ─── Section page labels for the nav heading ─── */
const pageTitles = [
  "Dashboard Overview",
  "Digital Twin — Factory Map",
  "AI Agent Control Center",
  "Predictive AI & ML Workbench",
  "Machines",
  "Analytics",
  "Maintenance",
  "Real-Time Alerts",
  "Reports",
  "Users & Access Management",
  "System Settings",
];

/* ─── Page-level fade animation on section change ─── */
function PageView({ children, sectionKey }: { children: React.ReactNode; sectionKey: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [sectionKey]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Access Restricted Guard View ─── */
function AccessRestrictedView({
  sectionTitle,
  currentRole,
  onSwitchRole,
  onGoHome,
}: {
  sectionTitle: string;
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onGoHome: () => void;
}) {
  const roleInfo = ROLE_PERMISSIONS[currentRole];

  return (
    <div className="access-restricted-card">
      <div className="restricted-icon-wrap">
        <FontAwesomeIcon icon={faLock} className="restricted-lock-icon" />
      </div>

      <div className="restricted-badge-row">
        <span className="restricted-pill">Access Restricted</span>
        <span className={`role-badge-pill role-badge-${currentRole.toLowerCase()}`}>
          Current Role: {currentRole}
        </span>
      </div>

      <h2>Permission Required for &ldquo;{sectionTitle}&rdquo;</h2>
      <p className="restricted-description">
        Your current session with the <strong>{roleInfo.name}</strong> role does not have authorization to view or execute actions in this section. Higher operational clearance is required.
      </p>

      <div className="restricted-privilege-box">
        <div className="privilege-item">
          <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#06b6d4" }} />
          <span>Requires <strong>Supervisor</strong> or <strong>Administration</strong> security level.</span>
        </div>
      </div>

      <div className="restricted-actions">
        <button
          className="btn-switch-role admin"
          onClick={() => onSwitchRole("ADMIN")}
        >
          <FontAwesomeIcon icon={faUserShield} />
          Elevate to Administrator
        </button>

        <button
          className="btn-switch-role supervisor"
          onClick={() => onSwitchRole("SUPERVISOR")}
        >
          <FontAwesomeIcon icon={faUserTie} />
          Elevate to Supervisor
        </button>

        <button
          className="btn-back-home"
          onClick={onGoHome}
        >
          <FontAwesomeIcon icon={faArrowRotateLeft} />
          Return to Overview
        </button>
      </div>
    </div>
  );
}

/* ─── Individual views ─── */
function DashboardView() {
  return (
    <>
      <HeroSection />
      <KpiSection />
      <OverviewSection />
      <ProductionFlow />
    </>
  );
}

function DigitalTwinView() {
  return <DigitalTwin />;
}

function AIAgentView() {
  return (
    <>
      <AiSection />
      <AgentsSection />
      <DecisionSummary />
      <ChatSection />
    </>
  );
}

function MlWorkbenchView() {
  return <MlWorkbench />;
}

function MachinesView() {
  return (
    <>
      <DigitalTwin />
      <MaintenanceSection />
    </>
  );
}

function AnalyticsView() {
  return (
    <>
      <KpiSection />
      <AnalyticsSection />
    </>
  );
}

function MaintenanceView() {
  return (
    <>
      <MaintenanceSection />
      <DecisionSummary />
    </>
  );
}

function AlertsView() {
  return <AlertsSection />;
}

function ReportsView() {
  return (
    <>
      <OverviewSection2 />
      <AnalyticsSection />
    </>
  );
}

const views = [
  <DashboardView key="dashboard" />,
  <DigitalTwinView key="digital-twin" />,
  <AIAgentView key="ai-agent" />,
  <MlWorkbenchView key="ml-workbench" />,
  <MachinesView key="machines" />,
  <AnalyticsView key="analytics" />,
  <MaintenanceView key="maintenance" />,
  <AlertsView key="alerts" />,
  <ReportsView key="reports" />,
  <UsersPage key="users" />,
  <SettingsPage key="settings" />,
];

export default function DashboardClient() {
  const [activeSection, setActiveSection] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const { role, canAccessSection, switchRole } = useAuth();


  useNotifications();

  // White-flash entry reveal
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Handle responsive layout collapsing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Startup card animation
  useEffect(() => {
    const cards = document.querySelectorAll(
      ".kpi-card,.overview-card,.machine-card,.agent-card,.chart-card,.access-restricted-card"
    );
    cards.forEach((card, i) => {
      const el = card as HTMLElement;
      el.style.opacity = "0";
      el.style.transform = "translateY(25px)";
      setTimeout(() => {
        el.style.transition = ".6s";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, i * 80);
    });
  }, [activeSection, role]); // re-run when section or role changes

  const handleSelect = (index: number) => {
    if (index === activeSection) return;
    setActiveSection(index);
  };

  const hasAccess = canAccessSection(activeSection);

  return (
    <>
      {/* White entry overlay */}
      <div
        className={`db-entry-overlay${revealed ? " db-entry-hidden" : ""}`}
        aria-hidden="true"
      />

      <div className="background-grid" />

      {/* Mobile Sidebar backdrop overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`dashboard ${sidebarOpen ? "sidebar-visible" : "sidebar-hidden"}`}>
        <Sidebar
          active={activeSection}
          onSelect={handleSelect}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        <div className="main">
          <DashboardNav
            pageTitle={pageTitles[activeSection]}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <PageView sectionKey={activeSection}>
            {hasAccess ? (
              views[activeSection]
            ) : (
              <AccessRestrictedView
                sectionTitle={pageTitles[activeSection]}
                currentRole={role}
                onSwitchRole={switchRole}
                onGoHome={() => setActiveSection(0)}
              />
            )}
          </PageView>

          <DashboardFooter />
        </div>
      </div>

      {/* Floating AI Assistant FAB & Popup */}
      <div className="assistant-fab-container">
        {chatOpen && (
          <div className="assistant-chat-popup">
            <div className="chat-popup-header">
              <div className="header-info">
                <FontAwesomeIcon icon={faRobot} className="header-icon" />
                <span>FactoryMind Copilot</span>
              </div>
              <button className="chat-popup-close" onClick={() => setChatOpen(false)} title="Close chat">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="chat-popup-content">
              <ChatSection />
            </div>
          </div>
        )}

        <button
          className={`assistant-fab ${chatOpen ? "active" : ""}`}
          onClick={() => setChatOpen(!chatOpen)}
          title="Toggle Precaution Assistant"
          aria-label="Toggle Precaution Assistant"
        >
          <FontAwesomeIcon icon={faRobot} />
          <span className="fab-pulse-ring" />
        </button>
      </div>
    </>
  );
}


