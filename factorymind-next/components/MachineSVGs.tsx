"use client";

import { MachineState } from "@/hooks/useFactorySim";

/* ─── Industrial Design System Palette (matches FactoryFloorSVG exactly) ─── */
const INK = "#1A1815";
const INK_MID = "#3A3630";
const INK_SOFT = "#7A7770";
const CANVAS = "#FBF7F0";
const CREAM = "#F5F0E3";
const BEIGE = "#E8E1D1";
const BORDER = "#D9D2C4";
const ORANGE = "#FF6B2C";
const ORANGE_DARK = "#E64A0F";
const STEEL = "#C6BEB0";
const STEEL_LIGHT = "#E4DDCE";
const WOOD = "#B08A5C";
const COOLANT = "#38BDF8";
const SPARK_GOLD = "#FBBF24";

const STATUS_STROKE: Record<string, string> = {
  healthy: "#3F7A5F",
  warning: "#C87D1F",
  critical: "#B23A3A",
  downtime: "#8B8B85",
};

const STATUS_GLOW: Record<string, string> = {
  healthy: "rgba(63, 122, 95, 0.12)",
  warning: "rgba(200, 125, 31, 0.18)",
  critical: "rgba(178, 58, 58, 0.28)",
  downtime: "rgba(139, 139, 133, 0.12)",
};

const STATUS_DOT: Record<string, string> = {
  healthy: "#3F7A5F",
  warning: "#C87D1F",
  critical: "#B23A3A",
  downtime: "#7A7770",
};

/** High-visibility industrial status badge overlay when machine is down, starved, or in maintenance */
function DetailedStateOverlay({ m }: { m: MachineState }) {
  const down = m.status === "downtime" || m.isolated;
  const starved = (m.starvedTicks ?? 0) >= 6;
  if (!down && !starved) return null;

  const label = down
    ? m.isolated
      ? "⛔ CELL DOWN · ISOLATED"
      : m.breakdownTick !== undefined
      ? "💥 THERMAL BREAKDOWN"
      : "🔧 MAINTENANCE LOTO ENGAGED"
    : "⚠ STARVED · WAITING FOR INFEED";
  const color = down ? "#B23A3A" : "#C87D1F";

  return (
    <g pointerEvents="none">
      <rect
        x="6"
        y="6"
        width="388"
        height="248"
        rx="6"
        fill={down ? "rgba(178, 58, 58, 0.14)" : "rgba(200, 125, 31, 0.10)"}
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={down ? "0" : "8 5"}
      >
        <animate attributeName="opacity" values="0.8;0.35;0.8" dur="1.4s" repeatCount="indefinite" />
      </rect>
      <g transform="translate(200, 130)">
        <rect x="-140" y="-18" width="280" height="36" rx="18" fill={color} opacity="0.96">
          <animate attributeName="opacity" values="0.96;0.75;0.96" dur="1.2s" repeatCount="indefinite" />
        </rect>
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="11.5"
          fontWeight="800"
          fontFamily="monospace"
          letterSpacing="0.06em"
        >
          {label}
        </text>
      </g>
    </g>
  );
}

