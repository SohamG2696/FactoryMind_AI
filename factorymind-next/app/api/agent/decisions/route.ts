import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/mongo";

/**
 * GET  /api/agent/decisions[?limit=50][&agent=MaintenanceAgent]
 * POST /api/agent/decisions       — write one (used internally by the agent tick)
 */

export interface AgentDecisionDoc {
  id: string;
  timestamp: string;
  agentName: string;
  phase: "observe" | "predict" | "reason" | "plan" | "act" | "verify";
  machineCode?: string;
  snapshot?: any;
  mlPrediction?: any;
  reasoning?: string;
  action?: any;
  autonomyLevel?: "SAFE" | "APPROVAL_REQUIRED" | "HUMAN_REQUIRED";
  missionId?: string;
  outcome?: string;
  llmUsed?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const p = req.nextUrl.searchParams;
    const q: Record<string, unknown> = {};
    if (p.get("agent")) q.agentName = p.get("agent");
    if (p.get("mission")) q.missionId = p.get("mission");
    if (p.get("machine")) q.machineCode = p.get("machine");
    const limit = Math.min(500, Number(p.get("limit") || 100));
    const decisions = await db
      .collection(COLLECTIONS.agentDecisions)
      .find(q, { projection: { _id: 0 } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    return NextResponse.json({ ok: true, decisions });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const doc: AgentDecisionDoc = await req.json();
    if (!doc.agentName || !doc.phase) {
      return NextResponse.json({ ok: false, error: "agentName + phase required" }, { status: 400 });
    }
    doc.id = doc.id || `dec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    doc.timestamp = doc.timestamp || new Date().toISOString();
    const db = await getDb();
    await db.collection(COLLECTIONS.agentDecisions).insertOne(doc as any);
    return NextResponse.json({ ok: true, decision: doc });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
