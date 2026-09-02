"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrochip,
  faPlay,
  faRotateRight,
  faTriangleExclamation,
  faCircleCheck,
  faBolt,
  faTemperatureHalf,
  faGaugeHigh,
  faWrench,
  faSliders,
  faDiagramProject,
  faShieldHalved,
  faClockRotateLeft
} from "@fortawesome/free-solid-svg-icons";

interface EngineeredFeatures {
  Type_encoded: number;
  Air_temperature_K: number;
  Process_temperature_K: number;
  Rotational_speed_rpm: number;
  Torque_Nm: number;
  Tool_wear_min: number;
  POWER: number;
  DELTA_TEMP: number;
  WEAR_TORQUE: number;
  SPEED_RATIO: number;
  TORQUE_NORM: number;
  WEAR_SPEED: number;
}

interface PMResult {
  failure_predicted: number;
  failure_probability: number;
  health_score: number;
  risk_level: string;
  probabilities: {
    no_failure: number;
    failure: number;
  };
  engineered_features: EngineeredFeatures;
}

interface FactoryResult {
  predicted_class: number;
  operational_status: string;
  status_code: string;
  status_color: string;
  description: string;
  confidence: number;
  class_probabilities: {
    class_0_critical: number;
    class_1_warning: number;
    class_2_optimal: number;
  };
  features_used: Record<string, number>;
}

interface InferenceResponse {
  success: boolean;
  source?: string;
  pipeline?: {
    predictive_maintenance: PMResult;
    factory_operational_status: FactoryResult;
  };
  error?: string;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  machineId: number;
  riskLevel: string;
  pmScore: number;
  status: string;
  statusColor: string;
}