/* ─────────── 1. CNC-01 MILLING STATION ─────────── */
export function CNCMachineSVG({ m }: { m: MachineState }) {
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown && m.rpm > 100;
  const stroke = STATUS_STROKE[m.status] || STATUS_STROKE.healthy;
  const spinDur = active ? Math.max(0.12, 60 / Math.max(100, m.rpm)) : 0;
  const coolantOn = active && m.temperature > 40;

  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`cnc-win-grad-${m.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor={CREAM} stopOpacity="0.95" />
        </linearGradient>
        <pattern id={`cnc-grid-${m.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke={BORDER} strokeWidth="0.6" opacity="0.6" />
        </pattern>
      </defs>

      {/* Main Machine Enclosure Outer Wall */}
      <rect x="10" y="8" width="380" height="244" rx="8" fill={CANVAS} stroke={INK} strokeWidth="2" />

      {/* Machine Header Banner */}
      <rect x="10" y="8" width="380" height="26" rx="8" fill={INK} />
      <rect x="10" y="24" width="380" height="10" fill={INK} />
      <text x="200" y="25" textAnchor="middle" fill={CANVAS} fontSize="11" fontFamily="monospace" letterSpacing="0.14em" fontWeight="800">
        {m.code} · CNC PRECISION MILLING STATION
      </text>

      {/* Machine Base Pedestal */}
      <rect x="16" y="228" width="368" height="20" rx="3" fill={BEIGE} stroke={INK_MID} strokeWidth="1.2" />
      <line x1="20" y1="238" x2="380" y2="238" stroke={INK_SOFT} strokeWidth="0.8" strokeDasharray="6 4" />

      {/* Machining Chamber Interior */}
      <rect x="22" y="42" width="260" height="178" rx="5" fill={BEIGE} stroke={INK_MID} strokeWidth="1.4" />
      <rect x="30" y="50" width="244" height="162" rx="4" fill={`url(#cnc-win-grad-${m.id})`} stroke={BORDER} strokeWidth="1" />
      <rect x="30" y="50" width="244" height="162" fill={`url(#cnc-grid-${m.id})`} />

      {/* Coordinate & Safety Envelope Limits */}
      <line x1="38" y1="62" x2="266" y2="62" stroke={INK_SOFT} strokeDasharray="3 3" opacity="0.6" />
      <line x1="38" y1="202" x2="266" y2="202" stroke={INK_SOFT} strokeDasharray="3 3" opacity="0.6" />
      <line x1="38" y1="62" x2="38" y2="202" stroke={INK_SOFT} strokeDasharray="3 3" opacity="0.6" />
      <line x1="266" y1="62" x2="266" y2="202" stroke={INK_SOFT} strokeDasharray="3 3" opacity="0.6" />

      {/* Heavy T-Slot Machining Bed */}
      <rect x="44" y="180" width="216" height="24" rx="2" fill={STEEL} stroke={INK} strokeWidth="1.2" />
      <line x1="48" y1="188" x2="256" y2="188" stroke={INK_MID} strokeWidth="1" />
      <line x1="48" y1="196" x2="256" y2="196" stroke={INK_MID} strokeWidth="1" />

      {/* Clamped Workpiece on Bed */}
      <rect x="100" y="162" width="104" height="20" rx="2" fill={WOOD} stroke={INK} strokeWidth="1.2" />
      <rect x="94" y="166" width="8" height="14" rx="1" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />
      <rect x="202" y="166" width="8" height="14" rx="1" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />
      {/* Machined Pocket Contour */}
      <path d="M 120 162 L 132 170 L 172 170 L 184 162" fill="none" stroke={ORANGE_DARK} strokeWidth="1.2" />

      {/* Top Gantry X-Axis Rail */}
      <rect x="36" y="54" width="232" height="14" rx="2" fill={STEEL} stroke={INK} strokeWidth="1.2" />
      <line x1="40" y1="61" x2="264" y2="61" stroke={INK_MID} strokeWidth="1.5" />

      {/* Moving CNC Carriage & Z-Axis Spindle Assembly */}
      <g>
        {active && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 55,0; -45,0; 30,0; 0,0"
            dur="4.8s"
            repeatCount="indefinite"
          />
        )}
        {/* Carriage Head Base at Center (x=152) */}
        <rect x="136" y="58" width="32" height="26" rx="3" fill={STEEL_LIGHT} stroke={INK} strokeWidth="1.2" />
        <circle cx="152" cy="71" r="5" fill={INK_MID} />

        {/* Z-Axis Vertical Quill */}
        <g>
          {active && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,8; 0,-3; 0,10; 0,0"
              dur="2.4s"
              repeatCount="indefinite"
            />
          )}
          <rect x="146" y="84" width="12" height="38" fill={STEEL} stroke={INK} strokeWidth="1" />
          <line x1="152" y1="86" x2="152" y2="120" stroke={INK_MID} strokeWidth="1.5" />

          {/* Spindle Collet Chuck */}
          <rect x="144" y="122" width="16" height="14" rx="2" fill={INK} stroke={ORANGE} strokeWidth="1" />
          <circle cx="152" cy="129" r="3" fill={ORANGE} />

          {/* High-Speed Rotating End Mill Bit */}
          <rect x="150" y="136" width="4" height="26" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />
          {spinDur > 0 && (
            <g transform="translate(152, 149)">
              <line x1="-5" y1="0" x2="5" y2="0" stroke={INK} strokeWidth="1.5">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur={`${spinDur}s`}
                  repeatCount="indefinite"
                />
              </line>
            </g>
          )}

          {/* Cutting Sparks & Debris when Spindle Hits Cut Depth */}
          {active && (
            <g transform="translate(152, 162)">
              <circle cx="-6" cy="-2" r="1.5" fill={SPARK_GOLD}>
                <animate attributeName="opacity" values="1;0;1" dur="0.25s" repeatCount="indefinite" />
                <animate attributeName="cx" values="-2;-14;-2" dur="0.25s" repeatCount="indefinite" />
                <animate attributeName="cy" values="0;-8;0" dur="0.25s" repeatCount="indefinite" />
              </circle>
              <circle cx="6" cy="-2" r="1.5" fill={SPARK_GOLD}>
                <animate attributeName="opacity" values="0;1;0" dur="0.22s" repeatCount="indefinite" />
                <animate attributeName="cx" values="2;16;2" dur="0.22s" repeatCount="indefinite" />
                <animate attributeName="cy" values="0;-10;0" dur="0.22s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="-4" r="2" fill={ORANGE}>
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.18s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Coolant Fluid Spray Nozzles */}
          {coolantOn && (
            <>
              <path d="M 142 126 Q 136 142 148 160" stroke={COOLANT} strokeWidth="1.8" fill="none" opacity="0.85">
                <animate attributeName="opacity" values="0.4;0.95;0.4" dur="0.35s" repeatCount="indefinite" />
              </path>
              <path d="M 162 126 Q 168 142 156 160" stroke={COOLANT} strokeWidth="1.8" fill="none" opacity="0.85">
                <animate attributeName="opacity" values="0.95;0.4;0.95" dur="0.35s" repeatCount="indefinite" />
              </path>
            </>
          )}
        </g>
      </g>

      {/* Right Side: CNC Digital Operator Control Console (HMI) */}
      <rect x="290" y="42" width="94" height="178" rx="5" fill={INK} stroke={INK_MID} strokeWidth="1.2" />

      {/* HMI Status Header */}
      <rect x="296" y="48" width="82" height="16" rx="2" fill={INK_MID} />
      <circle cx="305" cy="56" r="4" fill={STATUS_DOT[m.status]}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </circle>
      <text x="316" y="60" fill={CANVAS} fontSize="8.5" fontFamily="monospace" fontWeight="700">
        {m.status.toUpperCase()}
      </text>

      {/* Live Digital Screen Readout */}
      <rect x="296" y="70" width="82" height="66" rx="3" fill="#0F172A" stroke={BORDER} strokeWidth="0.8" />
      <text x="302" y="83" fill="#38BDF8" fontSize="7.5" fontFamily="monospace" fontWeight="700">
        RPM: {m.rpm.toFixed(0)}
      </text>
      <text x="302" y="94" fill="#34D399" fontSize="7.5" fontFamily="monospace" fontWeight="700">
        TEMP: {m.temperature.toFixed(1)}°C
      </text>
      <text x="302" y="105" fill="#FBBF24" fontSize="7.5" fontFamily="monospace" fontWeight="700">
        FEED: F1450
      </text>
      <text x="302" y="116" fill="#F87171" fontSize="7.5" fontFamily="monospace" fontWeight="700">
        WEAR: {m.toolWear.toFixed(0)}%
      </text>
      <text x="302" y="127" fill="#94A3B8" fontSize="7" fontFamily="monospace">
        G01 X142.5 Y88
      </text>

      {/* Operator Keypad & Physical Pushbuttons */}
      <g transform="translate(296, 144)">
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={c * 15 + 4}
              y={r * 11 + 2}
              width="11"
              height="8"
              rx="1.5"
              fill={STEEL}
              stroke={INK_MID}
              strokeWidth="0.6"
            />
          ))
        )}
        {/* Emergency E-Stop Button */}
        <circle cx="68" cy="18" r="9" fill="#B23A3A" stroke={INK} strokeWidth="1.5">
          {m.status === "critical" && (
            <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" />
          )}
        </circle>
        <circle cx="68" cy="18" r="5" fill="#DC2626" />
      </g>

      {/* Tower Warning Beacon on Top Right */}
      <g transform="translate(366, 12)">
        <rect x="-6" y="0" width="12" height="12" rx="2" fill={INK} />
        <circle cx="0" cy="6" r="4" fill={stroke}>
          {m.status !== "healthy" && (
            <animate attributeName="opacity" values="0.3;1;0.3" dur="0.5s" repeatCount="indefinite" />
          )}
        </circle>
      </g>

      {/* High-visibility overlay if down / starved */}
      <DetailedStateOverlay m={m} />
    </svg>
  );
}

