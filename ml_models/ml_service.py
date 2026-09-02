"""
FactoryMind AI - Machine Learning Inference Service
Integrates:
1. best_pm_model.pkl (LightGBM Binary Classifier - Predictive Maintenance)
2. factory_model.pkl (RandomForest Classifier - Operational Machine Status)
"""

import os
import sys
import warnings
from typing import List, Optional, Dict, Any
from datetime import datetime
import numpy as np
import joblib
from pydantic import BaseModel, Field

# Filter scikit-learn version mismatch warnings
try:
    from sklearn.exceptions import InconsistentVersionWarning
    warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
except ImportError:
    pass

try:
    import uvicorn
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    class HTTPException(Exception):  # type: ignore
        def __init__(self, status_code: int = 500, detail: str = ""):
            self.status_code = status_code
            self.detail = detail

# Define model paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PM_MODEL_PATH = os.path.join(BASE_DIR, "best_pm_model.pkl")
FACTORY_MODEL_PATH = os.path.join(BASE_DIR, "factory_model.pkl")

# Standard scaler constants for AI4I 2020 Predictive Maintenance feature space
# Order: [Type_encoded, Air_temperature_K, Process_temperature_K, Rotational_speed_rpm, Torque_Nm, Tool_wear_min,
#         POWER, DELTA_TEMP, WEAR_TORQUE, SPEED_RATIO, TORQUE_NORM, WEAR_SPEED]
PM_SCALER_MEANS = np.array([
    1.0, 300.0, 310.0, 1538.7, 39.98, 107.95,
    61500.0, 10.0, 4315.0, 4.96, 0.026, 166000.0
], dtype=np.float64)

PM_SCALER_STDS = np.array([
    0.6, 2.0, 1.48, 179.2, 9.97, 63.65,
    17000.0, 1.0, 2700.0, 0.58, 0.007, 100000.0
], dtype=np.float64)

# Load models
pm_model = None
factory_model = None

def load_models():
    global pm_model, factory_model
    try:
        if os.path.exists(PM_MODEL_PATH):
            pm_model = joblib.load(PM_MODEL_PATH)
            print(f"[ML Service] Successfully loaded PM Model from {PM_MODEL_PATH}")
        else:
            print(f"[ML Service] Warning: {PM_MODEL_PATH} not found")

        if os.path.exists(FACTORY_MODEL_PATH):
            factory_model = joblib.load(FACTORY_MODEL_PATH)
            print(f"[ML Service] Successfully loaded Factory Model from {FACTORY_MODEL_PATH}")
        else:
            print(f"[ML Service] Warning: {FACTORY_MODEL_PATH} not found")
    except Exception as e:
        print(f"[ML Service] Error loading models: {e}", file=sys.stderr)

load_models()

# Pydantic Schemas
class PMSensorInput(BaseModel):
    type_encoded: int = Field(default=1, description="Machine type: 0=L (Low), 1=M (Medium), 2=H (High)")
    air_temperature_k: float = Field(default=300.0, description="Air temperature in Kelvin")
    process_temperature_k: float = Field(default=310.0, description="Process temperature in Kelvin")
    rotational_speed_rpm: float = Field(default=1500.0, description="Rotational speed in RPM")
    torque_nm: float = Field(default=40.0, description="Torque in Nm")
    tool_wear_min: float = Field(default=100.0, description="Tool wear time in minutes")

class FactoryStatusInput(BaseModel):
    machine_id: int = Field(default=1, description="Numeric Machine ID")
    temperature_c: float = Field(default=45.0, description="Machine temperature in Celsius")
    vibration_hz: float = Field(default=1.5, description="Vibration frequency in Hz")
    power_consumption_kw: float = Field(default=28.0, description="Power consumption in kW")
    network_latency_ms: float = Field(default=12.0, description="Network latency in ms")
    packet_loss_pct: float = Field(default=0.1, description="Packet loss percentage")
    qc_defect_rate_pct: float = Field(default=0.8, description="QC defect rate %")
    production_speed_uph: float = Field(default=320.0, description="Production speed in units/hr")
    predictive_maintenance_score: Optional[float] = Field(default=None, description="Predictive Maintenance Risk Score (0.0 - 1.0)")
    error_rate_pct: float = Field(default=1.2, description="Machine error rate %")
    hour: Optional[int] = Field(default=None, description="Hour of the day (0-23)")
    day: Optional[int] = Field(default=None, description="Day of month (1-31)")
    month: Optional[int] = Field(default=None, description="Month of year (1-12)")
    weekday: Optional[int] = Field(default=None, description="Weekday (0-6)")
    operation_mode_idle: int = Field(default=0, description="1 if Idle, 0 otherwise")
    operation_mode_maintenance: int = Field(default=0, description="1 if Maintenance, 0 otherwise")

