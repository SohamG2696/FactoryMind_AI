"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar, { navItems, NavItem } from "@/components/Sidebar";
import DashboardNav from "@/components/DashboardNav";
import InboxDrawer from "@/components/InboxDrawer";
import ChatSection from "@/components/ChatSection";
import DashboardFooter from "@/components/DashboardFooter";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faXmark, faArrowRight } from "@fortawesome/free-solid-svg-icons";

/* ─── Section page labels for the nav heading (index = dashboard section) ─── */
export const pageTitles = [
  "Dashboard Overview",
  "Digital Twin — Factory Map",
  "AI Agent Control Center",
  "Predictive AI & ML Workbench",
  "Analytics",
  "Users & Access Management",
  "System Settings",
];

const routeTitles: Record<string, string> = {
  "/simulation": "Live Simulation — Factory Floor",
  "/scenario": "Scenario Lab — What-If Analysis",
  "/manpower": "Manpower — Workforce Control",
};

/* ─── Which dashboard section is open; shared so any page can jump into one ─── */
interface WorkspaceNav {
  activeSection: number;
  goToSection: (section: number) => void;
}

const WorkspaceNavContext = createContext<WorkspaceNav | null>(null);

export function useWorkspaceNav(): WorkspaceNav {
  const ctx = useContext(WorkspaceNavContext);
  if (!ctx) throw new Error("useWorkspaceNav must be used inside <AppShell>");
  return ctx;
}

/* ─── "Next step" link: walks the viewer through the pages they can open ─── */
function NextStep({ current, onOpen }: { current: NavItem | undefined; onOpen: (item: NavItem) => void }) {
  const { canAccessSection } = useAuth();
  const pos = current ? navItems.indexOf(current) : -1;
  const next = navItems
    .slice(pos + 1)
    .find((i) => i.route || canAccessSection(i.section!));
  if (!next) return null;

  return (
    <div className="next-step-bar">
      <span className="next-step-label">Next in flow · {next.group}</span>
      <button className="next-step-btn" onClick={() => onOpen(next)}>
        <FontAwesomeIcon icon={next.icon} />
        {next.label}
        <FontAwesomeIcon icon={faArrowRight} />
      </button>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default on entry
  const [chatOpen, setChatOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);

  const { user, role } = useAuth();

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

  const onDashboard = pathname === "/dashboard";

  const goToSection = (section: number) => {
    setActiveSection(section);
    if (!onDashboard) router.push("/dashboard");
    window.scrollTo({ top: 0 });
  };

  const openItem = (item: NavItem) => {
    if (item.route) {
      router.push(item.route);
      window.scrollTo({ top: 0 });
    } else {
      goToSection(item.section!);
    }
  };

  const currentItem = onDashboard
    ? navItems.find((i) => i.section === activeSection)
    : navItems.find((i) => i.route === pathname);

  const pageTitle = onDashboard ? pageTitles[activeSection] : routeTitles[pathname];

  return (
    <WorkspaceNavContext.Provider value={{ activeSection, goToSection }}>
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
          active={onDashboard ? activeSection : -1}
          onSelect={goToSection}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        <div className="main">
          <DashboardNav
            pageTitle={pageTitle}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            onOpenInbox={() => setInboxOpen(true)}
          />

          <InboxDrawer
            open={inboxOpen}
            onClose={() => setInboxOpen(false)}
            supervisorId={role === "SUPERVISOR" ? user?.id : undefined}
            supervisorName={user?.name}
          />

          {children}

          <NextStep current={currentItem} onOpen={openItem} />

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
    </WorkspaceNavContext.Provider>
  );
}