/* ─────────── 2. 6-AXIS ROBOTIC ARM ─────────── */
export function RoboticArmSVG({ m }: { m: MachineState }) {
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown;
  const stroke = STATUS_STROKE[m.status] || STATUS_STROKE.healthy;

  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id={`rob-glow-${m.id}`} cx="0.5" cy="0.5">
          <stop offset="0%" stopColor={STATUS_GLOW[m.status]} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Main Floor Enclosure */}
      <rect x="10" y="8" width="380" height="244" rx="8" fill={CANVAS} stroke={INK} strokeWidth="2" />

      {/* Header Banner */}
      <rect x="10" y="8" width="380" height="26" rx="8" fill={INK} />
      <rect x="10" y="24" width="380" height="10" fill={INK} />
      <text x="200" y="25" textAnchor="middle" fill={CANVAS} fontSize="11" fontFamily="monospace" letterSpacing="0.14em" fontWeight="800">
        {m.code} · 6-AXIS ARTICULATED ROBOTIC WORKCELL
      </text>

      {/* Workcell Grid Floor */}
      <rect x="20" y="42" width="360" height="196" rx="6" fill={BEIGE} stroke={INK_MID} strokeWidth="1.2" />

      {/* Circular Laser Safety Perimeter Zone */}
      <circle cx="200" cy="140" r="86" fill="none" stroke={ORANGE} strokeWidth="1.2" strokeDasharray="5 4" opacity="0.65" />
      <circle cx="200" cy="140" r="86" fill={`url(#rob-glow-${m.id})`} opacity="0.7" />

      {/* Infeed Conveyor Stub & Pickup Box on Left (x: 20 to 76, y: 130 to 154) */}
      <rect x="20" y="130" width="56" height="24" rx="3" fill={STEEL} stroke={INK} strokeWidth="1.2" />
      <line x1="24" y1="138" x2="72" y2="138" stroke={INK_MID} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="24" y1="146" x2="72" y2="146" stroke={INK_MID} strokeWidth="1" strokeDasharray="3 3" />
      
      {/* Workpiece on Infeed Box (Arrives when arm is ready to pick) */}
      <rect x="44" y="132" width="20" height="18" rx="2" fill={WOOD} stroke={INK} strokeWidth="1.2">
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

      {/* Outfeed Pallet Station & Drop Box on Right (x: 324 to 380, y: 130 to 154) */}
      <rect x="324" y="130" width="56" height="24" rx="3" fill={STEEL} stroke={INK} strokeWidth="1.2" />
      <rect x="336" y="132" width="22" height="18" rx="2" fill={ORANGE_DARK} stroke={INK} strokeWidth="1.2">
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

      {/* Heavy Steel Pedestal Mounting Base (Center at 200, 142) */}
      <circle cx="200" cy="142" r="26" fill={INK} stroke={stroke} strokeWidth="1.8" />
      <circle cx="200" cy="142" r="18" fill={STEEL} stroke={INK} strokeWidth="1.2" />
      <circle cx="200" cy="142" r="7" fill={INK_MID} />

      {/* Dynamic 6-Axis Rotating Arm Hierarchy: Sweeps Left (-84°) to Right (+84°) */}
      <g transform="translate(200, 142)">
        <g>
          {active && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-84; -84; -70; 0; 70; 84; 84; 70; -70; -84"
              keyTimes="0; 0.15; 0.25; 0.45; 0.55; 0.65; 0.75; 0.85; 0.95; 1"
              dur="4.4s"
              repeatCount="indefinite"
            />
          )}

          {/* Primary Arm Link (Length: 52px) */}
          <rect x="-9" y="-52" width="18" height="56" rx="5" fill={ORANGE} stroke={INK} strokeWidth="1.3" />
          <line x1="0" y1="-46" x2="0" y2="-6" stroke={ORANGE_DARK} strokeWidth="2" />
          <circle cx="0" cy="0" r="5" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />

          {/* Elbow Joint (J2/J3) at y = -52 */}
          <g transform="translate(0, -52)">
            <circle cx="0" cy="0" r="9" fill={INK_MID} stroke={INK} strokeWidth="1.2" />
            <circle cx="0" cy="0" r="5" fill={STEEL} />

            {/* Forearm Link (Length: 46px) */}
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
              <rect x="-7" y="-46" width="14" height="48" rx="3.5" fill={STEEL_LIGHT} stroke={INK} strokeWidth="1.2" />
              <line x1="0" y1="-40" x2="0" y2="-6" stroke={INK_SOFT} strokeWidth="1.2" />

              {/* Wrist Joint Assembly (J4/J5/J6) at y = -46 */}
              <g transform="translate(0, -46)">
                <circle cx="0" cy="0" r="6" fill={ORANGE_DARK} stroke={INK} strokeWidth="0.8" />

                {/* Pneumatic Tool Gripper Head */}
                <g>
                  <rect x="-8" y="-10" width="16" height="8" rx="1.5" fill={INK} stroke={INK_MID} />
                  {/* Left Gripper Finger */}
                  <rect x="-8" y="-20" width="4" height="12" rx="1" fill={STEEL} stroke={INK} strokeWidth="0.8">
                    {active && (
                      <animate
                        attributeName="x"
                        values="-8;-11;-8;-8;-8;-11;-11;-8;-8;-8"
                        keyTimes="0; 0.12; 0.20; 0.55; 0.62; 0.70; 0.78; 0.85; 0.95; 1"
                        dur="4.4s"
                        repeatCount="indefinite"
                      />
                    )}
                  </rect>
                  {/* Right Gripper Finger */}
                  <rect x="4" y="-20" width="4" height="12" rx="1" fill={STEEL} stroke={INK} strokeWidth="0.8">
                    {active && (
                      <animate
                        attributeName="x"
                        values="4;7;4;4;4;7;7;4;4;4"
                        keyTimes="0; 0.12; 0.20; 0.55; 0.62; 0.70; 0.78; 0.85; 0.95; 1"
                        dur="4.4s"
                        repeatCount="indefinite"
                      />
                    )}
                  </rect>

                  {/* Picked Workpiece Carried in Gripper across Arc */}
                  {active && (
                    <rect x="-6" y="-18" width="12" height="10" rx="1" fill={WOOD} stroke={INK} strokeWidth="0.8">
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
      </g>

      {/* Live HUD Telemetry Overlay on Bottom */}
      <rect x="28" y="200" width="344" height="28" rx="4" fill={INK} stroke={INK_MID} strokeWidth="1" />
      <text x="40" y="218" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" fontWeight="700">
        J1: +42° | J2: -18° | J3: +95°
      </text>
      <text x="210" y="218" fill="#34D399" fontSize="8.5" fontFamily="monospace" fontWeight="700">
        PAYLOAD: 12.4 kg (NOMINAL)
      </text>
      <circle cx="356" cy="214" r="4" fill={STATUS_DOT[m.status]}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </circle>

      {/* State Overlay */}
      <DetailedStateOverlay m={m} />
    </svg>
  );
}

