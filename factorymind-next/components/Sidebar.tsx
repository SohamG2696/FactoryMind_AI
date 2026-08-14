"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faMicrochip,
  faRobot,
  faGears,
  faChartLine,
  faScrewdriverWrench,
  faBell,
  faFileLines,
  faUser,
  faGear,
  faIndustry,
} from "@fortawesome/free-solid-svg-icons";

export const navItems = [
  { icon: faHouse,              label: "Dashboard"    },
  { icon: faMicrochip,          label: "Digital Twin" },
  { icon: faRobot,              label: "AI Agent"     },
  { icon: faGears,              label: "Machines"     },
  { icon: faChartLine,          label: "Analytics"    },
  { icon: faScrewdriverWrench,  label: "Maintenance"  },
  { icon: faBell,               label: "Alerts"       },
  { icon: faFileLines,          label: "Reports"      },
  { icon: faUser,               label: "Users"        },
  { icon: faGear,               label: "Settings"     },
];

interface SidebarProps {
  active: number;
  onSelect: (index: number) => void;
}

export default function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <FontAwesomeIcon
          icon={faIndustry}
          style={{ fontSize: 55, color: "#ffffff" }}
        />
        <h2>FactoryMind AI</h2>
      </div>
      <ul>
        {navItems.map((item, i) => (
          <li
            key={item.label}
            className={active === i ? "active" : ""}
            onClick={() => onSelect(i)}
          >
            <FontAwesomeIcon icon={item.icon} style={{ width: 20 }} />
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
