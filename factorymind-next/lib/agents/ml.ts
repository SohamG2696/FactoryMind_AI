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
}

/** Approximate the AI4I input schema from our sim state. Good enough
 *  for LightGBM to produce a plausible failure probability. */
function toPredictInput(m: MachineSnap): PredictInput {
  const air = 273 + 24; // 24°C ambient
  const proc = 273 + m.temperature;
  return {
    air_temperature_k: air,
    process_temperature_k: proc,
    rotational_speed_rpm: Math.max(300, Math.min(2500, m.rpm)),
    torque_nm: 20 + m.utilization * 60, // rough torque proxy
    tool_wear_min: Math.round(m.toolWear * 2.5), // 0..250
  };
}

export async function fetchMlPredictions(
  machines: MachineSnap[]
): Promise<MlPredictionMap> {
  const results: MlPredictionMap = {};

  await Promise.all(
    machines
      .filter((m) => m.status !== "downtime")
      .map(async (m) => {
        const payload = toPredictInput(m);
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
            if (pm) {
              results[m.code] = {
                failureProbability: pm.failure_probability,
                riskLevel: pm.risk_level,
                confidence: pm.confidence,
                recommendation: pm.recommendation,
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
        };
      })
  );

  return results;
}
