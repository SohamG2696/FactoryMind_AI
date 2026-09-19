import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/mongo";

/**
 * /api/chat — FactoryMind Operations Copilot.
 *
 * Body: {
 *   messages: [{role, content}, ...]
 *   snapshot?: PlantSnapshot   // optional: live sim state from the client
 * }
 *
 * When snapshot is present, we also read open missions + workers from
 * Mongo and inject a compact factory-state briefing into the system
 * prompt so the model can answer "why is CNC-07 stopped?" / "who is
 * available?" / "what did the AI do?" with real data — not hallucinate.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, snapshot } = body || {};
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

    if (!apiKey) {
      return NextResponse.json({
        choices: [{
          message: {
            role: "assistant",
            content:
              "⚠️ **Groq API Key is not set in `.env.local`**\n\nAdd `GROQ_API_KEY=gsk_...` to `factorymind-next/.env.local` to enable the live Ops Copilot.\n\nIn the meantime, open `/simulation` — the multi-agent system runs deterministically without an API key.",
          },
        }],
      });
    }

    // Build a factory-state briefing when the caller sent a snapshot.
    let briefing = "";
    if (snapshot?.machines) {
      try {
        const db = await getDb();
        const [openMissions, workers, recentDecisions] = await Promise.all([
          db.collection(COLLECTIONS.missions)
            .find({ status: { $nin: ["complete", "cancelled"] } }, { projection: { _id: 0 } })
            .sort({ createdAt: -1 }).limit(10).toArray(),
          db.collection(COLLECTIONS.workers)
            .find({}, { projection: { _id: 0, id: 1, name: 1, status: 1, skills: 1, workload: 1, currentTarget: 1 } })
            .toArray(),
          db.collection(COLLECTIONS.agentDecisions)
            .find({}, { projection: { _id: 0, timestamp: 1, agentName: 1, reasoning: 1, actionCount: 1 } })
            .sort({ timestamp: -1 }).limit(6).toArray(),
        ]);
        briefing = buildBriefing(snapshot, openMissions, workers, recentDecisions);
      } catch (e) {
        console.warn("[chat] briefing DB fetch failed", e);
      }
    }

    const systemPrompt = `You are the FactoryMind Operations Copilot — a plain-spoken shift-lead who knows the current state of a simulated smart factory.

Rules:
- Use ONLY the facts in "LIVE FACTORY BRIEFING" below. If the answer is not there, say so plainly.
- Never invent machine states, worker names, missions, or numbers.
- Keep answers short (2–4 sentences unless the user asks for detail). Use plain sentences, not bullet fireworks.
- If you cite a number, cite it exactly as briefed.
- If asked "what did the AI do?", walk through the most recent 2–3 agent decisions from the briefing.
- If the user asks about a machine or worker not in the briefing, say it isn't present in the current snapshot.
${briefing ? "\n\nLIVE FACTORY BRIEFING (as of now):\n" + briefing : "\n\n(No live snapshot attached to this request — answer as a general operations advisor.)"}
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...(messages || [])],
        temperature: 0.25,
        max_tokens: 700,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorDetail = "Failed to communicate with Groq API";
      try {
        const errJson = JSON.parse(errText);
        errorDetail = errJson?.error?.message || errJson?.error || errorDetail;
      } catch {}
      return NextResponse.json({ error: errorDetail }, { status: response.status });
    }

    const json = await response.json();
    return NextResponse.json({ ...json, grounded: !!briefing });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function buildBriefing(snapshot: any, missions: any[], workers: any[], decisions: any[]): string {
  const lines: string[] = [];
  lines.push(`Wall clock: ${snapshot.wallClock}  ·  Tick: ${snapshot.tick}  ·  OEE: ${(snapshot.oee * 100).toFixed(1)}%  ·  WIP: ${snapshot.wip}`);
  lines.push(`Bottleneck: ${snapshot.bottleneckId || "none"}  ·  Current part: ${snapshot.currentPartId}`);
  lines.push(`AGVs: ${snapshot.activeAgvs}/${snapshot.totalAgvs} moving.`);
  lines.push("");
  lines.push("MACHINES:");
  for (const m of snapshot.machines || []) {
    lines.push(`  ${m.code} (${m.label}) — status=${m.status}, health=${m.health.toFixed(0)}%, temp=${m.temperature.toFixed(1)}°C, vib=${m.vibration.toFixed(2)}, wear=${m.toolWear.toFixed(0)}%, queue=${m.queue}`);
  }
  lines.push("");
  if (missions.length > 0) {
    lines.push(`OPEN MISSIONS (${missions.length}):`);
    for (const m of missions.slice(0, 6)) {
      lines.push(`  ${m.id} · ${m.machineCode} · ${m.type} · ${m.status} · ${m.autonomyLevel}${m.assignedWorkerName ? ` · assigned to ${m.assignedWorkerName} (${m.assignedWorkerId})` : " · UNASSIGNED"}`);
    }
    lines.push("");
  }
  const available = workers.filter((w) => w.status === "available");
  const busy = workers.filter((w) => w.status !== "available" && w.status !== "off_shift");
  lines.push(`WORKFORCE: ${workers.length} total · ${available.length} available · ${busy.length} on task`);
  if (busy.length > 0) {
    lines.push("Currently working:");
    for (const w of busy) {
      lines.push(`  ${w.id} ${w.name} → ${w.currentTarget || "?"} (${w.status})`);
    }
  }
  if (available.length > 0) {
    lines.push("Available:");
    for (const w of available.slice(0, 8)) {
      lines.push(`  ${w.id} ${w.name} · skills=${w.skills.join("/")} · workload=${(w.workload * 100).toFixed(0)}%`);
    }
  }
  if (decisions.length > 0) {
    lines.push("");
    lines.push(`RECENT AI DECISIONS:`);
    for (const d of decisions) {
      lines.push(`  ${d.timestamp} · ${d.agentName} · ${d.actionCount || 0} action(s) · ${d.reasoning?.slice(0, 140) || ""}`);
    }
  }
  return lines.join("\n");
}
