"use client";

import { MachineState } from "@/hooks/useFactorySim";

const STATUS_STROKE: Record<string, string> = {
  healthy: "#4ADE80",
  warning: "#FACC15",
  critical: "#F87171",
  downtime: "#94a3b8",
};

const STATUS_GLOW: Record<string, string> = {
  healthy: "rgba(74,222,128,0.35)",
  warning: "rgba(250,204,21,0.35)",
  critical: "rgba(248,113,113,0.55)",
  downtime: "rgba(148,163,184,0.25)",
};

function heatColor(temp: number) {
  if (temp > 88) return "#F87171";
  if (temp > 75) return "#FB923C";
  if (temp > 60) return "#FACC15";
  return "#4ADE80";
}

/* ─────────── CNC MACHINE ─────────── */
export function CNCMachineSVG({ m }: { m: MachineState }) {
  const stroke = STATUS_STROKE[m.status];
  const glow = STATUS_GLOW[m.status];
  const spinDur = m.status === "downtime" ? 0 : Math.max(0.15, 60 / Math.max(60, m.rpm));
  const carriageX = 60 + Math.sin(m.history.length * 0.4) * 40; // sweep tool head
  const coolantOn = m.temperature > 70 && m.status !== "downtime";

  return (
    <svg viewBox="0 0 220 160" width="100%" height="100%">
      <defs>
        <linearGradient id={`cnc-body-${m.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1f2937" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id={`cnc-glow-${m.id}`} cx="0.5" cy="0.5">
          <stop offset="0" stopColor={glow} />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Status glow */}
      <rect x="0" y="0" width="220" height="160" fill={`url(#cnc-glow-${m.id})`} opacity="0.6" />

      {/* Base */}
      <rect x="15" y="115" width="190" height="30" rx="4" fill="#0b1220" stroke={stroke} strokeWidth="1" />
      <rect x="15" y="140" width="190" height="8" rx="1" fill="#020617" />

      {/* Main housing */}
      <rect
        x="25"
        y="35"
        width="170"
        height="85"
        rx="6"
        fill={`url(#cnc-body-${m.id})`}
        stroke={stroke}
        strokeWidth="1.5"
      />

      {/* Viewing window */}
      <rect x="35" y="50" width="150" height="45" rx="3" fill="#020617" stroke="#334155" strokeWidth="1" />
      <rect x="35" y="50" width="150" height="45" rx="3" fill={heatColor(m.temperature)} opacity="0.12" />

      {/* X-axis rail */}
      <line x1="40" y1="58" x2="180" y2="58" stroke="#475569" strokeWidth="1.5" />

      {/* Tool head (carriage) */}
      <g transform={`translate(${carriageX}, 55)`}>
        <rect x="-8" y="0" width="16" height="14" fill="#e2e8f0" stroke={stroke} />
        {/* Spinning spindle */}
        <g transform="translate(0, 20)">
          <circle r="5" fill="#94a3b8" stroke={stroke} strokeWidth="0.8" />
          {spinDur > 0 && (
            <g>
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#0f172a" strokeWidth="1.4">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur={`${spinDur}s`}
                  repeatCount="indefinite"
                />
              </line>
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#0f172a" strokeWidth="1.4">
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
          {/* Tool bit */}
          <rect x="-1" y="5" width="2" height="14" fill="#cbd5e1" />
        </g>

        {/* Coolant spray */}
        {coolantOn && (
          <>
            <line x1="-6" y1="30" x2="-14" y2="42" stroke="#38bdf8" strokeWidth="1.2" opacity="0.7">
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur="0.6s" repeatCount="indefinite" />
            </line>
            <line x1="6" y1="30" x2="14" y2="42" stroke="#38bdf8" strokeWidth="1.2" opacity="0.7">
              <animate attributeName="opacity" values="0.9;0.2;0.9" dur="0.6s" repeatCount="indefinite" />
            </line>
          </>
        )}
      </g>

      {/* Workpiece on bed */}
      <rect x="90" y="98" width="40" height="8" fill="#78716c" stroke="#292524" />

      {/* HMI panel */}
      <rect x="35" y="100" width="35" height="15" rx="1" fill="#0b1220" stroke={stroke} strokeWidth="0.8" />
      <circle cx="42" cy="107" r="1.8" fill={stroke}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <rect x="46" y="105" width="20" height="1.6" fill="#334155" />
      <rect x="46" y="109" width="15" height="1.6" fill="#334155" />

      {/* Warning beacon */}
      {(m.status === "critical" || m.status === "downtime") && (
        <g transform="translate(190, 25)">
          <circle r="6" fill="#F87171" opacity="0.9">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle r="10" fill="none" stroke="#F87171" strokeWidth="1" opacity="0.5">
            <animate attributeName="r" values="6;14;6" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="0.8s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Nameplate */}
      <text x="110" y="130" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
        {m.code}
      </text>
    </svg>
  );
}

/* ─────────── ROBOTIC ARM ─────────── */
export function RoboticArmSVG({ m }: { m: MachineState }) {
  const stroke = STATUS_STROKE[m.status];
  const glow = STATUS_GLOW[m.status];
  const swing = m.status === "downtime" ? 0 : Math.sin(m.history.length * 0.25) * 35;
  const wrist = m.status === "downtime" ? 0 : Math.cos(m.history.length * 0.3) * 45;

  return (
    <svg viewBox="0 0 220 160" width="100%" height="100%">
      <defs>
        <radialGradient id={`rob-glow-${m.id}`} cx="0.5" cy="0.5">
          <stop offset="0" stopColor={glow} />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="220" height="160" fill={`url(#rob-glow-${m.id})`} opacity="0.6" />

      {/* Floor */}
      <rect x="15" y="130" width="190" height="18" rx="2" fill="#0b1220" stroke={stroke} strokeWidth="1" />

      {/* Pedestal */}
      <rect x="95" y="110" width="30" height="24" fill="#1f2937" stroke={stroke} strokeWidth="1" />
      <circle cx="110" cy="110" r="10" fill="#334155" stroke={stroke} strokeWidth="1.2" />

      {/* Rotating shoulder joint */}
      <g transform={`translate(110, 110) rotate(${swing})`}>
        {/* Upper arm */}
        <rect x="-6" y="-55" width="12" height="60" rx="3" fill="#e2e8f0" stroke={stroke} strokeWidth="1.2" />
        {/* Servo details */}
        <circle cx="0" cy="0" r="4" fill="#0f172a" stroke={stroke} strokeWidth="0.8" />
        <circle cx="0" cy="-50" r="5" fill="#94a3b8" stroke={stroke} strokeWidth="1" />

        {/* Elbow joint */}
        <g transform={`translate(0, -50) rotate(${wrist})`}>
          {/* Forearm */}
          <rect x="-5" y="-50" width="10" height="55" rx="3" fill="#cbd5e1" stroke={stroke} strokeWidth="1.2" />
          <circle cx="0" cy="-50" r="4" fill="#94a3b8" stroke={stroke} strokeWidth="1" />

          {/* Gripper */}
          <g transform="translate(0, -50)">
            <rect x="-6" y="-8" width="12" height="6" fill="#e2e8f0" stroke={stroke} />
            <rect x="-6" y="-14" width="3" height="8" fill={stroke}>
              <animate
                attributeName="x"
                values="-6;-8;-6"
                dur="1.4s"
                repeatCount={m.status === "downtime" ? "1" : "indefinite"}
              />
            </rect>
            <rect x="3" y="-14" width="3" height="8" fill={stroke}>
              <animate
                attributeName="x"
                values="3;5;3"
                dur="1.4s"
                repeatCount={m.status === "downtime" ? "1" : "indefinite"}
              />
            </rect>
            {/* Held part */}
            {m.load > 0.4 && m.status !== "downtime" && (
              <rect x="-3" y="-4" width="6" height="6" fill="#f59e0b" opacity="0.9" />
            )}
          </g>

          {/* Hydraulic tube */}
          <line x1="-5" y1="-20" x2="5" y2="-20" stroke="#64748b" strokeWidth="0.6" />
        </g>

        {/* Cable */}
        <path d="M -6 -20 Q -14 -10 -10 5" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.6" />
      </g>

      {/* Base label */}
      <text x="110" y="128" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
        {m.code}
      </text>

      {/* Alert beacon */}
      {(m.status === "critical" || m.status === "downtime") && (
        <circle cx="30" cy="30" r="5" fill="#F87171">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.6s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

/* ─────────── CONVEYOR BELT ─────────── */
export function ConveyorSVG({ m }: { m: MachineState }) {
  const stroke = STATUS_STROKE[m.status];
  const glow = STATUS_GLOW[m.status];
  const beltDur = m.status === "downtime" ? 0 : Math.max(0.4, 20 / Math.max(20, m.rpm / 8));
  const active = m.status !== "downtime" && m.load > 0.1;

  return (
    <svg viewBox="0 0 220 160" width="100%" height="100%">
      <defs>
        <radialGradient id={`conv-glow-${m.id}`} cx="0.5" cy="0.5">
          <stop offset="0" stopColor={glow} />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
        <pattern
          id={`belt-pat-${m.id}`}
          x="0"
          y="0"
          width="20"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <rect width="20" height="16" fill="#1f2937" />
          <line x1="0" y1="0" x2="0" y2="16" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="10" y1="2" x2="10" y2="14" stroke="#334155" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="220" height="160" fill={`url(#conv-glow-${m.id})`} opacity="0.6" />

      {/* Support legs */}
      <rect x="30" y="100" width="6" height="40" fill="#1f2937" />
      <rect x="184" y="100" width="6" height="40" fill="#1f2937" />

      {/* Belt frame */}
      <rect x="20" y="70" width="180" height="30" rx="15" fill="#0f172a" stroke={stroke} strokeWidth="1.5" />

      {/* Rollers */}
      <circle cx="35" cy="85" r="10" fill="#334155" stroke={stroke} strokeWidth="1" />
      <circle cx="185" cy="85" r="10" fill="#334155" stroke={stroke} strokeWidth="1" />

      {/* Belt surface with moving pattern */}
      <rect x="35" y="76" width="150" height="18" fill={`url(#belt-pat-${m.id})`}>
        {active && (
          <animate
            attributeName="x"
            values="15;35"
            dur={`${beltDur}s`}
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Roller center spins */}
      {active && (
        <>
          <line x1="35" y1="85" x2="35" y2="78" stroke={stroke} strokeWidth="1.2">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 35 85"
              to="360 35 85"
              dur={`${beltDur}s`}
              repeatCount="indefinite"
            />
          </line>
          <line x1="185" y1="85" x2="185" y2="78" stroke={stroke} strokeWidth="1.2">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 185 85"
              to="360 185 85"
              dur={`${beltDur}s`}
              repeatCount="indefinite"
            />
          </line>
        </>
      )}

      {/* Parts moving on belt */}
      {active &&
        [0, 1, 2].map((i) => (
          <g key={i}>
            <rect y="68" width="14" height="10" fill="#f59e0b" stroke="#78350f" rx="1">
              <animate
                attributeName="x"
                values="35;185"
                dur={`${beltDur * 4}s`}
                begin={`${i * beltDur * 1.3}s`}
                repeatCount="indefinite"
              />
            </rect>
          </g>
        ))}

      {/* Sensor / scanner */}
      <rect x="105" y="55" width="10" height="10" fill="#0f172a" stroke={stroke} />
      <line x1="110" y1="65" x2="110" y2="72" stroke="#F87171" strokeWidth="1">
        {active && (
          <animate attributeName="opacity" values="0.2;1;0.2" dur="0.4s" repeatCount="indefinite" />
        )}
      </line>

      <text x="110" y="130" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
        {m.code}
      </text>
    </svg>
  );
}

/* ─────────── HYDRAULIC PRESS ─────────── */
export function HydraulicPressSVG({ m }: { m: MachineState }) {
  const stroke = STATUS_STROKE[m.status];
  const glow = STATUS_GLOW[m.status];
  const cycleDur = m.status === "downtime" ? 0 : Math.max(0.6, 30 / Math.max(30, m.rpm / 4));
  const active = m.status !== "downtime";

  return (
    <svg viewBox="0 0 220 160" width="100%" height="100%">
      <defs>
        <radialGradient id={`prs-glow-${m.id}`} cx="0.5" cy="0.5">
          <stop offset="0" stopColor={glow} />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="220" height="160" fill={`url(#prs-glow-${m.id})`} opacity="0.6" />

      {/* Base plate */}
      <rect x="35" y="120" width="150" height="20" fill="#0b1220" stroke={stroke} strokeWidth="1.2" />

      {/* Vertical columns */}
      <rect x="45" y="30" width="10" height="95" fill="#334155" stroke={stroke} strokeWidth="1" />
      <rect x="165" y="30" width="10" height="95" fill="#334155" stroke={stroke} strokeWidth="1" />

      {/* Top crown */}
      <rect x="35" y="20" width="150" height="18" fill="#1f2937" stroke={stroke} strokeWidth="1.2" />

      {/* Hydraulic cylinder */}
      <rect x="98" y="30" width="24" height="30" fill="#475569" stroke={stroke} strokeWidth="1" />
      <circle cx="110" cy="38" r="3" fill="#f59e0b">
        {active && (
          <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Ram (moving up/down) */}
      <g>
        <rect x="103" y="60" width="14" height="35" fill="#94a3b8" stroke={stroke} strokeWidth="1">
          {active && (
            <animate
              attributeName="height"
              values="35;55;35"
              dur={`${cycleDur}s`}
              repeatCount="indefinite"
            />
          )}
        </rect>
        {/* Ram face */}
        <rect x="88" y="95" width="44" height="8" fill="#cbd5e1" stroke={stroke}>
          {active && (
            <animate
              attributeName="y"
              values="95;115;95"
              dur={`${cycleDur}s`}
              repeatCount="indefinite"
            />
          )}
        </rect>
      </g>

      {/* Workpiece on anvil */}
      <rect x="85" y="115" width="50" height="5" fill="#78716c" />
      <rect x="90" y="112" width="40" height="6" fill="#f59e0b" opacity="0.9">
        {active && (
          <animate
            attributeName="height"
            values="6;3;6"
            dur={`${cycleDur}s`}
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Pressure gauge */}
      <circle cx="35" cy="55" r="9" fill="#0f172a" stroke={stroke} strokeWidth="1" />
      <line x1="35" y1="55" x2="41" y2="49" stroke="#F87171" strokeWidth="1.5">
        {active && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 35 55;60 35 55;0 35 55"
            dur={`${cycleDur}s`}
            repeatCount="indefinite"
          />
        )}
      </line>

      {/* Hydraulic hose */}
      <path d="M 122 45 Q 150 45 155 60 T 170 90" stroke="#f59e0b" strokeWidth="1.4" fill="none" opacity="0.7" />

      <text x="110" y="150" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
        {m.code}
      </text>
    </svg>
  );
}

/* ─────────── WAREHOUSE / AS-RS ─────────── */
export function WarehouseSVG({ m }: { m: MachineState }) {
  const stroke = STATUS_STROKE[m.status];
  const glow = STATUS_GLOW[m.status];
  const active = m.status !== "downtime";
  const fillFraction = Math.min(1, m.queue / 100);

  return (
    <svg viewBox="0 0 220 160" width="100%" height="100%">
      <defs>
        <radialGradient id={`wh-glow-${m.id}`} cx="0.5" cy="0.5">
          <stop offset="0" stopColor={glow} />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="220" height="160" fill={`url(#wh-glow-${m.id})`} opacity="0.6" />

      {/* Floor */}
      <rect x="10" y="130" width="200" height="14" fill="#0b1220" stroke={stroke} strokeWidth="1" />

      {/* Racks - two rows */}
      {[0, 1].map((row) =>
        [0, 1, 2, 3, 4].map((col) => {
          const cellId = row * 5 + col;
          const filled = cellId < Math.floor(fillFraction * 10);
          return (
            <g key={`${row}-${col}`}>
              <rect
                x={20 + col * 36}
                y={30 + row * 45}
                width={32}
                height={40}
                fill="#0f172a"
                stroke={stroke}
                strokeWidth="0.8"
              />
              {filled && (
                <rect
                  x={22 + col * 36}
                  y={32 + row * 45}
                  width={28}
                  height={36}
                  fill="#f59e0b"
                  opacity="0.75"
                />
              )}
              <line
                x1={20 + col * 36}
                y1={50 + row * 45}
                x2={52 + col * 36}
                y2={50 + row * 45}
                stroke={stroke}
                strokeWidth="0.5"
              />
            </g>
          );
        })
      )}

      {/* AGV shuttle moving between racks */}
      {active && (
        <g>
          <rect y="118" width="18" height="10" rx="2" fill="#e2e8f0" stroke={stroke} strokeWidth="1">
            <animate
              attributeName="x"
              values="15;180;15"
              dur="6s"
              repeatCount="indefinite"
            />
          </rect>
          <circle cy="128" r="2" fill="#0f172a">
            <animate
              attributeName="cx"
              values="18;183;18"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cy="128" r="2" fill="#0f172a">
            <animate
              attributeName="cx"
              values="30;195;30"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}

      {/* Status LED strip */}
      <rect x="10" y="20" width="200" height="4" fill="#0b1220" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <circle key={i} cx={20 + i * 26} cy={22} r={1.5} fill={active ? stroke : "#475569"}>
          {active && (
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.2s"
              begin={`${i * 0.15}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}

      <text x="110" y="150" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
        {m.code} · {Math.round(fillFraction * 100)}%
      </text>
    </svg>
  );
}

export function MachineSVG({ m }: { m: MachineState }) {
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
  }
}