/* ─────────── 3. HIGH-SPEED INFEED / OUTFEED CONVEYOR ─────────── */
export function ConveyorSVG({ m }: { m: MachineState }) {
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown && m.load > 0.05;
  const stroke = STATUS_STROKE[m.status] || STATUS_STROKE.healthy;
  const speed = active ? Math.max(1.2, 16 / Math.max(20, m.rpm / 6)) : 0;

  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" style={{ display: "block" }}>
      {/* Enclosure */}
      <rect x="10" y="8" width="380" height="244" rx="8" fill={CANVAS} stroke={INK} strokeWidth="2" />

      {/* Header Banner */}
      <rect x="10" y="8" width="380" height="26" rx="8" fill={INK} />
      <rect x="10" y="24" width="380" height="10" fill={INK} />
      <text x="200" y="25" textAnchor="middle" fill={CANVAS} fontSize="11" fontFamily="monospace" letterSpacing="0.14em" fontWeight="800">
        {m.code} · HIGH-SPEED LINE CONVEYOR SYSTEM
      </text>

      {/* Conveyor Bed Bay */}
      <rect x="20" y="42" width="360" height="196" rx="6" fill={BEIGE} stroke={INK_MID} strokeWidth="1.2" />

      {/* Tubular Support Legs with Vibration Pads */}
      <rect x="46" y="146" width="14" height="66" fill={INK} />
      <rect x="40" y="208" width="26" height="8" rx="2" fill={INK_MID} />
      <rect x="194" y="146" width="14" height="66" fill={INK} />
      <rect x="188" y="208" width="26" height="8" rx="2" fill={INK_MID} />
      <rect x="340" y="146" width="14" height="66" fill={INK} />
      <rect x="334" y="208" width="26" height="8" rx="2" fill={INK_MID} />

      {/* Cross Bracing Struts */}
      <line x1="53" y1="180" x2="201" y2="210" stroke={INK_SOFT} strokeWidth="2" />
      <line x1="201" y1="210" x2="347" y2="180" stroke={INK_SOFT} strokeWidth="2" />

      {/* Conveyor Frame Bed Structure */}
      <rect x="28" y="104" width="344" height="52" rx="26" fill={INK} stroke={stroke} strokeWidth="2" />

      {/* Driven Drive Drums on Both Ends */}
      <circle cx="54" cy="130" r="20" fill={STEEL} stroke={INK} strokeWidth="1.5" />
      <circle cx="54" cy="130" r="7" fill={INK_MID} />
      <circle cx="346" cy="130" r="20" fill={STEEL} stroke={INK} strokeWidth="1.5" />
      <circle cx="346" cy="130" r="7" fill={INK_MID} />

      {/* Internal Continuous Roller Bearings */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <circle key={i} cx={86 + i * 28} cy={130} r="14" fill={STEEL_LIGHT} stroke={INK_MID} strokeWidth="1">
          {active && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${86 + i * 28} 130`}
              to={`360 ${86 + i * 28} 130`}
              dur={`${speed * 0.75}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}

      {/* Top Conveyor Rubber Belt Track */}
      <rect x="54" y="112" width="292" height="12" rx="2" fill={INK_MID} stroke={INK} strokeWidth="1" />
      <line x1="54" y1="118" x2="346" y2="118" stroke={STEEL} strokeWidth="1" strokeDasharray="8 6">
        {active && (
          <animate attributeName="stroke-dashoffset" values="0;-28" dur={`${speed}s`} repeatCount="indefinite" />
        )}
      </line>

      {/* Palletized Workpieces Advancing on the Belt */}
      {active &&
        [0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect y="92" width="28" height="20" rx="3" fill={ORANGE} stroke={INK} strokeWidth="1.2">
              <animate
                attributeName="x"
                values="48;336"
                dur={`${speed * 4}s`}
                begin={`${i * speed}s`}
                repeatCount="indefinite"
              />
            </rect>
            {/* Part Core Detail */}
            <rect y="96" width="16" height="12" rx="1" fill={WOOD} stroke={INK_MID} strokeWidth="0.6">
              <animate
                attributeName="x"
                values="54;342"
                dur={`${speed * 4}s`}
                begin={`${i * speed}s`}
                repeatCount="indefinite"
              />
            </rect>
          </g>
        ))}

      {/* Overhead Laser / Optical Barcode Scanner Bridge */}
      <rect x="188" y="58" width="24" height="20" rx="3" fill={INK} stroke={stroke} strokeWidth="1.2" />
      <circle cx="200" cy="68" r="4" fill={stroke} />

      {/* Red Laser Scan Beam */}
      <line x1="200" y1="78" x2="200" y2="112" stroke="#EF4444" strokeWidth="2.5" opacity="0.85">
        {active && <animate attributeName="opacity" values="0.2;1;0.2" dur="0.4s" repeatCount="indefinite" />}
      </line>
      <polygon points="190,112 210,112 200,78" fill="#EF4444" opacity="0.15">
        {active && <animate attributeName="opacity" values="0.05;0.25;0.05" dur="0.4s" repeatCount="indefinite" />}
      </polygon>

      {/* Digital Line Speed Readout */}
      <rect x="280" y="52" width="92" height="22" rx="3" fill={INK} />
      <text x="326" y="67" textAnchor="middle" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" fontWeight="700">
        {(m.produced / 10).toFixed(1)} m/s · {m.rpm.toFixed(0)} RPM
      </text>

      {/* State Overlay */}
      <DetailedStateOverlay m={m} />
    </svg>
  );
}

