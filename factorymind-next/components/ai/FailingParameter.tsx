"use client";

import type { MachineState } from "@/hooks/useFactorySim";
import { failingParameter, formatLimits, formatParam, limitsFor, PARAM_META } from "@/lib/failureModes";

const LEVEL_TEXT = { ok: "WITHIN LIMIT", warn: "WARNING", crit: "CRITICAL" } as const;

/**
 * Which parameter is failing on this machine, its live value against the
 * machine's own warning / critical limits, and what maintenance should do.
 */
export default function FailingParameterCard({ m, showActions = true }: { m: MachineState; showActions?: boolean }) {
  const fp = failingParameter(m.id, m);
  const lim = limitsFor(m.id);
  const below = !!PARAM_META[fp.param].below;
  // Gauge: speed runs 0..110 % (alarm when low); the others run 0..125 % of the critical limit.
  const max = below ? 110 : fp.limit.crit * 1.25;
  const pos = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;

  return (
    <div className={`ai-card ai-param level-${fp.level}`}>
      <div className="ai-card-title">FAILING PARAMETER · {m.code} · {fp.mode.label.toUpperCase()}</div>
      <div className="ai-param-head">
        <span className="ai-param-name">{fp.label}</span>
        <strong className="ai-param-value">{m.isolated ? "machine stopped" : formatParam(fp.value, fp.param)}</strong>
        <span className={`ai-param-level level-${fp.level}`}>{m.isolated ? "ISOLATED" : LEVEL_TEXT[fp.level]}</span>
      </div>
      <div className={`ai-param-gauge ${below ? "below" : ""}`}>
        <span className="ai-param-fill" style={{ width: pos(fp.value) }} />
        <span className="ai-param-mark warn" style={{ left: pos(fp.limit.warn) }} title={`warning ${formatParam(fp.limit.warn, fp.param)}`} />
        <span className="ai-param-mark crit" style={{ left: pos(fp.limit.crit) }} title={`critical ${formatParam(fp.limit.crit, fp.param)}`} />
      </div>
      <div className="ai-muted small">
        {m.code} limits: {formatLimits(fp.param, fp.limit)} · other limits: temp {lim.temperature.warn}/{lim.temperature.crit} °C,
        vib {lim.vibration.warn}/{lim.vibration.crit} mm/s, wear {lim.toolWear.warn}/{lim.toolWear.crit}%
      </div>
      <div className="ai-param-cause"><strong>{fp.mode.component}:</strong> {fp.mode.cause}</div>
      {showActions && (
        <>
          <div className="ai-card-title">RECOMMENDED ACTION</div>
          <ol className="ai-param-actions">
            {fp.mode.recommendedActions.map((a) => <li key={a}>{a}</li>)}
          </ol>
        </>
      )}
    </div>
  );
}
