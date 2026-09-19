import { NextRequest, NextResponse } from "next/server";
import { runScenario, ScenarioInput } from "@/lib/scenarios";
import { groqReason, isGroqEnabled } from "@/lib/groq";

/**
 * POST /api/scenarios — { scenario, durationTicks? }
 * Runs the same scenario twice (baseline = no AI, then with AI) and
 * returns before/after metrics + a Groq recommendation if key present.
 */

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { scenario: ScenarioInput["scenario"]; durationTicks?: number };
    if (!body.scenario) {
      return NextResponse.json({ ok: false, error: "scenario required" }, { status: 400 });
    }
    const baseline = runScenario({ scenario: body.scenario, durationTicks: body.durationTicks, aiEnabled: false });
    const withAi   = runScenario({ scenario: body.scenario, durationTicks: body.durationTicks, aiEnabled: true });

    let recommendation: string | null = null;
    if (isGroqEnabled()) {
      recommendation = await groqReason({
        system: "You are the Supervisor Agent of a smart factory. In 2 concise sentences, tell the operator the biggest actionable insight comparing the baseline vs AI-enabled run. No lists, no markdown.",
        user:
`Scenario: ${body.scenario}
BASELINE: OEE=${(baseline.oee * 100).toFixed(1)}%, throughput=${baseline.throughputPerHour}/hr, downtime=${baseline.downtimeMinutes}min, incidents=${baseline.criticalIncidents}
WITH AI: OEE=${(withAi.oee * 100).toFixed(1)}%, throughput=${withAi.throughputPerHour}/hr, downtime=${withAi.downtimeMinutes}min, interventions=${withAi.humanInterventions}
`,
        temperature: 0.2,
        maxTokens: 120,
      });
    }
    if (!recommendation) {
      const oeeDelta = ((withAi.oee - baseline.oee) * 100).toFixed(1);
      recommendation = `AI mitigation lifted OEE by ${oeeDelta} points at the cost of ${withAi.humanInterventions} human intervention${withAi.humanInterventions === 1 ? "" : "s"}. Downtime reduced from ${baseline.downtimeMinutes}min to ${withAi.downtimeMinutes}min.`;
    }

    return NextResponse.json({ ok: true, baseline, withAi, recommendation, groqUsed: isGroqEnabled() && !!recommendation });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