class ChainedInferenceInput(BaseModel):
    # PM Raw Sensors
    type_encoded: int = Field(default=1, description="Machine type: 0=L, 1=M, 2=H")
    air_temperature_k: float = Field(default=300.0, description="Air temperature in Kelvin")
    process_temperature_k: float = Field(default=310.0, description="Process temperature in Kelvin")
    rotational_speed_rpm: float = Field(default=1500.0, description="Rotational speed in RPM")
    torque_nm: float = Field(default=40.0, description="Torque in Nm")
    tool_wear_min: float = Field(default=100.0, description="Tool wear time in minutes")

    # Factory Telemetry
    machine_id: int = Field(default=1, description="Machine ID")
    temperature_c: Optional[float] = Field(default=None, description="Temperature in Celsius (computed from process_temp if omitted)")
    vibration_hz: float = Field(default=1.5, description="Vibration frequency in Hz")
    power_consumption_kw: Optional[float] = Field(default=None, description="Power consumption in kW")
    network_latency_ms: float = Field(default=15.0, description="Network latency in ms")
    packet_loss_pct: float = Field(default=0.1, description="Packet loss %")
    qc_defect_rate_pct: float = Field(default=0.8, description="QC defect rate %")
    production_speed_uph: float = Field(default=300.0, description="Production speed in units/hr")
    error_rate_pct: float = Field(default=1.5, description="Machine error rate %")
    hour: Optional[int] = Field(default=None)
    day: Optional[int] = Field(default=None)
    month: Optional[int] = Field(default=None)
    weekday: Optional[int] = Field(default=None)
    operation_mode_idle: int = Field(default=0)
    operation_mode_maintenance: int = Field(default=0)


def compute_pm_features(
    type_encoded: int,
    air_temp_k: float,
    proc_temp_k: float,
    speed_rpm: float,
    torque_nm: float,
    wear_min: float
) -> Dict[str, Any]:
    """Computes the 6 engineered features and scales all 12 features."""
    power = speed_rpm * torque_nm
    delta_temp = proc_temp_k - air_temp_k
    wear_torque = wear_min * torque_nm
    speed_ratio = speed_rpm / (proc_temp_k + 1e-5)
    torque_norm = torque_nm / (speed_rpm + 1e-5)
    wear_speed = wear_min * speed_rpm

    raw_features = [
        float(type_encoded),
        float(air_temp_k),
        float(proc_temp_k),
        float(speed_rpm),
        float(torque_nm),
        float(wear_min),
        float(power),
        float(delta_temp),
        float(wear_torque),
        float(speed_ratio),
        float(torque_norm),
        float(wear_speed)
    ]

    feature_dict = {
        "Type_encoded": type_encoded,
        "Air_temperature_K": round(air_temp_k, 2),
        "Process_temperature_K": round(proc_temp_k, 2),
        "Rotational_speed_rpm": round(speed_rpm, 2),
        "Torque_Nm": round(torque_nm, 2),
        "Tool_wear_min": round(wear_min, 2),
        "POWER": round(power, 2),
        "DELTA_TEMP": round(delta_temp, 2),
        "WEAR_TORQUE": round(wear_torque, 2),
        "SPEED_RATIO": round(speed_ratio, 4),
        "TORQUE_NORM": round(torque_norm, 6),
        "WEAR_SPEED": round(wear_speed, 2),
    }

    scaled_features = (np.array(raw_features, dtype=np.float64) - PM_SCALER_MEANS) / PM_SCALER_STDS

    return {
        "raw_features": raw_features,
        "scaled_features": scaled_features.reshape(1, -1),
        "feature_dict": feature_dict
    }


