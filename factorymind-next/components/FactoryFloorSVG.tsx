"use client";

import { useState } from "react";
import { MachineState, AGV, CurrentPart, ActiveWorker } from "@/hooks/useFactorySim";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faExpand, faCompress } from "@fortawesome/free-solid-svg-icons";

export type FloorLayer = "floor" | "material" | "agv" | "workforce" | "ai" | "health";

/*
  Full 1200 × 640 factory floor illustration.
  - Blueprint grid background
  - Machines drawn top-down as clean industrial glyphs
  - AGV forklifts positioned at their current state coords
  - Orange flow arrows + dashed blue AGV routes
  - Status pill labels beneath each cell
  - Legend + zoom controls in-viewport
*/

const INK = "#1A1815";
const INK_MID = "#3A3630";
const INK_SOFT = "#7A7770";
const CANVAS = "#FBF7F0";
const CREAM = "#F5F0E3";
const BEIGE = "#E8E1D1";
const BORDER = "#D9D2C4";
const ORANGE = "#FF6B2C";
const ORANGE_DARK = "#E64A0F";
const AGV_ROUTE = "#4A9FE7";
const WOOD = "#B08A5C";
const STEEL = "#C6BEB0";

const STATUS_DOT: Record<string, string> = {
  healthy: "#3F7A5F",
  warning: "#C87D1F",
  critical: "#B23A3A",
  downtime: "#7A7770",
};

interface Props {
  machines: MachineState[];
  agvs: AGV[];
  currentPart: CurrentPart;
  activeWorkers?: ActiveWorker[];
  aiHighlightedMachines?: string[];
  layer?: FloorLayer;
  onInspect: (id: string) => void;
}

/* ────────── individual top-down machine glyphs ────────── */

function WarehouseGlyph({ m, onClick }: { m: MachineState; onClick: () => void }) {
  // Rack building with grid of filled pallet bins
  const fill = Math.min(1, m.queue / 60);
  const bins = 12;
  const filled = Math.floor(fill * bins);
  return (
    <g transform={`translate(${m.x - 110}, ${m.y - 90})`} style={{ cursor: "pointer" }} onClick={onClick}>
      {/* Building outer wall */}
      <rect x="0" y="0" width="220" height="180" rx="6" fill={CANVAS} stroke={INK} strokeWidth="1.6" />
      {/* Roof striping band */}
      <rect x="0" y="0" width="220" height="16" rx="6" fill={INK} />
      <text x="110" y="12" textAnchor="middle" fill={CANVAS} fontSize="9" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
        AS/RS WAREHOUSE
      </text>

      {/* Rack grid — 3 rows × 4 cols of bin cells */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => {
          const idx = row * 4 + col;
          const isFilled = idx < filled;
          return (
            <g key={idx}>
              <rect
                x={14 + col * 48}
                y={30 + row * 46}
                width={44}
                height={40}
                fill={CREAM}
                stroke={INK_MID}
                strokeWidth="1"
              />
              {isFilled && (
                <>
                  <rect x={17 + col * 48} y={33 + row * 46} width={38} height={16} fill={ORANGE} opacity="0.9" stroke={INK} strokeWidth="0.6" />
                  <rect x={17 + col * 48} y={51 + row * 46} width={38} height={16} fill={ORANGE} opacity="0.9" stroke={INK} strokeWidth="0.6" />
                </>
              )}
              {/* Bin divider */}
              <line x1={14 + col * 48} y1={50 + row * 46} x2={58 + col * 48} y2={50 + row * 46} stroke={INK_SOFT} strokeWidth="0.5" />
            </g>
          );
        })
      )}

      {/* Loading dock arrow */}
      <path d="M 220 90 L 236 90 L 232 84 M 236 90 L 232 96" stroke={ORANGE} strokeWidth="1.6" fill="none" />
    </g>
  );
}

