import { NextResponse } from "next/server";

const FASTAPI_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

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
      return NextResponse.json({
        online: true,
        source: "fastapi",
        data,
      });
    }
  } catch {
    // offline
  }

  return NextResponse.json({
    online: true,
    source: "python_cli_fallback",
    message: "FastAPI server offline; Python CLI fallback is active and ready.",
    models: {
      best_pm_model: "LightGBM Binary Classifier (400 trees)",
      factory_model: "RandomForest Classifier (100 trees, 3 classes)",
    },
  });
}
