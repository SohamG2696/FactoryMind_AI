"use client";

import { useState } from "react";
import { MachineState, AGV, CurrentPart, ActiveWorker, Reroute } from "@/hooks/useFactorySim";
import { useOperatorTasks } from "@/context/OperatorTaskContext";
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
const STEEL_LIGHT = "#E4DDCE";

const STATUS_STROKE: Record<string, string> = {
  healthy: "#3F7A5F",
  warning: "#C87D1F",
  critical: "#B23A3A",
  downtime: "#7A7770",
};

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
  /** Operator view: crop the floor around this machine and fade the others. */
  focusMachineId?: string;
  /** Active production reroute — draws the alternate flow and AGV path. */
  reroute?: Reroute | null;
}

/** Big, unmistakable state overlay: DOWN / STARVED / STANDBY / REROUTED. */
function StateOverlay({ m, reroutedTo }: { m: MachineState; reroutedTo: boolean }) {
  const down = m.status === "downtime" || m.isolated;
  const starved = (m.starvedTicks ?? 0) >= 6;
  const standbyIdle = m.standby && m.statusText === "Standby";
  if (!down && !starved && !standbyIdle && !reroutedTo) return null;
  const label = down
    ? m.isolated ? "⛔ DOWN · ISOLATED" : m.breakdownTick !== undefined ? "💥 BREAKDOWN" : "🔧 MAINTENANCE"
    : starved ? "⚠ STARVED · NO PARTS"
    : reroutedTo ? "🔀 RUNNING REROUTED WORK"
    : "STANDBY";
  const color = down ? "#B23A3A" : starved ? "#C87D1F" : reroutedTo ? "#E8590C" : "#6B7280";
  return (
    <g pointerEvents="none">
      {(down || reroutedTo) && (
        <rect x={m.x - 114} y={m.y - 84} width="228" height="168" rx="8"
          fill={down ? "rgba(178,58,58,0.16)" : "rgba(232,89,12,0.06)"} stroke={color} strokeWidth="3"
          strokeDasharray={down ? "0" : "8 5"}>
          {reroutedTo && <animate attributeName="stroke-dashoffset" values="0;-26" dur="1s" repeatCount="indefinite" />}
        </rect>
      )}
      <g transform={`translate(${m.x}, ${m.y - 6})`}>
        <rect x="-92" y="-15" width="184" height="30" rx="15" fill={color} opacity="0.95">
          {(down || starved) && <animate attributeName="opacity" values="0.95;0.6;0.95" dur="1.2s" repeatCount="indefinite" />}
        </rect>
        <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800" fontFamily="monospace" letterSpacing="0.06em">
          {label}
        </text>
      </g>
    </g>
  );
}

/* ────────── individual top-down machine glyphs ────────── */

/* ────────── individual top-down machine glyphs with live animated mechanics ────────── */

