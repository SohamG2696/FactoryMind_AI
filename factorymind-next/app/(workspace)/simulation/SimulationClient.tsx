"use client";

import Link from "next/link";
import FactorySimulation from "@/components/FactorySimulation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faHouse, faWaveSquare, faIndustry } from "@fortawesome/free-solid-svg-icons";
import FactoryMindLogo from "@/components/FactoryMindLogo";

import { useRouter } from "next/navigation";

export default function SimulationClient() {
  const router = useRouter();

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    router.push(path);
  };

  return (
    <div className="sim-page-wrapper">
      <div className="background-grid" />

      {/* Top Navbar */}
      <header className="sim-topbar">
        <div className="sim-topbar-brand">
          <FactoryMindLogo width={32} height={32} />
          <div>
            <div className="sim-brand-title">FactoryMind AI</div>
            <div className="sim-brand-subtitle">TWIN v2.4 · SIMULATION ENGINE</div>
          </div>
        </div>

        <div className="sim-topbar-center">
          <span className="dt-pulse" />
          <span>REAL-TIME SCADA DISCRETE SIMULATION</span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href="/dashboard"
            className="sim-nav-btn primary"
            onClick={(e) => handleNav(e, "/dashboard")}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/"
            className="sim-nav-btn secondary"
            onClick={(e) => handleNav(e, "/")}
          >
            <FontAwesomeIcon icon={faHouse} />
            <span>Home</span>
          </Link>
        </div>
      </header>

      <main className="sim-main-container">
        <FactorySimulation />
      </main>
    </div>
  );
}

