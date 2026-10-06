/**
 * Bridge to the FastAPI ML service. Falls back to the calibrated
 * analytical model already living in /api/predict when the Python
 * service is offline. Runs once per agent tick, one call per machine
 * that isn't in downtime.
 */

import type { MachineSnap, MlPredictionMap } from "./types";

const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

interface PredictInput {
  air_temperature_k: number;
  process_temperature_k: number;
  rotational_speed_rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  machine_id: number;
  temperature_c: number;
  vibration_hz: number;
  error_rate_pct: number;
  qc_defect_rate_pct: number;
  production_speed_uph: number;
}

/**
 * Map sim telemetry into the feature space the models were trained on.
 * LightGBM was trained on AI4I 2020, where failures come from tool wear x torque
 * (overstrain), so the sim's raw RPM (~500) and a utilisation-only torque would
 * sit far outside the training range and always score ~0%. Instead we hold RPM
 * at the AI4I mean and let vibration + load drive torque, and scale tool wear to
 * AI4I minutes (0-240). The RandomForest's factory telemetry gets error/defect
 * rates derived from cell health.
 */
function toPredictInput(m: MachineSnap, index: number): PredictInput {
  const air = 298;
  return {
    air_temperature_k: air,
    // AI4I process temp sits ~10 K above air; heat above nominal 45 °C widens it.
    process_temperature_k: air + 10 + Math.max(0, m.temperature - 45) * 0.12,
    rotational_speed_rpm: 1538,
    torque_nm: 40 + Math.max(0, m.vibration - 0.3) * 6 + m.utilization * 8,
    tool_wear_min: Math.round(m.toolWear * 2.4),
    machine_id: index + 1,
    temperature_c: m.temperature,
    vibration_hz: m.vibration,
    error_rate_pct: (100 - m.health) / 10,
    qc_defect_rate_pct: (100 - m.health) / 12,
    production_speed_uph: (300 * m.utilization) / 0.7,
  };
}

export async function fetchMlPredictions(
  machines: MachineSnap[]
): Promise<MlPredictionMap> {
  const results: MlPredictionMap = {};

  await Promise.all(
    machines
      .filter((m) => m.status !== "downtime")
      .map(async (m, i) => {
        const payload = toPredictInput(m, i);
        try {
          const ctl = new AbortController();
          const to = setTimeout(() => ctl.abort(), 1500);
          const res = await fetch(`${ML_URL}/predict/chained`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: ctl.signal,
          });
          clearTimeout(to);
          if (res.ok) {
            const j: any = await res.json();
            const pm = j?.pipeline?.predictive_maintenance;
            const fac = j?.pipeline?.factory_operational_status;
            if (pm) {
              results[m.code] = {
                failureProbability: pm.failure_probability,
                riskLevel: pm.risk_level,
                // LightGBM returns no confidence; use the RandomForest's class confidence.
                confidence: fac?.confidence ?? 0,
                recommendation: fac?.description,
                healthScore: pm.health_score,
                operationalStatus: fac?.operational_status,
                source: "ml-service",
              };
              return;
            }
          }
        } catch {
          /* fall through to analytical */
        }
        // Analytical fallback — same heuristic as /api/predict
        let prob = 0.02;
        if (m.toolWear > 80) prob += 0.45;
        if (m.utilization > 0.8) prob += 0.2;
        if (m.temperature > 82) prob += 0.25;
        if (m.vibration > 3.5) prob += 0.15;
        prob = Math.min(0.98, Math.max(0.01, prob));
        const risk = prob > 0.6 ? "CRITICAL" : prob > 0.25 ? "WARNING" : "LOW";
        results[m.code] = {
          failureProbability: Math.round(prob * 10000) / 10000,
          riskLevel: risk,
          confidence: 92,
          recommendation:
            risk === "CRITICAL"
              ? "Immediate maintenance required"
              : risk === "WARNING"
              ? "Schedule maintenance"
              : "Nominal",
          healthScore: Math.round((1 - prob) * 1000) / 10,
          source: "analytical",
        };
      })
  );

  return results;
}