function CNCGlyph({ m, onClick, variant = "mill" }: { m: MachineState; onClick: () => void; variant?: "mill" | "lathe" }) {
  const label = variant === "mill" ? "CNC MILLING" : "CNC LATHE";
  return (
    <g transform={`translate(${m.x - 110}, ${m.y - 80})`} style={{ cursor: "pointer" }} onClick={onClick}>
      {/* Machine base */}
      <rect x="0" y="0" width="220" height="160" rx="6" fill={CANVAS} stroke={INK} strokeWidth="1.6" />
      {/* Header strip */}
      <rect x="0" y="0" width="220" height="16" rx="6" fill={INK} />
      <text x="110" y="12" textAnchor="middle" fill={CANVAS} fontSize="9" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
        {m.code} · {label}
      </text>

      {/* Enclosure body */}
      <rect x="14" y="28" width="192" height="118" rx="4" fill={BEIGE} stroke={INK_MID} strokeWidth="1" />

      {/* Viewing window */}
      <rect x="30" y="46" width="130" height="82" rx="3" fill={CANVAS} stroke={INK_SOFT} strokeWidth="0.8" />

      {/* Work envelope grid */}
      <line x1="40" y1="56" x2="150" y2="56" stroke={INK_SOFT} strokeDasharray="2 3" opacity="0.6" />
      <line x1="40" y1="118" x2="150" y2="118" stroke={INK_SOFT} strokeDasharray="2 3" opacity="0.6" />

      {/* Tool head (varies by variant) */}
      {variant === "mill" ? (
        <g>
          <rect x="88" y="62" width="14" height="24" fill={STEEL} stroke={INK} strokeWidth="0.8" />
          <circle cx="95" cy="94" r="7" fill={INK_MID} stroke={INK} strokeWidth="0.8" />
          <circle cx="95" cy="94" r="3" fill={ORANGE} />
        </g>
      ) : (
        <g>
          {/* Lathe chuck */}
          <circle cx="60" cy="87" r="12" fill={STEEL} stroke={INK} strokeWidth="1" />
          <circle cx="60" cy="87" r="4" fill={INK} />
          <rect x="72" y="83" width="60" height="8" fill={WOOD} stroke={INK} strokeWidth="0.6" />
          <rect x="132" y="80" width="10" height="14" fill={STEEL} stroke={INK} strokeWidth="0.8" />
        </g>
      )}

      {/* Workpiece under tool */}
      <rect x="82" y="106" width="26" height="8" fill={WOOD} stroke={INK} strokeWidth="0.6" />

      {/* Control panel */}
      <rect x="170" y="46" width="30" height="82" rx="2" fill={INK} />
      <circle cx="185" cy="56" r="2" fill={STATUS_DOT[m.status]}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
      </circle>
      <rect x="176" y="64" width="18" height="2" fill={CANVAS} opacity="0.6" />
      <rect x="176" y="70" width="14" height="2" fill={CANVAS} opacity="0.4" />
      <rect x="176" y="76" width="16" height="2" fill={CANVAS} opacity="0.4" />
      <rect x="176" y="86" width="18" height="20" rx="1" fill={INK_MID} stroke={ORANGE} strokeWidth="0.5" />
      <text x="185" y="100" textAnchor="middle" fill={ORANGE} fontSize="7" fontFamily="monospace" fontWeight="700">
        {m.rpm.toFixed(0)}
      </text>

      {/* Warning beacon if degraded */}
      {m.status !== "healthy" && (
        <circle cx="200" cy="38" r="4" fill={STATUS_DOT[m.status]}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.6s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

function RobotGlyph({ m, onClick }: { m: MachineState; onClick: () => void }) {
  const swing = m.status === "downtime" ? 0 : Math.sin(m.history.length * 0.25) * 40;
  return (
    <g transform={`translate(${m.x - 110}, ${m.y - 80})`} style={{ cursor: "pointer" }} onClick={onClick}>
      <rect x="0" y="0" width="220" height="160" rx="6" fill={CANVAS} stroke={INK} strokeWidth="1.6" />
      <rect x="0" y="0" width="220" height="16" rx="6" fill={INK} />
      <text x="110" y="12" textAnchor="middle" fill={CANVAS} fontSize="9" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
        {m.code} · 6-AXIS ROBOTIC ARM
      </text>

      {/* Cell floor */}
      <rect x="14" y="28" width="192" height="118" rx="4" fill={BEIGE} stroke={INK_MID} strokeWidth="1" />
      {/* Safety zone circle */}
      <circle cx="110" cy="90" r="50" fill="none" stroke={ORANGE} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />

      {/* Pedestal */}
      <circle cx="110" cy="90" r="14" fill={INK} />
      <circle cx="110" cy="90" r="8" fill={STEEL} />

      {/* Arm segment 1 (top-down view) */}
      <g transform={`rotate(${swing} 110 90)`}>
        <rect x="105" y="40" width="10" height="52" rx="3" fill={ORANGE} stroke={INK} strokeWidth="1" />
        <circle cx="110" cy="42" r="6" fill={STEEL} stroke={INK} strokeWidth="0.8" />
        {/* Wrist + gripper */}
        <g transform={`rotate(${-swing * 0.7} 110 42)`}>
          <rect x="107" y="26" width="6" height="18" fill={ORANGE_DARK} stroke={INK} strokeWidth="0.6" />
          <rect x="103" y="20" width="4" height="8" fill={INK_MID} />
          <rect x="113" y="20" width="4" height="8" fill={INK_MID} />
          {m.load > 0.4 && <rect x="105" y="22" width="10" height="6" fill={WOOD} stroke={INK} strokeWidth="0.5" />}
        </g>
      </g>

      {/* Input/output conveyor stubs */}
      <rect x="20" y="86" width="36" height="8" fill={INK_MID} stroke={INK} strokeWidth="0.6" />
      <rect x="164" y="86" width="36" height="8" fill={INK_MID} stroke={INK} strokeWidth="0.6" />

      {/* Small workpiece on input */}
      <rect x="30" y="88" width="10" height="4" fill={WOOD} />

      {m.status !== "healthy" && (
        <circle cx="200" cy="38" r="4" fill={STATUS_DOT[m.status]}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.6s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

function PressGlyph({ m, onClick }: { m: MachineState; onClick: () => void }) {
  const active = m.status !== "downtime";
  return (
    <g transform={`translate(${m.x - 110}, ${m.y - 80})`} style={{ cursor: "pointer" }} onClick={onClick}>
      <rect x="0" y="0" width="220" height="160" rx="6" fill={CANVAS} stroke={INK} strokeWidth="1.6" />
      <rect x="0" y="0" width="220" height="16" rx="6" fill={INK} />
      <text x="110" y="12" textAnchor="middle" fill={CANVAS} fontSize="9" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
        {m.code} · HYDRAULIC PRESS
      </text>

      <rect x="14" y="28" width="192" height="118" rx="4" fill={BEIGE} stroke={INK_MID} strokeWidth="1" />

      {/* Frame with 4 corner pillars (top-down) */}
      <rect x="50" y="46" width="120" height="82" fill={STEEL} stroke={INK} strokeWidth="1.2" />
      <circle cx="60" cy="56" r="6" fill={INK} />
      <circle cx="160" cy="56" r="6" fill={INK} />
      <circle cx="60" cy="118" r="6" fill={INK} />
      <circle cx="160" cy="118" r="6" fill={INK} />

      {/* Central platen with workpiece */}
      <rect x="82" y="70" width="56" height="34" fill={INK_MID} stroke={INK} strokeWidth="1" />
      <rect x="92" y="78" width="36" height="18" fill={ORANGE} opacity="0.85" stroke={INK} strokeWidth="0.6">
        {active && <animate attributeName="height" values="18;12;18" dur="1.4s" repeatCount="indefinite" />}
        {active && <animate attributeName="y" values="78;84;78" dur="1.4s" repeatCount="indefinite" />}
      </rect>

      {/* Ram indicator */}
      <circle cx="110" cy="87" r="6" fill={ORANGE_DARK}>
        {active && <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" />}
      </circle>

      {/* Warning stripes on floor */}
      <g transform="translate(22, 132)">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <rect key={i} x={i * 16} y="0" width="8" height="8" fill={i % 2 ? ORANGE : INK} />
        ))}
      </g>

      {/* Hose */}
      <path d="M 170 87 Q 200 87 200 120" stroke={ORANGE} strokeWidth="2" fill="none" opacity="0.7" />

      {m.status !== "healthy" && (
        <circle cx="200" cy="38" r="4" fill={STATUS_DOT[m.status]}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.6s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

function ConveyorGlyph({ m, onClick }: { m: MachineState; onClick: () => void }) {
  const active = m.status !== "downtime" && m.load > 0.1;
  const beltDur = active ? 2 : 0;
  return (
    <g transform={`translate(${m.x - 130}, ${m.y - 60})`} style={{ cursor: "pointer" }} onClick={onClick}>
      <rect x="0" y="0" width="260" height="120" rx="6" fill={CANVAS} stroke={INK} strokeWidth="1.6" />
      <rect x="0" y="0" width="260" height="16" rx="6" fill={INK} />
      <text x="130" y="12" textAnchor="middle" fill={CANVAS} fontSize="9" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
        {m.code} · OUTFEED CONVEYOR
      </text>

      {/* Belt frame */}
      <rect x="20" y="42" width="220" height="46" rx="4" fill={BEIGE} stroke={INK_MID} strokeWidth="1" />
      {/* Rollers along the belt */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <line
          key={i}
          x1={30 + i * 22}
          y1="46"
          x2={30 + i * 22}
          y2="84"
          stroke={INK}
          strokeWidth="0.8"
        />
      ))}
      {/* End rollers */}
      <circle cx="26" cy="65" r="10" fill={STEEL} stroke={INK} strokeWidth="1" />
      <circle cx="234" cy="65" r="10" fill={STEEL} stroke={INK} strokeWidth="1" />
      {/* Center guide rail */}
      <line x1="30" y1="65" x2="230" y2="65" stroke={INK_SOFT} strokeDasharray="4 3" opacity="0.6" />

      {/* Parts moving along */}
      {active &&
        [0, 1, 2].map((i) => (
          <rect key={i} y="58" width="14" height="14" fill={ORANGE} stroke={INK} strokeWidth="0.6" rx="1">
            <animate attributeName="x" values="30;220" dur={`${beltDur * 3}s`} begin={`${i * beltDur}s`} repeatCount="indefinite" />
          </rect>
        ))}

      {/* Scanner sensor */}
      <rect x="120" y="30" width="14" height="12" fill={INK} rx="1" />
      <line x1="127" y1="42" x2="127" y2="52" stroke="#B23A3A" strokeWidth="1">
        {active && <animate attributeName="opacity" values="0.2;1;0.2" dur="0.4s" repeatCount="indefinite" />}
      </line>

      {/* Warning stripes bottom */}
      <g transform="translate(20, 96)">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
          <rect key={i} x={i * 16} y="0" width="8" height="8" fill={i % 2 ? ORANGE : INK} />
        ))}
      </g>
    </g>
  );
}

function FinishedGoodsGlyph({ count }: { count: number }) {
  return (
    <g transform="translate(970, 400)">
      <rect x="0" y="0" width="180" height="180" rx="6" fill={CANVAS} stroke={INK} strokeWidth="1.6" />
      <rect x="0" y="0" width="180" height="16" rx="6" fill={INK} />
      <text x="90" y="12" textAnchor="middle" fill={CANVAS} fontSize="9" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
        FINISHED GOODS
      </text>

      {/* Stacked crates grid */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2].map((col) => {
          const idx = row * 3 + col;
          const filled = idx < Math.min(12, Math.floor(count / 3));
          return (
            <g key={idx}>
              <rect
                x={16 + col * 50}
                y={30 + row * 35}
                width={44}
                height={28}
                fill={filled ? WOOD : CREAM}
                stroke={INK}
                strokeWidth="0.8"
              />
              {filled && (
                <>
                  <rect x={19 + col * 50} y={34 + row * 35} width={38} height={4} fill={INK_MID} opacity="0.4" />
                  <text x={38 + col * 50} y={50 + row * 35} textAnchor="middle" fill={INK} fontSize="6" fontFamily="monospace">
                    ▤
                  </text>
                </>
              )}
            </g>
          );
        })
      )}

      <text x="90" y="176" textAnchor="middle" fill={INK_MID} fontSize="9" fontFamily="monospace" fontWeight="700">
        Count: {count}
      </text>
    </g>
  );
}

function RawMaterialsGlyph() {
  return (
    <g transform="translate(30, 280)">
      <text x="0" y="-8" fill={INK_SOFT} fontSize="9" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
        RAW MATERIALS
      </text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(0, ${i * 34})`}>
          <rect width="70" height="26" fill={WOOD} stroke={INK} strokeWidth="1" />
          <rect x="4" y="4" width="20" height="18" fill={ORANGE} opacity="0.85" stroke={INK} strokeWidth="0.5" />
          <rect x="26" y="4" width="20" height="18" fill={ORANGE} opacity="0.85" stroke={INK} strokeWidth="0.5" />
          <rect x="48" y="4" width="18" height="18" fill={ORANGE} opacity="0.85" stroke={INK} strokeWidth="0.5" />
        </g>
      ))}
    </g>
  );
}

/* ────────── AGV forklift glyph (top-down) ────────── */
function AGVGlyph({ agv }: { agv: AGV }) {
  // Face direction based on delta
  const dx = agv.targetX - agv.x;
  const dy = agv.targetY - agv.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <g transform={`translate(${agv.x}, ${agv.y})`} style={{ transition: "transform 0.5s linear" }}>
      <g transform={`rotate(${angle})`}>
        {/* Body */}
        <rect x="-18" y="-12" width="36" height="24" rx="3" fill={ORANGE} stroke={INK} strokeWidth="1.2" />
        {/* Cabin */}
        <rect x="-14" y="-8" width="16" height="16" fill={INK} rx="1" />
        {/* Forks */}
        <rect x="14" y="-9" width="10" height="3" fill={STEEL} stroke={INK} strokeWidth="0.5" />
        <rect x="14" y="6" width="10" height="3" fill={STEEL} stroke={INK} strokeWidth="0.5" />
        {/* Wheels */}
        <circle cx="-10" cy="-12" r="2.5" fill={INK} />
        <circle cx="-10" cy="12" r="2.5" fill={INK} />
        <circle cx="10" cy="-12" r="2.5" fill={INK} />
        <circle cx="10" cy="12" r="2.5" fill={INK} />
        {/* Warning light */}
        <circle cx="-4" cy="0" r="1.4" fill="#FACC15">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.7s" repeatCount="indefinite" />
        </circle>
      </g>
      {/* Label pill */}
      <g transform="translate(0, -22)">
        <rect x="-30" y="-14" width="60" height="14" rx="7" fill={INK} opacity="0.92" />
        <text x="0" y="-4" textAnchor="middle" fill={CANVAS} fontSize="7" fontFamily="monospace" fontWeight="700">
          {agv.code}
        </text>
      </g>
      <g transform="translate(0, 22)">
        <rect x="-40" y="0" width="80" height="12" rx="6" fill={CANVAS} stroke={INK} strokeWidth="0.6" opacity="0.95" />
        <text x="0" y="9" textAnchor="middle" fill={INK} fontSize="7" fontFamily="monospace">
          {agv.currentAction}
        </text>
      </g>
    </g>
  );
}

/* ────────── Machine status pill anchored under a machine ────────── */
function MachineStatusLabel({ m }: { m: MachineState }) {
  const dot = STATUS_DOT[m.status];
  const boxWidth = 190;
  return (
    <g transform={`translate(${m.x - boxWidth / 2}, ${m.y + 90})`}>
      <rect
        width={boxWidth}
        height="42"
        rx="6"
        fill="#FFFFFF"
        stroke={BORDER}
        strokeWidth="1"
      />
      <text x="10" y="16" fill={INK} fontSize="11" fontWeight="700">
        ● {m.shortLabel}
      </text>
      <circle cx="16" cy="30" r="3" fill={dot}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <text x="26" y="33" fill={INK_MID} fontSize="10">
        {m.statusText}
      </text>
      <text x={boxWidth - 10} y="33" textAnchor="end" fill={INK_SOFT} fontSize="10" fontFamily="monospace">
        Queue: {m.queue}
      </text>
    </g>
  );
}

/* ────────── The floor container with grid, arrows, machines, agvs ────────── */
/* ────────── Human intervention worker glyph ────────── */
function ActiveWorkerGlyph({ w }: { w: ActiveWorker }) {
  const color =
    w.status === "moving" ? "#FF6B2C" :
    w.status === "on_task" ? "#B23A3A" :
    "#3F7A5F";
  const label = w.status === "moving" ? "Moving" : w.status === "on_task" ? "Repairing" : "Verifying";
  const pct = Math.round(w.progress * 100);
  return (
    <g transform={`translate(${w.x}, ${w.y})`} style={{ transition: "transform 0.5s linear" }}>
      {/* Halo */}
      <circle r="20" fill={color} opacity="0.15">
        <animate attributeName="r" values="18;24;18" dur="1.4s" repeatCount="indefinite" />
      </circle>
      {/* Body */}
      <circle r="9" fill={color} stroke="#1A1815" strokeWidth="1.4" />
      {/* Head */}
      <circle cy="-4" r="4" fill="#F5F0E3" stroke="#1A1815" strokeWidth="0.8" />
      {/* Tool icon */}
      <path d="M -3 3 L 3 3 M 0 0 L 0 6" stroke="#1A1815" strokeWidth="1.4" strokeLinecap="round" />
      {/* Label pill above */}
      <g transform="translate(0, -26)">
        <rect x="-40" y="-14" width="80" height="14" rx="7" fill="#1A1815" opacity="0.92" />
        <text x="0" y="-4" textAnchor="middle" fill="#F5F0E3" fontSize="7" fontFamily="monospace" fontWeight="800">
          {w.id} · {label} {w.status !== "moving" ? `${pct}%` : ""}
        </text>
      </g>
      {/* Progress bar under */}
      <g transform="translate(-18, 16)">
        <rect width="36" height="4" rx="2" fill="#D9D2C4" />
        <rect width={36 * w.progress} height="4" rx="2" fill={color} />
      </g>
    </g>
  );
}

export default function FactoryFloorSVG({
  machines, agvs, currentPart, activeWorkers = [], aiHighlightedMachines = [],
  layer = "floor", onInspect,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const highlightSet = new Set(aiHighlightedMachines);

  const byId = new Map(machines.map((m) => [m.id, m]));
  const wh = byId.get("warehouse")!;
  const cnc1 = byId.get("cnc1")!;
  const robot = byId.get("robot")!;
  const cnc7 = byId.get("cnc7")!;
  const press = byId.get("press")!;
  const conveyor = byId.get("conveyor")!;

  // Flow arrow endpoints (offset from machine centers to their edges)
  const flowArrows = [
    { from: { x: wh.x + 110, y: wh.y }, to: { x: cnc1.x - 110, y: cnc1.y } },
    { from: { x: cnc1.x + 110, y: cnc1.y }, to: { x: robot.x - 110, y: robot.y } },
    { from: { x: robot.x, y: robot.y + 90 }, to: { x: cnc7.x, y: cnc7.y - 90 }, curve: true },
    { from: { x: cnc7.x + 110, y: cnc7.y }, to: { x: press.x - 110, y: press.y } },
    { from: { x: press.x + 110, y: press.y }, to: { x: conveyor.x - 130, y: conveyor.y } },
    { from: { x: conveyor.x + 130, y: conveyor.y }, to: { x: 970, y: 490 } },
  ];

  const totalProduced = machines.reduce((s, m) => s + m.produced, 0);

  const viewBox = `0 0 ${1200 / zoom} ${640 / zoom}`;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Legend chip row (top-right) */}
      <div className="sim-floor-legend">
        <span><i className="legend-arrow" /> Material Flow</span>
        <span><i className="legend-dashed" /> AGV Route</span>
        <span><i className="legend-wood" /> Workpiece</span>
        <span><i className="legend-agv" /> AGV</span>
      </div>

      {/* Zoom controls */}
      <div className="sim-floor-controls">
        <button onClick={() => setZoom((z) => Math.min(2, z + 0.15))} title="Zoom in"><FontAwesomeIcon icon={faPlus} /></button>
        <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} title="Zoom out"><FontAwesomeIcon icon={faMinus} /></button>
        <button onClick={() => setFullscreen((f) => !f)} title="Fullscreen">
          <FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} />
        </button>
      </div>

      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          border: `1px solid ${BORDER}`,
          display: "block",
          width: "100%",
          aspectRatio: "1200 / 640",
          height: fullscreen ? "80vh" : "auto",
        }}
      >
        <defs>
          {/* Blueprint grid */}
          <pattern id="bp-fine" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={BORDER} strokeWidth="0.4" opacity="0.55" />
          </pattern>
          <pattern id="bp-major" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#bp-fine)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke={BORDER} strokeWidth="0.9" opacity="0.9" />
          </pattern>
          <marker id="mflow-arrow" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
            <path d="M0,0 L10,4 L0,8 z" fill={ORANGE} />
          </marker>
        </defs>

        {/* Grid background */}
        <rect width="1200" height="640" fill="url(#bp-major)" />

        {/* Bay divider stripes at edges */}
        <g opacity="0.7">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
            <rect key={`t${i}`} x={i * 80} y="0" width="40" height="10" fill={i % 2 ? "#FACC15" : INK} opacity="0.5" />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
            <rect key={`b${i}`} x={i * 80} y="630" width="40" height="10" fill={i % 2 ? "#FACC15" : INK} opacity="0.5" />
          ))}
        </g>

        {/* Raw material pallets on far left */}
        <RawMaterialsGlyph />

        {/* Layer: AI Actions — pulsing halo around each affected machine */}
        {layer === "ai" && machines.filter((m) => highlightSet.has(m.code)).map((m) => (
          <circle key={`aih-${m.id}`} cx={m.x} cy={m.y} r="120" fill="none" stroke={ORANGE} strokeWidth="3" opacity="0.55">
            <animate attributeName="r" values="100;140;100" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.15;0.7" dur="1.6s" repeatCount="indefinite" />
          </circle>
        ))}

        {/* Layer: Machine Health — big colored disc under each machine */}
        {layer === "health" && machines.map((m) => (
          <circle
            key={`hh-${m.id}`}
            cx={m.x}
            cy={m.y}
            r="130"
            fill={STATUS_DOT[m.status]}
            opacity="0.14"
          />
        ))}

        {/* Material flow arrows — visible on floor + material layers */}
        {(layer === "floor" || layer === "material") && (
          <g opacity={layer === "material" ? 1 : 0.7}>
            {flowArrows.map((f, i) => {
              if (f.curve) {
                return (
                  <path
                    key={i}
                    d={`M ${f.from.x} ${f.from.y} Q ${(f.from.x + f.to.x) / 2 + 40} ${(f.from.y + f.to.y) / 2} ${f.to.x} ${f.to.y}`}
                    stroke={ORANGE}
                    strokeWidth={layer === "material" ? "3.5" : "2.5"}
                    fill="none"
                    markerEnd="url(#mflow-arrow)"
                  />
                );
              }
              return (
                <line
                  key={i}
                  x1={f.from.x} y1={f.from.y} x2={f.to.x} y2={f.to.y}
                  stroke={ORANGE}
                  strokeWidth={layer === "material" ? "3.5" : "2.5"}
                  markerEnd="url(#mflow-arrow)"
                />
              );
            })}
          </g>
        )}

        {/* AGV routes — dim on floor, prominent on agv layer */}
        {(layer === "floor" || layer === "agv") && (
          <g opacity={layer === "agv" ? 1 : 0.45}>
            <line x1={wh.x} y1={wh.y} x2={cnc1.x} y2={cnc1.y} stroke={AGV_ROUTE} strokeWidth={layer === "agv" ? "3" : "1.8"} strokeDasharray="6 5" />
            <line x1={robot.x} y1={robot.y} x2={cnc7.x} y2={cnc7.y} stroke={AGV_ROUTE} strokeWidth={layer === "agv" ? "3" : "1.8"} strokeDasharray="6 5" />
            <line x1={conveyor.x} y1={conveyor.y} x2="1050" y2="480" stroke={AGV_ROUTE} strokeWidth={layer === "agv" ? "3" : "1.8"} strokeDasharray="6 5" />
          </g>
        )}

        {/* Finished goods */}
        <FinishedGoodsGlyph count={totalProduced} />

        {/* Machines */}
        <WarehouseGlyph m={wh} onClick={() => onInspect(wh.id)} />
        <CNCGlyph m={cnc1} onClick={() => onInspect(cnc1.id)} variant="mill" />
        <RobotGlyph m={robot} onClick={() => onInspect(robot.id)} />
        <CNCGlyph m={cnc7} onClick={() => onInspect(cnc7.id)} variant="lathe" />
        <PressGlyph m={press} onClick={() => onInspect(press.id)} />
        <ConveyorGlyph m={conveyor} onClick={() => onInspect(conveyor.id)} />

        {/* Machine status labels (below each glyph) — dimmed on non-floor layers */}
        <g opacity={layer === "floor" || layer === "health" ? 1 : 0.45}>
          {machines.map((m) => (
            <MachineStatusLabel key={m.id} m={m} />
          ))}
        </g>

        {/* AGVs — always visible, brighter on agv layer */}
        <g opacity={layer === "workforce" ? 0.4 : 1}>
          {agvs.map((a) => (
            <AGVGlyph key={a.id} agv={a} />
          ))}
        </g>

        {/* Active workers — always visible (they only exist when on a mission);
            emphasized on workforce layer */}
        <g opacity={layer === "floor" || layer === "workforce" || layer === "ai" ? 1 : 0.65}>
          {activeWorkers.map((w) => (
            <ActiveWorkerGlyph key={w.id} w={w} />
          ))}
        </g>

        {/* Current-part badge (floating on floor near cnc7 - active station area) */}
        <g transform="translate(30, 30)">
          <rect width="180" height="34" rx="6" fill={INK} opacity="0.92" />
          <text x="12" y="14" fill={ORANGE} fontSize="8" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
            CURRENT PART
          </text>
          <text x="12" y="28" fill={CANVAS} fontSize="12" fontWeight="800" fontFamily="monospace">
            {currentPart.id} · {currentPart.name}
          </text>
        </g>
      </svg>
    </div>
  );
}
