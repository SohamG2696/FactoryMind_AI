import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const FASTAPI_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * GET /api/health — ML service status + model metadata (including the
 * training-time accuracy reported by ml_service.py).
 * Same fallback order as /api/predict: FastAPI → Python CLI → offline.
 */
export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const fastApiResponse = await fetch(`${FASTAPI_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json({ online: true, source: "fastapi", data });
    }
  } catch {
    // FastAPI offline -> try the Python CLI, which loads the same model files
  }

  try {
    const mlDir = path.resolve(process.cwd(), "..", "ml_models");
    const { stdout } = await execFileAsync("python", [path.join(mlDir, "cli_predict.py"), '{"mode":"health"}'], {
      timeout: 10000,
      cwd: mlDir,
    });
    const data = JSON.parse(stdout.trim());
    if (data?.status === "online") {
      return NextResponse.json({ online: true, source: "python_cli", data });
    }
  } catch {
    // Python unavailable
  }

  return NextResponse.json({
    online: false,
    source: "offline",
    message: "ML service and Python CLI are both unavailable; predictions use the analytical fallback.",
  });
}