/* ─────────── 4. CNC-07 HEAVY TURNING LATHE ─────────── */
export function CNCLatheSVG({ m }: { m: MachineState }) {
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown && m.rpm > 100;
  const stroke = STATUS_STROKE[m.status] || STATUS_STROKE.healthy;
  const spinDur = active ? Math.max(0.1, 60 / Math.max(100, m.rpm)) : 0;

  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" style={{ display: "block" }}>
      <rect x="10" y="8" width="380" height="244" rx="8" fill={CANVAS} stroke={INK} strokeWidth="2" />

      {/* Header Banner */}
      <rect x="10" y="8" width="380" height="26" rx="8" fill={INK} />
      <rect x="10" y="24" width="380" height="10" fill={INK} />
      <text x="200" y="25" textAnchor="middle" fill={CANVAS} fontSize="11" fontFamily="monospace" letterSpacing="0.14em" fontWeight="800">
        {m.code} · CNC HEAVY HORIZONTAL LATHE
      </text>

      {/* Lathe Bed Interior */}
      <rect x="20" y="42" width="360" height="196" rx="6" fill={BEIGE} stroke={INK_MID} strokeWidth="1.2" />

      {/* Heavy Lathe Slant Bed Rails */}
      <rect x="34" y="174" width="332" height="42" rx="3" fill={STEEL} stroke={INK} strokeWidth="1.5" />
      <line x1="38" y1="188" x2="362" y2="188" stroke={INK_MID} strokeWidth="1.8" />
      <line x1="38" y1="202" x2="362" y2="202" stroke={INK_MID} strokeWidth="1.8" />

      {/* Left Headstock Housing */}
      <rect x="34" y="68" width="84" height="110" rx="4" fill={INK} stroke={stroke} strokeWidth="1.4" />
      <rect x="42" y="78" width="68" height="22" rx="2" fill={INK_MID} />
      <text x="76" y="93" textAnchor="middle" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="700">
        {m.rpm.toFixed(0)} RPM
      </text>

      {/* 3-Jaw Lathe Chuck on Spindle Spindle Nose */}
      <g transform="translate(118, 126)">
        <rect x="0" y="-36" width="22" height="72" rx="3" fill={STEEL} stroke={INK} strokeWidth="1.4" />
        {/* Chuck Jaws */}
        <rect x="22" y="-32" width="10" height="14" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />
        <rect x="22" y="18" width="10" height="14" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />

        {/* Dynamic Rotation Marks */}
        {spinDur > 0 && (
          <g>
            <line x1="11" y1="-30" x2="11" y2="30" stroke={INK_MID} strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 11 0"
                to="360 11 0"
                dur={`${spinDur}s`}
                repeatCount="indefinite"
              />
            </line>
          </g>
        )}
      </g>

      {/* Clamped Cylindrical Billet Workpiece */}
      <rect x="150" y="112" width="140" height="28" rx="2" fill={WOOD} stroke={INK} strokeWidth="1.2" />
      <line x1="150" y1="126" x2="290" y2="126" stroke={ORANGE_DARK} strokeWidth="1.2" strokeDasharray="6 3" />

      {/* Right Tailstock Body with Live Center Quill */}
      <rect x="290" y="92" width="60" height="86" rx="4" fill={STEEL} stroke={INK} strokeWidth="1.4" />
      <polygon points="290,126 276,120 276,132" fill={STEEL_LIGHT} stroke={INK} strokeWidth="1" />

      {/* Traversing Cross-Slide Tool Turret */}
      <g>
        {active && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 80,0; 20,0; 0,0"
            dur="4.2s"
            repeatCount="indefinite"
          />
        )}
        <rect x="180" y="148" width="48" height="34" rx="3" fill={STEEL_LIGHT} stroke={INK} strokeWidth="1.2" />
        {/* Carbide Turning Insert Tool Post */}
        <rect x="194" y="128" width="14" height="22" fill={INK} stroke={ORANGE} strokeWidth="1" />
        <polygon points="201,126 195,134 207,134" fill={SPARK_GOLD} stroke={INK} strokeWidth="0.8" />

        {/* Hot Metal Curling Chips & Sparks */}
        {active && (
          <g transform="translate(201, 126)">
            <circle cx="-4" cy="-8" r="1.5" fill={SPARK_GOLD}>
              <animate attributeName="opacity" values="1;0;1" dur="0.2s" repeatCount="indefinite" />
              <animate attributeName="cy" values="0;-16;0" dur="0.2s" repeatCount="indefinite" />
              <animate attributeName="cx" values="0;-12;0" dur="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="4" cy="-6" r="1.5" fill={ORANGE}>
              <animate attributeName="opacity" values="0;1;0" dur="0.24s" repeatCount="indefinite" />
              <animate attributeName="cy" values="0;-14;0" dur="0.24s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </g>

      {/* State Overlay */}
      <DetailedStateOverlay m={m} />
    </svg>
  );
}

