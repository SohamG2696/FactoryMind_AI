"use client";

import { useEffect, useState } from "react";
import AuthModal from "@/components/AuthModal";
import { useWorkspaceNav, pageTitles } from "@/components/AppShell";

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
import UsersPage from "@/components/UsersPage";
import SettingsPage from "@/components/SettingsPage";
import MlWorkbench from "@/components/MlWorkbench";
import InterventionSummary from "@/components/ai/InterventionSummary";
import InterventionCenter from "@/components/ai/InterventionCenter";
import DecisionLog from "@/components/ai/DecisionLog";

import { useAuth, ROLE_PERMISSIONS, UserRole } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faShieldHalved,
  faUserShield,
  faUserTie,
  faArrowRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

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
      <InterventionSummary />
      <OverviewSection />
      <AlertsSection />
      <ProductionFlow />
    </>
  );
}

function DigitalTwinView() {
  return (
    <>
      <DigitalTwin />
      <MaintenanceSection />
    </>
  );
}

function AIAgentView() {
  return (
    <>
      <InterventionCenter />
      <AiSection />
      <AgentsSection />
      <DecisionSummary />
      <DecisionLog />
      <ChatSection />
    </>
  );
}

export default function DashboardClient() {
  const { activeSection, goToSection } = useWorkspaceNav();
  const [elevateModalOpen, setElevateModalOpen] = useState(false);
  const [elevateTargetRole, setElevateTargetRole] = useState<UserRole | null>(null);

  const { role, canAccessSection } = useAuth();

  const handleRequestElevate = (targetRole: UserRole) => {
    setElevateTargetRole(targetRole);
    setElevateModalOpen(true);
  };

  const hasAccess = canAccessSection(activeSection);

  const renderCurrentView = () => {
    switch (activeSection) {
      case 0:
        return <DashboardView onNavigate={goToSection} />;
      case 1:
        return <DigitalTwinView />;
      case 2:
        return <AIAgentView />;
      case 3:
        return <MlWorkbench />;
      case 4:
        return <AnalyticsSection />;
      case 5:
        return <UsersPage />;
      case 6:
        return <SettingsPage />;
      default:
        return <DashboardView onNavigate={goToSection} />;
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

      <PageView sectionKey={activeSection}>
        {hasAccess ? (
          renderCurrentView()
        ) : (
          <AccessRestrictedView
            sectionTitle={pageTitles[activeSection]}
            currentRole={role}
            onRequestElevate={handleRequestElevate}
            onGoHome={() => goToSection(0)}
          />
        )}
      </PageView>
    </>
  );
}
