"use client";

import { FloorLayer } from "@/components/FactoryFloorSVG";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faIndustry,
  faArrowRightArrowLeft,
  faTruck,
  faPeopleGroup,
  faRobot,
  faHeartPulse,
} from "@fortawesome/free-solid-svg-icons";

const LAYERS: { key: FloorLayer; label: string; icon: any }[] = [
  { key: "floor", label: "FLOOR", icon: faIndustry },
  { key: "material", label: "MATERIAL FLOW", icon: faArrowRightArrowLeft },
  { key: "agv", label: "AGV ROUTES", icon: faTruck },
  { key: "workforce", label: "WORKFORCE", icon: faPeopleGroup },
  { key: "ai", label: "AI ACTIONS", icon: faRobot },
  { key: "health", label: "MACHINE HEALTH", icon: faHeartPulse },
];

export default function LayerToggle({
  layer,
  onChange,
}: {
  layer: FloorLayer;
  onChange: (l: FloorLayer) => void;
}) {
  return (
    <div className="layer-toggle-bar">
      {LAYERS.map((L) => (
        <button
          key={L.key}
          className={`layer-btn ${layer === L.key ? "active" : ""}`}
          onClick={() => onChange(L.key)}
          title={`Switch to ${L.label} view`}
        >
          <FontAwesomeIcon icon={L.icon} />
          <span>{L.label}</span>
        </button>
      ))}
    </div>
  );
}