/* ─────────── 5. HYDRAULIC STAMPING PRESS ─────────── */
export function HydraulicPressSVG({ m }: { m: MachineState }) {
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown;
  const stroke = STATUS_STROKE[m.status] || STATUS_STROKE.healthy;

  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" style={{ display: "block" }}>
      <rect x="10" y="8" width="380" height="244" rx="8" fill={CANVAS} stroke={INK} strokeWidth="2" />

      {/* Header Banner */}
      <rect x="10" y="8" width="380" height="26" rx="8" fill={INK} />
      <rect x="10" y="24" width="380" height="10" fill={INK} />
      <text x="200" y="25" textAnchor="middle" fill={CANVAS} fontSize="11" fontFamily="monospace" letterSpacing="0.14em" fontWeight="800">
        {m.code} · HIGH-TONNAGE HYDRAULIC PRESS
      </text>

      {/* Press Bay Enclosure */}
      <rect x="20" y="42" width="360" height="196" rx="6" fill={BEIGE} stroke={INK_MID} strokeWidth="1.2" />

      {/* Massive Base Bolster Bed */}
      <rect x="60" y="196" width="280" height="34" rx="4" fill={STEEL} stroke={INK} strokeWidth="1.6" />

      {/* 4 Heavy Hardened Steel Guide Tie-Pillars */}
      <rect x="80" y="60" width="18" height="140" fill={INK_MID} stroke={INK} strokeWidth="1.2" />
      <rect x="110" y="60" width="12" height="140" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />
      <rect x="278" y="60" width="12" height="140" fill={STEEL_LIGHT} stroke={INK} strokeWidth="0.8" />
      <rect x="302" y="60" width="18" height="140" fill={INK_MID} stroke={INK} strokeWidth="1.2" />

      {/* Massive Hydraulic Crown Box */}
      <rect x="60" y="48" width="280" height="38" rx="4" fill={INK} stroke={stroke} strokeWidth="1.6" />
      <text x="200" y="66" textAnchor="middle" fill={CANVAS} fontSize="9" fontFamily="monospace" fontWeight="700">
        HYDRAULIC FORCE RAM · 500 kN
      </text>

      {/* Hydraulic Main Piston Cylinder */}
      <rect x="176" y="78" width="48" height="42" fill={STEEL} stroke={INK} strokeWidth="1.4" />

      {/* Reciprocating Stamping Ram & Upper Die */}
      <g>
        {active && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,46; 0,46; 0,0; 0,0"
            keyTimes="0; 0.35; 0.45; 0.85; 1"
            dur="2.8s"
            repeatCount="indefinite"
          />
        )}
        {/* Piston Rod */}
        <rect x="190" y="118" width="20" height="36" fill={STEEL_LIGHT} stroke={INK} strokeWidth="1.2" />
        {/* Upper Platen */}
        <rect x="110" y="148" width="180" height="18" rx="2" fill={INK} stroke={ORANGE} strokeWidth="1.2" />
        <rect x="140" y="164" width="120" height="10" fill={STEEL} stroke={INK} strokeWidth="1" />
      </g>

      {/* Lower Die on Bed with Sheet Metal Blank */}
      <rect x="136" y="186" width="128" height="12" rx="1" fill={STEEL_LIGHT} stroke={INK} strokeWidth="1" />
      <rect x="146" y="180" width="108" height="8" rx="1" fill={ORANGE} stroke={INK} strokeWidth="1">
        {active && (
          <animate
            attributeName="height"
            values="8;3;3;8;8"
            keyTimes="0; 0.35; 0.45; 0.85; 1"
            dur="2.8s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Safety Optical Light Curtain (Red Protection Beams) */}
      <line x1="72" y1="90" x2="72" y2="190" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 3" opacity="0.8">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="0.8s" repeatCount="indefinite" />
      </line>
      <line x1="328" y1="90" x2="328" y2="190" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 3" opacity="0.8">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="0.8s" repeatCount="indefinite" />
      </line>

      {/* Oscillating Hydraulic Pressure Gauge Dial */}
      <circle cx="44" cy="94" r="16" fill={CANVAS} stroke={INK} strokeWidth="1.5" />
      <text x="44" y="86" textAnchor="middle" fill={INK_MID} fontSize="6" fontFamily="monospace">BAR</text>
      <line x1="44" y1="94" x2="54" y2="86" stroke="#B23A3A" strokeWidth="2">
        {active && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 44 94; 85 44 94; 85 44 94; 0 44 94; 0 44 94"
            keyTimes="0; 0.35; 0.45; 0.85; 1"
            dur="2.8s"
            repeatCount="indefinite"
          />
        )}
      </line>

      {/* State Overlay */}
      <DetailedStateOverlay m={m} />
    </svg>
  );
}