function WarehouseGlyph({ m, onClick }: { m: MachineState; onClick: () => void }) {
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown;
  const fill = Math.min(1, Math.max(0.1, m.queue / Math.max(1, m.capacity)));
  const bins = 12;
  const filled = Math.round(fill * bins);

  return (
    <g transform={`translate(${m.x - 110}, ${m.y - 90})`} style={{ cursor: "pointer" }} onClick={onClick}>
      {/* Building outer wall */}
      <rect x="0" y="0" width="220" height="180" rx="6" fill={CANVAS} stroke={INK} strokeWidth="1.6" />
      {/* Roof striping band */}
      <rect x="0" y="0" width="220" height="16" rx="6" fill={INK} />
      <text x="110" y="12" textAnchor="middle" fill={CANVAS} fontSize="9" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
        {m.code} · AS/RS WAREHOUSE
      </text>

      {/* Rack grid — 3 rows × 4 cols of bin cells */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => {
          const idx = row * 4 + col;
          const isFilled = idx < filled;
          const x = 14 + col * 48;
          const y = 30 + row * 46;
          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={44}
                height={40}
                fill={CREAM}
                stroke={INK_MID}
                strokeWidth="1"
              />
              {isFilled && (
                <>
                  <rect x={x + 3} y={y + 3} width={38} height={16} fill={ORANGE} opacity="0.9" stroke={INK} strokeWidth="0.6" rx="1" />
                  <rect x={x + 3} y={y + 21} width={38} height={16} fill={ORANGE} opacity="0.9" stroke={INK} strokeWidth="0.6" rx="1" />
                </>
              )}
              {/* Bin divider */}
              <line x1={x} y1={y + 20} x2={x + 44} y2={y + 20} stroke={INK_SOFT} strokeWidth="0.5" />
            </g>
          );
        })
      )}

      {/* Active Stacker Crane (SRM) Mast traversing horizontally */}
      {active && (
        <g>
          <line y1="28" y2="168" stroke={INK} strokeWidth="3" opacity="0.85">
            <animate attributeName="x1" values="24;196;70;150;24" dur="5.6s" repeatCount="indefinite" />
            <animate attributeName="x2" values="24;196;70;150;24" dur="5.6s" repeatCount="indefinite" />
          </line>
          {/* Elevator Fork */}
          <rect y="70" width="12" height="10" rx="1" fill={ORANGE_DARK} stroke={INK} strokeWidth="0.8">
            <animate attributeName="x" values="18;190;64;144;18" dur="5.6s" repeatCount="indefinite" />
            <animate attributeName="y" values="40;130;60;100;40" dur="2.8s" repeatCount="indefinite" />
          </rect>
        </g>
      )}

      {/* Loading dock arrow & AGV shuttle */}
      <path d="M 220 90 L 236 90 L 232 84 M 236 90 L 232 96" stroke={ORANGE} strokeWidth="1.6" fill="none" />
      {active && (
        <rect y="164" width="18" height="10" rx="2" fill={ORANGE} stroke={INK} strokeWidth="0.8">
          <animate attributeName="x" values="20;180;20" dur="4.2s" repeatCount="indefinite" />
        </rect>
      )}
    </g>
  );
}

