"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardNav from "@/components/DashboardNav";
import AuthModal from "@/components/AuthModal";

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
  faKey,
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

/* ─── RBAC Access Restricted Card Component ─── */
function AccessRestrictedView({
  sectionTitle,
  currentRole,
  onRequestElevate,
  onGoHome,
}: {
  sectionTitle: string;
  currentRole: UserRole;
  onRequestElevate: (role: UserRole) => void;
  onGoHome: () => void;
}) {
  const currentRoleInfo = ROLE_PERMISSIONS[currentRole];

  return (
    <div className="access-restricted-card">
      <div className="access-restricted-icon-wrap">
        <FontAwesomeIcon icon={faLock} />
      </div>

      <h2>Access Restricted</h2>
      <p className="restricted-badge">
        <FontAwesomeIcon icon={faShieldHalved} />
        Requires Elevated Security Clearance
      </p>

      <p className="restricted-desc">
        You are currently logged in with{" "}
        <strong style={{ color: currentRoleInfo.color }}>
          {currentRoleInfo.name} Clearance
        </strong>
        . The section <strong>&ldquo;{sectionTitle}&rdquo;</strong> contains confidential factory data and requires password verification for an authorized leadership account.
      </p>

      <div className="restricted-actions">
        <button
          className="btn-elevate-admin"
          onClick={() => onRequestElevate("ADMIN")}
        >
          <FontAwesomeIcon icon={faUserShield} />
          Authenticate as Administrator
        </button>

        <button
          className="btn-elevate-supervisor"
          onClick={() => onRequestElevate("SUPERVISOR")}
        >
          <FontAwesomeIcon icon={faUserTie} />
          Authenticate as Supervisor
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
function DashboardView({ onNavigate }: { onNavigate: (section: number) => void }) {
  return (
    <>
      <HeroSection
        onOpenDigitalTwin={() => onNavigate(1)}
        onOpenAiInsights={() => onNavigate(2)}
      />
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

export default function DashboardClient() {
  const [activeSection, setActiveSection] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default on entry
  const [chatOpen, setChatOpen] = useState(false);
  const [elevateModalOpen, setElevateModalOpen] = useState(false);
  const [elevateTargetRole, setElevateTargetRole] = useState<UserRole | null>(null);

  const { role, canAccessSection } = useAuth();

  useNotifications();

  // White-flash entry reveal
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Handle responsive layout resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const handleSelect = (index: number) => {
    if (index === activeSection) return;
    setActiveSection(index);
  };

  const handleRequestElevate = (targetRole: UserRole) => {
    setElevateTargetRole(targetRole);
    setElevateModalOpen(true);
  };

  const hasAccess = canAccessSection(activeSection);

  const renderCurrentView = () => {
    switch (activeSection) {
      case 0:
        return <DashboardView onNavigate={handleSelect} />;
      case 1:
        return <DigitalTwinView />;
      case 2:
        return <AIAgentView />;
      case 3:
        return <MlWorkbenchView />;
      case 4:
        return <MachinesView />;
      case 5:
        return <AnalyticsView />;
      case 6:
        return <MaintenanceView />;
      case 7:
        return <AlertsView />;
      case 8:
        return <ReportsView />;
      case 9:
        return <UsersPage />;
      case 10:
        return <SettingsPage />;
      default:
        return <DashboardView onNavigate={handleSelect} />;
    }
  };

  return (
    <>
      {/* Password verification modal for role elevation */}
      <AuthModal
        isOpen={elevateModalOpen}
        onClose={() => setElevateModalOpen(false)}
        targetRole={elevateTargetRole}
      />

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
              renderCurrentView()
            ) : (
              <AccessRestrictedView
                sectionTitle={pageTitles[activeSection]}
                currentRole={role}
                onRequestElevate={handleRequestElevate}
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
        </button>
      </div>
    </>
  );
}