export default function MlWorkbench() {
  // Input parameters
  const [typeEncoded, setTypeEncoded] = useState<number>(1); // 0=L, 1=M, 2=H
  const [airTempK, setAirTempK] = useState<number>(300.0);
  const [procTempK, setProcTempK] = useState<number>(310.0);
  const [speedRpm, setSpeedRpm] = useState<number>(1500);
  const [torqueNm, setTorqueNm] = useState<number>(40.0);
  const [toolWearMin, setToolWearMin] = useState<number>(50);

  const [machineId, setMachineId] = useState<number>(7);
  const [vibrationHz, setVibrationHz] = useState<number>(1.5);
  const [qcDefectRate, setQcDefectRate] = useState<number>(0.8);
  const [productionSpeed, setProductionSpeed] = useState<number>(300);
  const [errorRate, setErrorRate] = useState<number>(1.2);
  const [operationMode, setOperationMode] = useState<"normal" | "idle" | "maintenance">("normal");

  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [inferenceData, setInferenceData] = useState<InferenceResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [autoRun, setAutoRun] = useState<boolean>(false);

  // Live calculation of 6 engineered features
  const livePower = (speedRpm * torqueNm).toFixed(1);
  const liveDeltaTemp = (procTempK - airTempK).toFixed(1);
  const liveWearTorque = (toolWearMin * torqueNm).toFixed(1);
  const liveSpeedRatio = (speedRpm / (procTempK || 1)).toFixed(3);
  const liveTorqueNorm = (torqueNm / (speedRpm || 1)).toFixed(5);
  const liveWearSpeed = (toolWearMin * speedRpm).toFixed(0);

  const runPipeline = async () => {
    setLoading(true);
    try {
      const payload = {
        mode: "chained",
        data: {
          type_encoded: typeEncoded,
          air_temperature_k: Number(airTempK),
          process_temperature_k: Number(procTempK),
          rotational_speed_rpm: Number(speedRpm),
          torque_nm: Number(torqueNm),
          tool_wear_min: Number(toolWearMin),
          machine_id: Number(machineId),
          vibration_hz: Number(vibrationHz),
          qc_defect_rate_pct: Number(qcDefectRate),
          production_speed_uph: Number(productionSpeed),
          error_rate_pct: Number(errorRate),
          operation_mode_idle: operationMode === "idle" ? 1 : 0,
          operation_mode_maintenance: operationMode === "maintenance" ? 1 : 0,
        },
      };

      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: InferenceResponse = await res.json();
      setInferenceData(json);

      if (json.pipeline) {
        const pm = json.pipeline.predictive_maintenance;
        const fac = json.pipeline.factory_operational_status;
        const newEntry: HistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          machineId,
          riskLevel: pm.risk_level,
          pmScore: pm.failure_probability,
          status: fac.operational_status,
          statusColor: fac.status_color,
        };
        setHistory((prev) => [newEntry, ...prev.slice(0, 7)]);
      }
    } catch (err) {
      console.error("Inference Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial prediction on load
  useEffect(() => {
    runPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Presets
  const applyPreset = (preset: "optimal" | "wear_warning" | "critical_failure" | "suboptimal_speed") => {
    if (preset === "optimal") {
      setTypeEncoded(1);
      setAirTempK(299.0);
      setProcTempK(309.0);
      setSpeedRpm(1520);
      setTorqueNm(38.0);
      setToolWearMin(35);
      setMachineId(1);
      setVibrationHz(1.2);
      setQcDefectRate(0.4);
      setProductionSpeed(320);
      setErrorRate(0.8);
      setOperationMode("normal");
    } else if (preset === "wear_warning") {
      setTypeEncoded(0);
      setAirTempK(303.0);
      setProcTempK(313.5);
      setSpeedRpm(1380);
      setTorqueNm(56.0);
      setToolWearMin(195);
      setMachineId(3);
      setVibrationHz(3.4);
      setQcDefectRate(3.2);
      setProductionSpeed(210);
      setErrorRate(4.8);
      setOperationMode("normal");
    } else if (preset === "critical_failure") {
      setTypeEncoded(0);
      setAirTempK(304.5);
      setProcTempK(315.0);
      setSpeedRpm(1250);
      setTorqueNm(72.0);
      setToolWearMin(245);
      setMachineId(7);
      setVibrationHz(5.8);
      setQcDefectRate(8.5);
      setProductionSpeed(90);
      setErrorRate(8.2);
      setOperationMode("maintenance");
    } else if (preset === "suboptimal_speed") {
      setTypeEncoded(2);
      setAirTempK(300.0);
      setProcTempK(310.0);
      setSpeedRpm(1450);
      setTorqueNm(42.0);
      setToolWearMin(80);
      setMachineId(5);
      setVibrationHz(1.8);
      setQcDefectRate(1.2);
      setProductionSpeed(45);
      setErrorRate(1.5);
      setOperationMode("normal");
    }
  };

  const pm = inferenceData?.pipeline?.predictive_maintenance;
  const factory = inferenceData?.pipeline?.factory_operational_status;

  return (
    <section className="ml-workbench-section">
      {/* Top Banner */}
      <div className="workbench-hero">
        <div className="hero-badge">
          <FontAwesomeIcon icon={faMicrochip} />
          <span>DUAL MODEL ML ENGINE · LIGHTGBM + RANDOM FOREST</span>
        </div>
        <h2>Predictive AI Inference Workbench</h2>
        <p>
          Simulate real-time sensor streams, compute 6 engineered features, and execute end-to-end chained ML inference across{" "}
          <strong style={{ color: "#A78BFA" }}>best_pm_model.pkl</strong> and{" "}
          <strong style={{ color: "#C4B5FD" }}>factory_model.pkl</strong>.
        </p>

        {/* Quick Presets */}
        <div className="preset-bar">
          <span className="preset-label">Test Scenarios:</span>
          <button className="preset-btn optimal" onClick={() => applyPreset("optimal")}>
            🟢 Optimal Health
          </button>
          <button className="preset-btn warning" onClick={() => applyPreset("wear_warning")}>
            🟡 Wear Warning
          </button>
          <button className="preset-btn critical" onClick={() => applyPreset("critical_failure")}>
            🔴 Critical Breakdown
          </button>
          <button className="preset-btn lowspeed" onClick={() => applyPreset("suboptimal_speed")}>
            🔵 Low Speed Bottleneck
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Controls, Middle Feature Engine, Right Inference Results */}
      <div className="workbench-grid">
        {/* Left Column: Raw Sensor Inputs */}
        <div className="workbench-card sensor-controls">
          <div className="card-header">
            <FontAwesomeIcon icon={faSliders} className="header-icon" />
            <div>
              <h3>Raw Telemetry & Sensor Inputs</h3>
              <p>Physical parameters sent from IoT nodes</p>
            </div>
          </div>

          <div className="controls-form">
            <div className="input-group">
              <label>
                Tool Material Type:
                <span className="val-badge">{typeEncoded === 0 ? "L (Low)" : typeEncoded === 1 ? "M (Medium)" : "H (High)"}</span>
              </label>
              <div className="type-toggle-group">
                {[0, 1, 2].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`type-btn ${typeEncoded === t ? "active" : ""}`}
                    onClick={() => setTypeEncoded(t)}
                  >
                    Type {t === 0 ? "L" : t === 1 ? "M" : "H"}
                  </button>
                ))}
              </div>
            </div>

            <div className="slider-item">
              <div className="slider-header">
                <span>🌡 Air Temp:</span>
                <strong>{airTempK} K ({(airTempK - 273.15).toFixed(1)}°C)</strong>
              </div>
              <input
                type="range"
                min="295"
                max="306"
                step="0.1"
                value={airTempK}
                onChange={(e) => setAirTempK(parseFloat(e.target.value))}
              />
            </div>

            <div className="slider-item">
              <div className="slider-header">
                <span>🔥 Process Temp:</span>
                <strong>{procTempK} K ({(procTempK - 273.15).toFixed(1)}°C)</strong>
              </div>
              <input
                type="range"
                min="305"
                max="316"
                step="0.1"
                value={procTempK}
                onChange={(e) => setProcTempK(parseFloat(e.target.value))}
              />
            </div>

            <div className="slider-item">
              <div className="slider-header">
                <span>⚙ Rotational Speed:</span>
                <strong>{speedRpm} RPM</strong>
              </div>
              <input
                type="range"
                min="1150"
                max="2850"
                step="10"
                value={speedRpm}
                onChange={(e) => setSpeedRpm(parseInt(e.target.value))}
              />
            </div>

            <div className="slider-item">
              <div className="slider-header">
                <span>💪 Torque:</span>
                <strong>{torqueNm} Nm</strong>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="0.5"
                value={torqueNm}
                onChange={(e) => setTorqueNm(parseFloat(e.target.value))}
              />
            </div>

            <div className="slider-item">
              <div className="slider-header">
                <span>⏳ Tool Wear:</span>
                <strong style={{ color: toolWearMin > 180 ? "#ef4444" : "#e2e8f0" }}>{toolWearMin} min</strong>
              </div>
              <input
                type="range"
                min="0"
                max="260"
                step="1"
                value={toolWearMin}
                onChange={(e) => setToolWearMin(parseInt(e.target.value))}
              />
            </div>

            <div className="divider-line" />

            <div className="slider-item">
              <div className="slider-header">
                <span>⚠️ Error Rate:</span>
                <strong>{errorRate}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={errorRate}
                onChange={(e) => setErrorRate(parseFloat(e.target.value))}
              />
            </div>

            <div className="slider-item">
              <div className="slider-header">
                <span>⚡ Production Speed:</span>
                <strong>{productionSpeed} uph</strong>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={productionSpeed}
                onChange={(e) => setProductionSpeed(parseInt(e.target.value))}
              />
            </div>

            <div className="action-button-row">
              <button
                className="btn-run-pipeline"
                onClick={runPipeline}
                disabled={loading}
                id="execute-inference-btn"
              >
                <FontAwesomeIcon icon={loading ? faRotateRight : faPlay} spin={loading} />
                <span>{loading ? "Running ML Pipeline..." : "Execute Chained Inference"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: Live Engineered Features & Pipeline Topology */}
        <div className="workbench-card feature-engine">
          <div className="card-header">
            <FontAwesomeIcon icon={faDiagramProject} className="header-icon cyan" />
            <div>
              <h3>Real-Time Feature Engineering</h3>
              <p>6 Derived Features computed live for PM Model</p>
            </div>
          </div>

          <div className="engineered-grid">
            <div className="eng-feature-box">
              <div className="eng-top">
                <FontAwesomeIcon icon={faBolt} className="eng-icon" />
                <span className="eng-name">POWER</span>
              </div>
              <div className="eng-val">{livePower}</div>
              <div className="eng-sub">Speed × Torque (W proxy)</div>
            </div>

            <div className="eng-feature-box">
              <div className="eng-top">
                <FontAwesomeIcon icon={faTemperatureHalf} className="eng-icon" />
                <span className="eng-name">DELTA_TEMP</span>
              </div>
              <div className="eng-val">{liveDeltaTemp} K</div>
              <div className="eng-sub">Proc Temp - Air Temp</div>
            </div>

            <div className="eng-feature-box">
              <div className="eng-top">
                <FontAwesomeIcon icon={faWrench} className="eng-icon" />
                <span className="eng-name">WEAR_TORQUE</span>
              </div>
              <div className="eng-val">{liveWearTorque}</div>
              <div className="eng-sub">Wear × Torque Stress</div>
            </div>

            <div className="eng-feature-box">
              <div className="eng-top">
                <FontAwesomeIcon icon={faGaugeHigh} className="eng-icon" />
                <span className="eng-name">SPEED_RATIO</span>
              </div>
              <div className="eng-val">{liveSpeedRatio}</div>
              <div className="eng-sub">RPM / Process Temp</div>
            </div>

            <div className="eng-feature-box">
              <div className="eng-top">
                <FontAwesomeIcon icon={faSliders} className="eng-icon" />
                <span className="eng-name">TORQUE_NORM</span>
              </div>
              <div className="eng-val">{liveTorqueNorm}</div>
              <div className="eng-sub">Torque / Speed Ratio</div>
            </div>

            <div className="eng-feature-box">
              <div className="eng-top">
                <FontAwesomeIcon icon={faRotateRight} className="eng-icon" />
                <span className="eng-name">WEAR_SPEED</span>
              </div>
              <div className="eng-val">{liveWearSpeed}</div>
              <div className="eng-sub">Tool Wear × RPM</div>
            </div>
          </div>

          <div className="pipeline-chain-box">
            <div className="chain-title">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>Chaining Pipeline Architecture</span>
            </div>
            <div className="chain-flow">
              <div className="flow-step step-1">
                <span className="step-tag">Step 1</span>
                <strong>Raw Sensor Data (6)</strong>
                <p>Temp, RPM, Torque, Wear</p>
              </div>
              <div className="flow-arrow">➔</div>
              <div className="flow-step step-2">
                <span className="step-tag">Step 2</span>
                <strong>best_pm_model.pkl</strong>
                <p>LightGBM (12 Features)</p>
              </div>
              <div className="flow-arrow">➔</div>
              <div className="flow-step step-3">
                <span className="step-tag">Step 3</span>
                <strong>PM Risk Score</strong>
                <p className="highlight-text">
                  {pm ? `${(pm.failure_probability * 100).toFixed(1)}% Risk` : "Computing..."}
                </p>
              </div>
              <div className="flow-arrow">➔</div>
              <div className="flow-step step-4">
                <span className="step-tag">Step 4</span>
                <strong>factory_model.pkl</strong>
                <p>RandomForest (16 Feats)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chained Model Output & Diagnostics */}
        <div className="workbench-card inference-results">
          <div className="card-header">
            <FontAwesomeIcon icon={faCircleCheck} className="header-icon green" />
            <div>
              <h3>Dual Model Prediction Results</h3>
              <p>Chained classification & decision breakdown</p>
            </div>
          </div>

          {/* Model 1: LightGBM Output */}
          <div className="model-result-card pm-card">
            <div className="model-header">
              <span className="model-tag lgbm">MODEL 1: LightGBM Classifier</span>
              <span className={`risk-badge ${pm?.risk_level.toLowerCase()}`}>
                {pm?.risk_level} Risk
              </span>
            </div>

            <div className="result-metric-row">
              <div className="metric-col">
                <span className="metric-label">Tool Failure Risk</span>
                <h2 className={`metric-val ${pm?.failure_probability && pm.failure_probability > 0.4 ? "alert" : "safe"}`}>
                  {pm ? `${(pm.failure_probability * 100).toFixed(1)}%` : "--"}
                </h2>
              </div>
              <div className="metric-col">
                <span className="metric-label">Health Index</span>
                <h2 className="metric-val safe">
                  {pm ? `${pm.health_score}%` : "--"}
                </h2>
              </div>
              <div className="metric-col">
                <span className="metric-label">Binary Class</span>
                <h2 className="metric-val">
                  {pm ? (pm.failure_predicted === 1 ? "1 (Failure)" : "0 (Normal)") : "--"}
                </h2>
              </div>
            </div>

            {/* Risk Progress Bar */}
            <div className="bar-container">
              <div
                className={`bar-fill ${
                  pm?.failure_probability && pm.failure_probability > 0.5 ? "bar-red" : "bar-blue"
                }`}
                style={{ width: `${Math.max(5, (pm?.failure_probability || 0) * 100)}%` }}
              />
            </div>
          </div>

          {/* Model 2: Factory Model Output */}
          <div className="model-result-card factory-card">
            <div className="model-header">
              <span className="model-tag rf">MODEL 2: RandomForest Status</span>
              <span
                className="status-pill"
                style={{
                  backgroundColor: `${factory?.status_color || "#10b981"}22`,
                  color: factory?.status_color || "#10b981",
                  borderColor: factory?.status_color || "#10b981",
                }}
              >
                {factory?.status_code || "OPTIMAL"}
              </span>
            </div>

            <div className="factory-status-display">
              <div className="status-title-row">
                <h2 style={{ color: factory?.status_color || "#10b981" }}>
                  {factory?.operational_status || "Optimal / Normal"}
                </h2>
                <span className="confidence-tag">Confidence: {factory?.confidence || 95}%</span>
              </div>
              <p className="status-desc">{factory?.description}</p>
            </div>

            {/* Class Probabilities breakdown */}
            <div className="class-probas">
              <div className="proba-item">
                <span>Class 2 (Optimal):</span>
                <div className="mini-bar">
                  <div
                    className="mini-bar-fill green"
                    style={{ width: `${(factory?.class_probabilities?.class_2_optimal || 0) * 100}%` }}
                  />
                </div>
                <strong>{((factory?.class_probabilities?.class_2_optimal || 0) * 100).toFixed(0)}%</strong>
              </div>

              <div className="proba-item">
                <span>Class 1 (Warning):</span>
                <div className="mini-bar">
                  <div
                    className="mini-bar-fill yellow"
                    style={{ width: `${(factory?.class_probabilities?.class_1_warning || 0) * 100}%` }}
                  />
                </div>
                <strong>{((factory?.class_probabilities?.class_1_warning || 0) * 100).toFixed(0)}%</strong>
              </div>

              <div className="proba-item">
                <span>Class 0 (Critical):</span>
                <div className="mini-bar">
                  <div
                    className="mini-bar-fill red"
                    style={{ width: `${(factory?.class_probabilities?.class_0_critical || 0) * 100}%` }}
                  />
                </div>
                <strong>{((factory?.class_probabilities?.class_0_critical || 0) * 100).toFixed(0)}%</strong>
              </div>
            </div>
          </div>

          {/* Recent Inferences Log */}
          <div className="history-tray">
            <div className="tray-header">
              <FontAwesomeIcon icon={faClockRotateLeft} />
              <span>Inference Execution History</span>
            </div>
            <div className="tray-list">
              {history.map((item) => (
                <div key={item.id} className="history-row">
                  <span>{item.timestamp}</span>
                  <span>Machine #{item.machineId}</span>
                  <span className={`risk-tag ${item.riskLevel.toLowerCase()}`}>
                    PM: {(item.pmScore * 100).toFixed(0)}%
                  </span>
                  <span style={{ color: item.statusColor, fontWeight: 600 }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