function CNCGlyph({ m, onClick, variant = "mill" }: { m: MachineState; onClick: () => void; variant?: "mill" | "lathe" }) {
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown && m.rpm > 100;
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

      {/* Tool head & live machining motion */}
      {variant === "mill" ? (
        <g>
          {/* X/Y-Traversing Spindle Assembly */}
          <g>
            {active && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 28,0; -24,0; 12,0; 0,0"
                dur="3.2s"
                repeatCount="indefinite"
              />
            )}
            <rect x="88" y="54" width="14" height="28" rx="2" fill={STEEL} stroke={INK} strokeWidth="0.8" />
            <circle cx="95" cy="86" r="6" fill={INK_MID} stroke={INK} strokeWidth="0.8" />

            {/* Spinning Milling Bit */}
            <circle cx="95" cy="94" r="3" fill={ORANGE}>
              {active && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 95 94"
                  to="360 95 94"
                  dur="0.15s"
                  repeatCount="indefinite"
                />
              )}
            </circle>

            {/* Golden Cutting Sparks & Coolant Mist */}
            {active && (
              <g transform="translate(95, 102)">
                <circle cx="-3" cy="-1" r="1.2" fill="#FBBF24">
                  <animate attributeName="opacity" values="1;0;1" dur="0.2s" repeatCount="indefinite" />
                  <animate attributeName="cx" values="-1;-6;-1" dur="0.2s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="0;-4;0" dur="0.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="3" cy="-1" r="1.2" fill="#FBBF24">
                  <animate attributeName="opacity" values="0;1;0" dur="0.22s" repeatCount="indefinite" />
                  <animate attributeName="cx" values="1;6;1" dur="0.22s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="0;-5;0" dur="0.22s" repeatCount="indefinite" />
                </circle>
                {/* Coolant Mist stream */}
                <line x1="-4" y1="-8" x2="0" y2="0" stroke="#38BDF8" strokeWidth="1.2" opacity="0.8">
                  <animate attributeName="opacity" values="0.3;0.9;0.3" dur="0.3s" repeatCount="indefinite" />
                </line>
              </g>
            )}
          </g>
          {/* Workpiece under tool with pocket cut */}
          <rect x="76" y="104" width="38" height="10" rx="1" fill={WOOD} stroke={INK} strokeWidth="0.6" />
        </g>
      ) : (
        <g>
          {/* Lathe chuck with continuous rotation */}
          <g transform="translate(56, 87)">
            <circle cx="0" cy="0" r="14" fill={STEEL} stroke={INK} strokeWidth="1.2" />
            <circle cx="0" cy="0" r="5" fill={INK} />
            {active && (
              <line x1="-12" y1="0" x2="12" y2="0" stroke={INK_MID} strokeWidth="2">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="0.2s"
                  repeatCount="indefinite"
                />
              </line>
            )}
          </g>

          {/* Cylindrical Billet Workpiece */}
          <rect x="70" y="81" width="62" height="12" rx="1" fill={WOOD} stroke={INK} strokeWidth="0.8" />
          {/* Tailstock */}
          <rect x="132" y="78" width="12" height="18" fill={STEEL} stroke={INK} strokeWidth="0.8" />

          {/* Traversing Tool Carriage */}
          <g>
            {active && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 32,0; 10,0; 0,0"
                dur="3.2s"
                repeatCount="indefinite"
              />
            )}
            <rect x="88" y="93" width="18" height="14" rx="1" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />
            <polygon points="97,89 93,95 101,95" fill={ORANGE} stroke={INK} strokeWidth="0.5" />

            {/* Lathe metal cutting sparks */}
            {active && (
              <circle cx="97" cy="88" r="1.5" fill="#FBBF24">
                <animate attributeName="opacity" values="1;0;1" dur="0.18s" repeatCount="indefinite" />
                <animate attributeName="cy" values="88;82;88" dur="0.18s" repeatCount="indefinite" />
                <animate attributeName="cx" values="97;92;97" dur="0.18s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        </g>
      )}

      {/* Control panel on right */}
      <rect x="170" y="46" width="30" height="82" rx="2" fill={INK} />
      <circle cx="185" cy="56" r="2.5" fill={STATUS_DOT[m.status]}>
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
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown;

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

      {/* Infeed Conveyor Stub on Left (x: 20, y: 84) */}
      <rect x="20" y="84" width="36" height="12" rx="1" fill={INK_MID} stroke={INK} strokeWidth="0.8" />
      {/* Workpiece on infeed (fades as picked) */}
      <rect x="30" y="86" width="12" height="8" rx="1" fill={WOOD} stroke={INK} strokeWidth="0.5">
        {active && (
          <animate
            attributeName="opacity"
            values="1;1;0;0;1;1"
            keyTimes="0; 0.15; 0.22; 0.88; 0.95; 1"
            dur="4.4s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Outfeed Conveyor Stub on Right (x: 164, y: 84) */}
      <rect x="164" y="84" width="36" height="12" rx="1" fill={INK_MID} stroke={INK} strokeWidth="0.8" />
      {/* Workpiece on outfeed (appears when placed) */}
      <rect x="174" y="86" width="12" height="8" rx="1" fill={ORANGE_DARK} stroke={INK} strokeWidth="0.5">
        {active && (
          <animate
            attributeName="opacity"
            values="0;0;1;1;0;0"
            keyTimes="0; 0.58; 0.65; 0.88; 0.95; 1"
            dur="4.4s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Base Pedestal at (110, 90) */}
      <circle cx="110" cy="90" r="15" fill={INK} stroke={STATUS_STROKE[m.status]} strokeWidth="1.2" />
      <circle cx="110" cy="90" r="9" fill={STEEL} />
      <circle cx="110" cy="90" r="4" fill={INK_MID} />

      {/* Dynamic 6-Axis Robotic Arm Sweeping from Left (-84°) to Right (+84°) */}
      <g transform="translate(110, 90)">
        <g>
          {active && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-84; -84; -65; 0; 65; 84; 84; 65; -65; -84"
              keyTimes="0; 0.15; 0.25; 0.45; 0.55; 0.65; 0.75; 0.85; 0.95; 1"
              dur="4.4s"
              repeatCount="indefinite"
            />
          )}

          {/* Primary Arm Link */}
          <rect x="-6" y="-36" width="12" height="40" rx="3" fill={ORANGE} stroke={INK} strokeWidth="1" />
          <line x1="0" y1="-32" x2="0" y2="-4" stroke={ORANGE_DARK} strokeWidth="1.5" />
          <circle cx="0" cy="0" r="4" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.6" />

          {/* Elbow Joint at y = -36 */}
          <g transform="translate(0, -36)">
            <circle cx="0" cy="0" r="6" fill={STEEL} stroke={INK} strokeWidth="0.8" />

            {/* Forearm Link */}
            <g>
              {active && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="10; 10; 25; 15; 25; 10; 10; 20; 20; 10"
                  keyTimes="0; 0.15; 0.25; 0.45; 0.55; 0.65; 0.75; 0.85; 0.95; 1"
                  dur="4.4s"
                  repeatCount="indefinite"
                />
              )}
              <rect x="-5" y="-30" width="10" height="34" rx="2.5" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />

              {/* Wrist & Gripper Head at y = -30 */}
              <g transform="translate(0, -30)">
                <circle cx="0" cy="0" r="4" fill={ORANGE_DARK} stroke={INK} strokeWidth="0.6" />
                <rect x="-6" y="-8" width="12" height="6" fill={INK} />
                <rect x="-5" y="-14" width="3" height="8" fill={STEEL} />
                <rect x="2" y="-14" width="3" height="8" fill={STEEL} />

                {/* Carried Workpiece in Gripper */}
                {active && (
                  <rect x="-4" y="-13" width="8" height="6" rx="0.5" fill={WOOD} stroke={INK} strokeWidth="0.5">
                    <animate
                      attributeName="opacity"
                      values="0;0;1;1;1;0;0;0;0;0"
                      keyTimes="0; 0.18; 0.22; 0.45; 0.60; 0.66; 0.78; 0.85; 0.95; 1"
                      dur="4.4s"
                      repeatCount="indefinite"
                    />
                  </rect>
                )}
              </g>
            </g>
          </g>
        </g>
      </g>

      {m.status !== "healthy" && (
        <circle cx="200" cy="38" r="4" fill={STATUS_DOT[m.status]}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.6s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

function PressGlyph({ m, onClick }: { m: MachineState; onClick: () => void }) {
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown;

  return (
    <g transform={`translate(${m.x - 110}, ${m.y - 80})`} style={{ cursor: "pointer" }} onClick={onClick}>
      <rect x="0" y="0" width="220" height="160" rx="6" fill={CANVAS} stroke={INK} strokeWidth="1.6" />
      <rect x="0" y="0" width="220" height="16" rx="6" fill={INK} />
      <text x="110" y="12" textAnchor="middle" fill={CANVAS} fontSize="9" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
        {m.code} · HYDRAULIC PRESS
      </text>

      <rect x="14" y="28" width="192" height="118" rx="4" fill={BEIGE} stroke={INK_MID} strokeWidth="1" />

      {/* Frame with 4 corner pillars */}
      <rect x="50" y="46" width="120" height="82" fill={STEEL} stroke={INK} strokeWidth="1.2" />
      <circle cx="60" cy="56" r="6" fill={INK} />
      <circle cx="160" cy="56" r="6" fill={INK} />
      <circle cx="60" cy="118" r="6" fill={INK} />
      <circle cx="160" cy="118" r="6" fill={INK} />

      {/* Hydraulic Reciprocating Ram Platen */}
      <g>
        {active && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,14; 0,14; 0,0; 0,0"
            keyTimes="0; 0.35; 0.45; 0.85; 1"
            dur="2.4s"
            repeatCount="indefinite"
          />
        )}
        <rect x="76" y="52" width="68" height="18" rx="2" fill={INK} stroke={ORANGE} strokeWidth="1" />
        <rect x="94" y="70" width="32" height="12" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />
      </g>

      {/* Central platen with sheet metal workpiece */}
      <rect x="82" y="92" width="56" height="24" fill={INK_MID} stroke={INK} strokeWidth="1" />
      <rect x="92" y="90" width="36" height="8" rx="1" fill={ORANGE} opacity="0.9" stroke={INK} strokeWidth="0.6">
        {active && (
          <animate
            attributeName="height"
            values="8;3;3;8;8"
            keyTimes="0; 0.35; 0.45; 0.85; 1"
            dur="2.4s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Ram indicator & oscillating pressure needle */}
      <circle cx="110" cy="62" r="5" fill={ORANGE_DARK} />
      {active && (
        <line x1="110" y1="62" x2="114" y2="58" stroke="#B23A3A" strokeWidth="1.2">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 110 62; 75 110 62; 0 110 62"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </line>
      )}

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
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown && m.load > 0.05;
  const beltDur = active ? 2.4 : 0;

  return (
    <g transform={`translate(${m.x - 130}, ${m.y - 60})`} style={{ cursor: "pointer" }} onClick={onClick}>
      <rect x="0" y="0" width="260" height="120" rx="6" fill={CANVAS} stroke={INK} strokeWidth="1.6" />
      <rect x="0" y="0" width="260" height="16" rx="6" fill={INK} />
      <text x="130" y="12" textAnchor="middle" fill={CANVAS} fontSize="9" fontFamily="monospace" letterSpacing="0.14em" fontWeight="700">
        {m.code} · OUTFEED CONVEYOR
      </text>

      {/* Belt frame */}
      <rect x="20" y="42" width="220" height="46" rx="4" fill={BEIGE} stroke={INK_MID} strokeWidth="1" />
      
      {/* End Rollers */}
      <circle cx="26" cy="65" r="10" fill={STEEL} stroke={INK} strokeWidth="1" />
      <circle cx="234" cy="65" r="10" fill={STEEL} stroke={INK} strokeWidth="1" />

      {/* Continuous Roller Bearings along the belt */}
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
      
      {/* Center guide rail */}
      <line x1="30" y1="65" x2="230" y2="65" stroke={INK_SOFT} strokeDasharray="4 3" opacity="0.6" />

      {/* Moving Palletized Parts */}
      {active &&
        [0, 1, 2].map((i) => (
          <g key={i}>
            <rect y="57" width="16" height="16" rx="2" fill={ORANGE} stroke={INK} strokeWidth="0.8">
              <animate attributeName="x" values="24;216" dur={`${beltDur * 2}s`} begin={`${i * beltDur * 0.65}s`} repeatCount="indefinite" />
            </rect>
            <rect y="61" width="8" height="8" rx="1" fill={WOOD}>
              <animate attributeName="x" values="28;220" dur={`${beltDur * 2}s`} begin={`${i * beltDur * 0.65}s`} repeatCount="indefinite" />
            </rect>
          </g>
        ))}

      {/* Scanner sensor & Pulsing Red Laser Beam */}
      <rect x="120" y="30" width="14" height="12" fill={INK} rx="1" />
      <line x1="127" y1="42" x2="127" y2="56" stroke="#EF4444" strokeWidth="1.8">
        {active && <animate attributeName="opacity" values="0.2;1;0.2" dur="0.35s" repeatCount="indefinite" />}
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
  const boxWidth = 200;
  const { getAssignedOperatorForCell, getTasksForCell } = useOperatorTasks();
  const assignedOp = getAssignedOperatorForCell(m.code);
  const cellTasks = getTasksForCell(m.code);
  const activeTasksCount = cellTasks.filter((t) => t.status !== "completed").length;

  return (
    <g transform={`translate(${m.x - boxWidth / 2}, ${m.y + 90})`}>
      <rect
        width={boxWidth}
        height="46"
        rx="6"
        fill="#FFFFFF"
        stroke={BORDER}
        strokeWidth="1"
      />
      <text x="10" y="16" fill={INK} fontSize="11" fontWeight="700">
        ● {m.shortLabel}
      </text>
      <text x={boxWidth - 10} y="15" textAnchor="end" fill="#B85A1F" fontSize="9.5" fontWeight="700" fontFamily="monospace">
        👤 {assignedOp ? assignedOp.name.split(" ")[0] : "Op"}
      </text>
      <circle cx="16" cy="31" r="3" fill={dot}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <text x="26" y="34" fill={INK_MID} fontSize="10">
        {m.statusText}
      </text>
      <text x={boxWidth - 10} y="34" textAnchor="end" fill={activeTasksCount > 0 ? "#C87D1F" : INK_SOFT} fontSize="9" fontFamily="monospace" fontWeight="600">
        {activeTasksCount > 0 ? `⚡ ${activeTasksCount} Task${activeTasksCount > 1 ? "s" : ""}` : `Queue: ${m.queue}`}
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
  layer = "floor", onInspect, focusMachineId, reroute = null,
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
  const standby = byId.get("lathe2");

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

  const focus = focusMachineId ? byId.get(focusMachineId) : undefined;
  let viewBox = `0 0 ${1200 / zoom} ${640 / zoom}`;
  if (focus) {
    // Show the machine plus enough of its neighbours to see material arriving and leaving.
    const w = 1200 / (2.2 * zoom);
    const h = 640 / (2.2 * zoom);
    viewBox = `${focus.x - w / 2} ${focus.y - h / 2} ${w} ${h}`;
  }
  const fade = (id: string) => (focus && focus.id !== id ? 0.35 : 1);

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
          transition: "opacity 0.3s",
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
              const bypassed = !!reroute && (i === 2 || i === 3);
              if (bypassed) {
                return (
                  <line key={i} x1={f.from.x} y1={f.from.y} x2={f.to.x} y2={f.to.y}
                    stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4 6" opacity="0.5" />
                );
              }
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

        {/* Rerouted material flow: Robot → CNC-05 standby → Press */}
        {reroute && standby && (
          <g>
            <line x1={robot.x + 110} y1={robot.y} x2={standby.x - 110} y2={standby.y}
              stroke={ORANGE} strokeWidth="4" strokeDasharray="10 6" markerEnd="url(#mflow-arrow)">
              <animate attributeName="stroke-dashoffset" values="0;-32" dur="0.8s" repeatCount="indefinite" />
            </line>
            <path d={`M ${standby.x} ${standby.y + 80} Q ${standby.x - 60} ${press.y - 120} ${press.x + 110} ${press.y - 30}`}
              stroke={ORANGE} strokeWidth="4" fill="none" strokeDasharray="10 6" markerEnd="url(#mflow-arrow)">
              <animate attributeName="stroke-dashoffset" values="0;-32" dur="0.8s" repeatCount="indefinite" />
            </path>
            <g transform={`translate(${(robot.x + standby.x) / 2}, ${robot.y - 24})`}>
              <rect x="-62" y="-11" width="124" height="22" rx="11" fill={ORANGE} />
              <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800" fontFamily="monospace">AI REROUTE</text>
            </g>
          </g>
        )}

        {/* AGV routes — dim on floor, prominent on agv layer */}
        {(layer === "floor" || layer === "agv") && (
          <g opacity={layer === "agv" ? 1 : 0.45}>
            <line x1={wh.x} y1={wh.y} x2={cnc1.x} y2={cnc1.y} stroke={AGV_ROUTE} strokeWidth={layer === "agv" ? "3" : "1.8"} strokeDasharray="6 5" />
            {reroute && standby ? (
              <polyline points={`${robot.x},${robot.y} ${standby.x},${standby.y} ${press.x},${press.y} ${robot.x},${robot.y}`}
                fill="none" stroke={AGV_ROUTE} strokeWidth={layer === "agv" ? "3" : "2.2"} strokeDasharray="6 5" />
            ) : (
              <line x1={robot.x} y1={robot.y} x2={cnc7.x} y2={cnc7.y} stroke={AGV_ROUTE} strokeWidth={layer === "agv" ? "3" : "1.8"} strokeDasharray="6 5" />
            )}
            <line x1={conveyor.x} y1={conveyor.y} x2="1050" y2="480" stroke={AGV_ROUTE} strokeWidth={layer === "agv" ? "3" : "1.8"} strokeDasharray="6 5" />
          </g>
        )}

        {/* Finished goods */}
        <FinishedGoodsGlyph count={totalProduced} />

        {/* Machines */}
        <g opacity={fade(wh.id)}><WarehouseGlyph m={wh} onClick={() => onInspect(wh.id)} /></g>
        <g opacity={fade(cnc1.id)}><CNCGlyph m={cnc1} onClick={() => onInspect(cnc1.id)} variant="mill" /></g>
        <g opacity={fade(robot.id)}><RobotGlyph m={robot} onClick={() => onInspect(robot.id)} /></g>
        <g opacity={fade(cnc7.id)}><CNCGlyph m={cnc7} onClick={() => onInspect(cnc7.id)} variant="lathe" /></g>
        <g opacity={fade(press.id)}><PressGlyph m={press} onClick={() => onInspect(press.id)} /></g>
        <g opacity={fade(conveyor.id)}><ConveyorGlyph m={conveyor} onClick={() => onInspect(conveyor.id)} /></g>
        {standby && (
          <g opacity={focus ? fade(standby.id) : standby.statusText === "Standby" ? 0.45 : 1}>
            <CNCGlyph m={standby} onClick={() => onInspect(standby.id)} variant="lathe" />
          </g>
        )}

        {/* State overlays: down / starved / standby / rerouted */}
        {machines.map((m) => (
          <g key={`ov-${m.id}`} opacity={fade(m.id)}>
            <StateOverlay m={m} reroutedTo={!!reroute && reroute.toId === m.id} />
          </g>
        ))}

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