/* ─────────── 6. AS/RS AUTOMATED HIGH-BAY WAREHOUSE ─────────── */
export function WarehouseSVG({ m }: { m: MachineState }) {
  const isDown = m.status === "downtime" || m.isolated;
  const active = !isDown;
  const fillFraction = Math.min(1, Math.max(0.1, m.queue / Math.max(1, m.capacity)));
  const totalBins = 18;
  const filledBins = Math.round(fillFraction * totalBins);

  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" style={{ display: "block" }}>
      <rect x="10" y="8" width="380" height="244" rx="8" fill={CANVAS} stroke={INK} strokeWidth="2" />

      {/* Header Banner */}
      <rect x="10" y="8" width="380" height="26" rx="8" fill={INK} />
      <rect x="10" y="24" width="380" height="10" fill={INK} />
      <text x="200" y="25" textAnchor="middle" fill={CANVAS} fontSize="11" fontFamily="monospace" letterSpacing="0.14em" fontWeight="800">
        {m.code} · AS/RS AUTOMATED STORAGE & RETRIEVAL SYSTEM
      </text>

      {/* Warehouse Floor */}
      <rect x="20" y="42" width="360" height="196" rx="6" fill={BEIGE} stroke={INK_MID} strokeWidth="1.2" />

      {/* High-Bay Rack Grid (3 Rows × 6 Columns = 18 storage cells) */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4, 5].map((col) => {
          const idx = row * 6 + col;
          const isFilled = idx < filledBins;
          const x = 32 + col * 54;
          const y = 52 + row * 48;

          return (
            <g key={`${row}-${col}`}>
              {/* Rack Cell Frame */}
              <rect x={x} y={y} width="48" height="42" fill={CREAM} stroke={INK_MID} strokeWidth="1.2" />
              {/* Shelving beam */}
              <line x1={x} y1={y + 38} x2={x + 48} y2={y + 38} stroke={STEEL} strokeWidth="2" />

              {/* Stored Palletized Unit Load */}
              {isFilled && (
                <g>
                  <rect x={x + 5} y={y + 12} width="38" height="24" rx="2" fill={ORANGE} stroke={INK} strokeWidth="1" />
                  <rect x={x + 9} y={y + 16} width="30" height="8" rx="1" fill={WOOD} opacity="0.9" />
                  <rect x={x + 9} y={y + 26} width="30" height="8" rx="1" fill={WOOD} opacity="0.9" />
                </g>
              )}
            </g>
          );
        })
      )}

      {/* Motorized Stacker Crane / Shuttle Mast */}
      <g>
        {active && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 160,0; 60,0; 240,0; 0,0"
            dur="6.4s"
            repeatCount="indefinite"
          />
        )}
        {/* Top & Bottom Guided Crane Rails */}
        <rect x="42" y="46" width="12" height="154" fill={INK} stroke={ORANGE} strokeWidth="1" />

        {/* Vertical Elevator Carriage with Telescopic Forks */}
        <g>
          {active && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,48; 0,-40; 0,20; 0,0"
              dur="3.2s"
              repeatCount="indefinite"
            />
          )}
          <rect x="34" y="104" width="28" height="16" rx="2" fill={STEEL_LIGHT} stroke={INK} strokeWidth="1.2" />
          <circle cx="48" cy="112" r="3" fill={ORANGE} />
          {/* Telescopic Fork */}
          <rect x="58" y="110" width="16" height="4" fill={STEEL} stroke={INK} strokeWidth="0.8" />
        </g>
      </g>

      {/* Ground Dock Infeed Buffer with Automated AGV Forklift */}
      <rect x="26" y="204" width="348" height="26" rx="3" fill={INK} stroke={INK_MID} strokeWidth="1" />
      <text x="40" y="221" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" fontWeight="700">
        OCCUPANCY: {m.queue} / {m.capacity} BLANKS ({((m.queue / m.capacity) * 100).toFixed(0)}%)
      </text>

      {/* Automated AGV Shuttle Cart Moving Along Dock */}
      {active && (
        <g>
          <rect y="208" width="34" height="18" rx="3" fill={ORANGE} stroke={CANVAS} strokeWidth="1.2">
            <animate
              attributeName="x"
              values="180;320;180"
              dur="5.2s"
              repeatCount="indefinite"
            />
          </rect>
          <circle cy="222" r="3" fill={INK}>
            <animate attributeName="cx" values="188;328;188" dur="5.2s" repeatCount="indefinite" />
          </circle>
          <circle cy="222" r="3" fill={INK}>
            <animate attributeName="cx" values="206;346;206" dur="5.2s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* State Overlay */}
      <DetailedStateOverlay m={m} />
    </svg>
  );
}

/* ─────────── MAIN DISPATCHER ─────────── */
export function MachineSVG({ m }: { m: MachineState }) {
  if (m.code === "CELL-04" || m.label.toLowerCase().includes("lathe")) {
    return <CNCLatheSVG m={m} />;
  }

  switch (m.kind) {
    case "cnc":
      return <CNCMachineSVG m={m} />;
    case "robot":
      return <RoboticArmSVG m={m} />;
    case "conveyor":
      return <ConveyorSVG m={m} />;
    case "press":
      return <HydraulicPressSVG m={m} />;
    case "warehouse":
      return <WarehouseSVG m={m} />;
    default:
      return <CNCMachineSVG m={m} />;
  }
}
