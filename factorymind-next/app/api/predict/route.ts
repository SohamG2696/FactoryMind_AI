import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const FASTAPI_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode || "chained";
    const data = body.data || body;

    // 1. Try FastAPI Server first
    try {
      let endpoint = "/predict/chained";
      if (mode === "pm") endpoint = "/predict/pm";
      if (mode === "factory") endpoint = "/predict/factory";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const fastApiResponse = await fetch(`${FASTAPI_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (fastApiResponse.ok) {
        const json = await fastApiResponse.json();
        return NextResponse.json({ ...json, source: "fastapi" });
      }
    } catch {
      // FastAPI offline or timed out -> Fallback to direct Python runner
    }

    // 2. Direct Python CLI execution fallback
    const cliScript = path.resolve(process.cwd(), "..", "ml_models", "cli_predict.py");
    const payload = JSON.stringify({ mode, data });
    const b64Arg = "b64:" + Buffer.from(payload).toString("base64");

    const { stdout, stderr } = await execFileAsync("python", [cliScript, b64Arg], {
      timeout: 10000,
      cwd: path.resolve(process.cwd(), "..", "ml_models"),
    });

    if (stderr && !stdout) {
      console.error("[Python Runner Error]", stderr);
    }

    const result = JSON.parse(stdout.trim());
    return NextResponse.json({ ...result, source: "python_cli" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal ML execution error";
    console.error("[ML API Route Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
