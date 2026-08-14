"use client";

import { useClock } from "@/hooks/useClock";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";

interface DashboardNavProps {
  pageTitle?: string;
}

export default function DashboardNav({ pageTitle }: DashboardNavProps) {
  const time = useClock();

  return (
    <nav>
      <div>
        <h1>FactoryMind AI</h1>
        <p>{pageTitle || "Agentic Digital Twin Platform"}</p>
      </div>
      <div className="nav-right">
        <div className="clock">
          <FontAwesomeIcon icon={faClock} />{" "}
          <span id="clock">{time}</span>
        </div>
        <div className="profile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://i.pravatar.cc/60" alt="Administrator avatar" />
          <div>
            <h3>Administrator</h3>
            <p>Factory Manager</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