def run_pm_inference(features_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Runs inference on LightGBM PM model."""
    if pm_model is None:
        raise ValueError("PM model is not loaded")

    scaled_x = features_dict["scaled_features"]
    probas = pm_model.predict_proba(scaled_x)[0]
    pred_class = int(pm_model.predict(scaled_x)[0])

    prob_no_failure = float(probas[0])
    prob_failure = float(probas[1])

    risk_level = "Low"
    if prob_failure >= 0.7:
        risk_level = "Critical"
    elif prob_failure >= 0.4:
        risk_level = "High"
    elif prob_failure >= 0.2:
        risk_level = "Moderate"

    return {
        "failure_predicted": pred_class,
        "failure_probability": round(prob_failure, 4),
        "health_score": round((1.0 - prob_failure) * 100, 1),
        "risk_level": risk_level,
        "probabilities": {
            "no_failure": round(prob_no_failure, 4),
            "failure": round(prob_failure, 4)
        },
        "engineered_features": features_dict["feature_dict"]
    }


def run_factory_inference(inp: FactoryStatusInput, pm_score: float) -> Dict[str, Any]:
    """Runs inference on Random Forest Factory model."""
    if factory_model is None:
        raise ValueError("Factory model is not loaded")

    now = datetime.now()
    hour = inp.hour if inp.hour is not None else now.hour
    day = inp.day if inp.day is not None else now.day
    month = inp.month if inp.month is not None else now.month
    weekday = inp.weekday if inp.weekday is not None else now.weekday()

    feature_values = [
        inp.machine_id,
        inp.temperature_c,
        inp.vibration_hz,
        inp.power_consumption_kw,
        inp.network_latency_ms,
        inp.packet_loss_pct,
        inp.qc_defect_rate_pct,
        inp.production_speed_uph,
        pm_score,
        inp.error_rate_pct,
        hour,
        day,
        month,
        weekday,
        inp.operation_mode_idle,
        inp.operation_mode_maintenance
    ]

    import pandas as pd
    feat_names = list(getattr(factory_model, 'feature_names_in_', [
        'Machine_ID', 'Temperature_C', 'Vibration_Hz', 'Power_Consumption_kW',
        'Network_Latency_ms', 'Packet_Loss_%', 'Quality_Control_Defect_Rate_%',
        'Production_Speed_units_per_hr', 'Predictive_Maintenance_Score',
        'Error_Rate_%', 'Hour', 'Day', 'Month', 'Weekday',
        'Operation_Mode_Idle', 'Operation_Mode_Maintenance'
    ]))

    df_x = pd.DataFrame([feature_values], columns=feat_names)

    pred_class = int(factory_model.predict(df_x)[0])
    probas = factory_model.predict_proba(df_x)[0]

    # Map class 0, 1, 2 to operational status
    class_map = {
        0: {
            "status": "Critical / Alarm",
            "code": "CRITICAL",
            "color": "#ef4444",
            "description": "High failure risk detected or excessive error rate. Immediate maintenance required."
        },
        1: {
            "status": "Warning / Maintenance Alert",
            "code": "WARNING",
            "color": "#f59e0b",
            "description": "Suboptimal operating state or elevated stress. Schedule inspection soon."
        },
        2: {
            "status": "Optimal / Normal",
            "code": "OPTIMAL",
            "color": "#10b981",
            "description": "Machine is running within healthy operational boundaries."
        }
    }

    selected_status = class_map.get(pred_class, {
        "status": f"Class {pred_class}",
        "code": "UNKNOWN",
        "color": "#6b7280",
        "description": "Operational state indeterminate."
    })

    return {
        "predicted_class": pred_class,
        "operational_status": selected_status["status"],
        "status_code": selected_status["code"],
        "status_color": selected_status["color"],
        "description": selected_status["description"],
        "confidence": round(float(probas[pred_class]) * 100, 1),
        "class_probabilities": {
            "class_0_critical": round(float(probas[0]), 4),
            "class_1_warning": round(float(probas[1]), 4),
            "class_2_optimal": round(float(probas[2]), 4)
        },
        "features_used": dict(zip(feat_names, feature_values))
    }


# Initialize FastAPI if available
if FASTAPI_AVAILABLE:
    app = FastAPI(
        title="FactoryMind AI - Model Inference Server",
        version="1.0.0",
        description="Inference endpoints for LightGBM PM and Random Forest Factory status models"
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    class DummyApp:
        def get(self, *args: Any, **kwargs: Any) -> Any:
            return lambda f: f
        def post(self, *args: Any, **kwargs: Any) -> Any:
            return lambda f: f
    app = DummyApp()  # type: ignore


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "best_pm_model": {
                "loaded": pm_model is not None,
                "type": "LightGBM Binary Classifier (400 trees)",
                "features_count": 12
            },
            "factory_model": {
                "loaded": factory_model is not None,
                "type": "RandomForest Classifier (100 trees)",
                "features_count": 16,
                "classes": [0, 1, 2]
            }
        }
    }


@app.post("/predict/pm")
def predict_pm(inp: PMSensorInput):
    if pm_model is None:
        raise HTTPException(status_code=503, detail="PM Model is not available")
    computed = compute_pm_features(
        inp.type_encoded,
        inp.air_temperature_k,
        inp.process_temperature_k,
        inp.rotational_speed_rpm,
        inp.torque_nm,
        inp.tool_wear_min
    )
    result = run_pm_inference(computed)
    return {"success": True, "result": result}


@app.post("/predict/factory")
def predict_factory(inp: FactoryStatusInput):
    if factory_model is None:
        raise HTTPException(status_code=503, detail="Factory Model is not available")
    score = inp.predictive_maintenance_score if inp.predictive_maintenance_score is not None else 0.05
    result = run_factory_inference(inp, score)
    return {"success": True, "result": result}


@app.post("/predict/chained")
def predict_chained(inp: ChainedInferenceInput):
    if pm_model is None or factory_model is None:
        raise HTTPException(status_code=503, detail="One or more ML models are not available")

    # Step 1: Run PM Feature Engineering & LightGBM Inference
    pm_features = compute_pm_features(
        inp.type_encoded,
        inp.air_temperature_k,
        inp.process_temperature_k,
        inp.rotational_speed_rpm,
        inp.torque_nm,
        inp.tool_wear_min
    )
    pm_result = run_pm_inference(pm_features)
    pm_score = pm_result["failure_probability"]

    # Step 2: Prepare Factory Telemetry with Chained PM Score
    temp_c = inp.temperature_c if inp.temperature_c is not None else round(inp.process_temperature_k - 273.15, 1)
    power_kw = inp.power_consumption_kw if inp.power_consumption_kw is not None else round((inp.rotational_speed_rpm * inp.torque_nm) / 2000.0, 1)

    factory_inp = FactoryStatusInput(
        machine_id=inp.machine_id,
        temperature_c=temp_c,
        vibration_hz=inp.vibration_hz,
        power_consumption_kw=power_kw,
        network_latency_ms=inp.network_latency_ms,
        packet_loss_pct=inp.packet_loss_pct,
        qc_defect_rate_pct=inp.qc_defect_rate_pct,
        production_speed_uph=inp.production_speed_uph,
        predictive_maintenance_score=pm_score,
        error_rate_pct=inp.error_rate_pct,
        hour=inp.hour,
        day=inp.day,
        month=inp.month,
        weekday=inp.weekday,
        operation_mode_idle=inp.operation_mode_idle,
        operation_mode_maintenance=inp.operation_mode_maintenance
    )

    # Step 3: Run Random Forest Operational Status Inference
    factory_result = run_factory_inference(factory_inp, pm_score)

    return {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "pipeline": {
            "predictive_maintenance": pm_result,
            "factory_operational_status": factory_result
        }
    }


def run_tests():
    print("--- Testing PM Model Feature Engineering & Inference ---")
    feat_norm = compute_pm_features(1, 300.0, 310.0, 1500.0, 40.0, 50.0)
    pm_res_norm = run_pm_inference(feat_norm)
    print(f"Normal Case: Failure Prob = {pm_res_norm['failure_probability']:.4f}, Risk = {pm_res_norm['risk_level']}")

    feat_stress = compute_pm_features(0, 304.0, 314.0, 1300.0, 68.0, 230.0)
    pm_res_stress = run_pm_inference(feat_stress)
    print(f"Stress Case: Failure Prob = {pm_res_stress['failure_probability']:.4f}, Risk = {pm_res_stress['risk_level']}")

    print("\n--- Testing Chained Pipeline ---")
    dummy_inp = ChainedInferenceInput(
        type_encoded=0,
        air_temperature_k=304.0,
        process_temperature_k=314.0,
        rotational_speed_rpm=1300.0,
        torque_nm=68.0,
        tool_wear_min=230.0,
        machine_id=7,
        error_rate_pct=6.5,
        production_speed_uph=120.0
    )
    res = predict_chained(dummy_inp)
    print(f"Chained PM Score: {res['pipeline']['predictive_maintenance']['failure_probability']}")
    print(f"Chained Factory Status: {res['pipeline']['factory_operational_status']['operational_status']} (Conf: {res['pipeline']['factory_operational_status']['confidence']}%)")
    print("--- Test Completed Successfully ---")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        run_tests()
    else:
        port = int(os.environ.get("PORT", 8000))
        print(f"[ML Service] Starting FastAPI server on port {port}...")
        uvicorn.run("ml_service:app", host="127.0.0.1", port=port, reload=False)
