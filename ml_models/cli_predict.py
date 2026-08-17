"""
CLI Runner for Python ML Inference - Fallback runner for Next.js API
Accepts JSON payload or base64 encoded JSON via stdin or argv.
"""

import sys
import json
import os
import base64
import warnings

try:
    from sklearn.exceptions import InconsistentVersionWarning
    warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
except ImportError:
    pass

# Suppress stdout model load logs in CLI mode so stdout is clean JSON
sys_stdout = sys.stdout
sys.stdout = sys.stderr

from ml_service import (
    compute_pm_features,
    run_pm_inference,
    run_factory_inference,
    FactoryStatusInput,
    ChainedInferenceInput,
    predict_chained,
    predict_pm,
    predict_factory,
    PMSensorInput
)

# Restore stdout
sys.stdout = sys_stdout

def main():
    try:
        raw_text = ""
        if len(sys.argv) > 1:
            arg = sys.argv[1]
            if arg.startswith("b64:"):
                raw_text = base64.b64decode(arg[4:]).decode("utf-8")
            else:
                raw_text = arg
        else:
            raw_text = sys.stdin.read()

        if not raw_text.strip():
            print(json.dumps({"error": "Empty input", "success": False}))
            sys.exit(1)

        payload = json.loads(raw_text)
        mode = payload.get("mode", "chained")
        data = payload.get("data", {})

        if mode == "pm":
            inp = PMSensorInput(**data)
            res = predict_pm(inp)
        elif mode == "factory":
            inp = FactoryStatusInput(**data)
            res = predict_factory(inp)
        else: # chained
            inp = ChainedInferenceInput(**data)
            res = predict_chained(inp)

        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"error": str(e), "success": False}))
        sys.exit(1)

if __name__ == "__main__":
    main()
