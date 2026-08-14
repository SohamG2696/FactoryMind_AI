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

import { useNotifications } from "@/hooks/useNotifications";

/* ─── Section page labels for the nav heading ─── */
const pageTitles = [
  "Dashboard Overview",
  "Digital Twin — Factory Map",
  "AI Agent Control Center",
  "Machines",
  "Analytics",
  "Maintenance",
  "Real-Time Alerts",
  "Reports",
  "Users",
  "Settings",
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
  <MachinesView key="machines" />,
  <AnalyticsView key="analytics" />,
  <MaintenanceView key="maintenance" />,
  <AlertsView key="alerts" />,
  <ReportsView key="reports" />,
  <UsersPage key="users" />,
  <SettingsPage key="settings" />,
];

/* ─── Main dashboard client ─── */
export default function DashboardClient() {
  const [activeSection, setActiveSection] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useNotifications();

  // White-flash entry reveal
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Startup card animation
  useEffect(() => {
    const cards = document.querySelectorAll(
      ".kpi-card,.overview-card,.machine-card,.agent-card,.chart-card"
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
  }, [activeSection]); // re-run when section changes so new cards animate in

  const handleSelect = (index: number) => {
    if (index === activeSection) return;
    setActiveSection(index);
  };

  return (
    <>
      {/* White entry overlay */}
      <div
        className={`db-entry-overlay${revealed ? " db-entry-hidden" : ""}`}
        aria-hidden="true"
      />

      <div className="background-grid" />
      <div className="dashboard">
        <Sidebar active={activeSection} onSelect={handleSelect} />

        <div className="main">
          <DashboardNav pageTitle={pageTitles[activeSection]} />

          <PageView sectionKey={activeSection}>
            {views[activeSection]}
          </PageView>

          <DashboardFooter />
        </div>
      </div>
    </>
  );
}
