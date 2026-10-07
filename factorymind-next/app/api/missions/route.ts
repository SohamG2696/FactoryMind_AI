import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/mongo";

/**
 * Mission = every meaningful AI action becomes a tracked mission.
 * Lifecycle: detect → diagnose → plan → assign → execute → verify → complete
 *
 * GET   /api/missions[?status=execute][&machineCode=CELL-04][&limit=50]
 * GET   /api/missions?id=M284
 * POST  /api/missions           — create
 * PATCH /api/missions           — { id, patch }
 * PATCH /api/missions           — { cancelOpen: true, machineCode? } cancels open missions
 *
 * Completing or cancelling a mission releases its technician back to "available".
 */

export interface Mission {
  id: string;
  machineCode: string;
  type: "predictive_maintenance" | "corrective_maintenance" | "material_dispatch" | "quality_inspection" | "safety_stop";
  priority: "low" | "medium" | "high" | "critical";
  status: "detect" | "diagnose" | "plan" | "assign" | "execute" | "verify" | "complete" | "cancelled";
  requiredSkills: string[];
  requiredCertifications: string[];
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  agentName?: string;
  agentReasoning?: string;
  diagnosis?: string;
  evidence?: string[];
  recommendedPlan?: { step: string; autonomy: string }[];
  mlPrediction?: {
    failureProbability?: number;
    riskLevel?: string;
    confidence?: number;
  };
  autonomyLevel: "SAFE" | "APPROVAL_REQUIRED" | "HUMAN_REQUIRED";
  expectedImpact?: {
    downtimeMinutes?: number;
    productionLossUnits?: number;
  };
  actualImpact?: {
    downtimeMinutes?: number;
    productionLossUnits?: number;
    healthRecoveredPct?: number;
  };
  supervisorId?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  timeline: { at: string; status: string; note?: string }[];
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const p = req.nextUrl.searchParams;
    const id = p.get("id");
    if (id) {
      const m = await db
        .collection(COLLECTIONS.missions)
        .findOne({ id }, { projection: { _id: 0 } });
      return NextResponse.json({ ok: true, mission: m });
    }
    const q: Record<string, unknown> = {};
    if (p.get("status")) q.status = p.get("status");
    if (p.get("machineCode")) q.machineCode = p.get("machineCode");
    if (p.get("open") === "1") q.status = { $nin: ["complete", "cancelled"] };
    const limit = Math.min(200, Number(p.get("limit") || 50));
    const missions = await db
      .collection(COLLECTIONS.missions)
      .find(q, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return NextResponse.json({ ok: true, missions });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.machineCode) {
      return NextResponse.json({ ok: false, error: "machineCode required" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const doc: Mission = {
      id: body.id || `M${Date.now().toString().slice(-6)}`,
      machineCode: body.machineCode,
      type: body.type || "predictive_maintenance",
      priority: body.priority || "medium",
      status: body.status || "detect",
      requiredSkills: body.requiredSkills || [],
      requiredCertifications: body.requiredCertifications || [],
      assignedWorkerId: body.assignedWorkerId,
      assignedWorkerName: body.assignedWorkerName,
      agentName: body.agentName,
      agentReasoning: body.agentReasoning,
      mlPrediction: body.mlPrediction,
      autonomyLevel: body.autonomyLevel || "SAFE",
      expectedImpact: body.expectedImpact,
      supervisorId: body.supervisorId,
      createdAt: now,
      updatedAt: now,
      timeline: [{ at: now, status: body.status || "detect", note: "created" }],
    };
    const db = await getDb();
    await db.collection(COLLECTIONS.missions).insertOne(doc);
    return NextResponse.json({ ok: true, mission: doc });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

const CLOSED = ["complete", "cancelled"];

/** Put a mission's technician back in the available pool. */
async function releaseWorker(db: any, workerId: string | undefined) {
  if (!workerId) return;
  await db.collection(COLLECTIONS.workers).updateOne(
    { id: workerId },
    { $set: { status: "available", workload: 0 }, $unset: { currentMissionId: "", currentTarget: "" } }
  );
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();

    if (body.cancelOpen) {
      const q: Record<string, unknown> = { status: { $nin: CLOSED } };
      if (body.machineCode) q.machineCode = body.machineCode;
      const open = await db.collection(COLLECTIONS.missions).find(q, { projection: { _id: 0 } }).toArray();
      const now = new Date().toISOString();
      for (const m of open as any[]) {
        await db.collection(COLLECTIONS.missions).updateOne(
          { id: m.id },
          {
            $set: { status: "cancelled", updatedAt: now },
            $push: { timeline: { at: now, status: "cancelled", note: body.note || "Cancelled by simulation reset" } },
          } as any
        );
        await releaseWorker(db, m.assignedWorkerId);
      }
      return NextResponse.json({ ok: true, cancelled: open.length });
    }

    const { id, patch, timelineNote } = body;
    if (!id || !patch) {
      return NextResponse.json({ ok: false, error: "id + patch required" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { $set: { ...patch, updatedAt: now } };
    if (patch.status) {
      (update.$push as any) = { timeline: { at: now, status: patch.status, note: timelineNote } };
      if (patch.status === "complete") (update.$set as any).completedAt = now;
      if (patch.status === "execute") (update.$set as any).startedAt = now;
    }
    await db.collection(COLLECTIONS.missions).updateOne({ id }, update as any);
    const updated = await db
      .collection(COLLECTIONS.missions)
      .findOne({ id }, { projection: { _id: 0 } });
    if (updated && CLOSED.includes(patch.status)) await releaseWorker(db, (updated as any).assignedWorkerId);
    return NextResponse.json({ ok: true, mission: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
