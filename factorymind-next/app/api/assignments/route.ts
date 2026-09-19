import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/mongo";

/**
 * Manual override log. Every time a supervisor drag-drops a different
 * worker onto a mission, this records who did it and why.
 *
 * GET  /api/assignments[?missionId=xxx][&workerId=W04][&limit=100]
 * POST /api/assignments — { missionId, workerId, previousWorkerId?, reason?, assignedBy: "AI"|"SUPERVISOR" }
 *   Also flips the mission's assignedWorkerId and reassigns the worker
 *   in one atomic write.
 */

export interface AssignmentChange {
  id: string;
  missionId: string;
  workerId: string;
  previousWorkerId?: string;
  assignedBy: "AI" | "SUPERVISOR";
  supervisorId?: string;
  reason?: string;
  timestamp: string;
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const p = req.nextUrl.searchParams;
    const q: Record<string, unknown> = {};
    if (p.get("missionId")) q.missionId = p.get("missionId");
    if (p.get("workerId")) q.workerId = p.get("workerId");
    const limit = Math.min(500, Number(p.get("limit") || 100));
    const items = await db
      .collection(COLLECTIONS.assignmentChanges)
      .find(q, { projection: { _id: 0 } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    return NextResponse.json({ ok: true, changes: items });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.missionId || !body.workerId) {
      return NextResponse.json({ ok: false, error: "missionId + workerId required" }, { status: 400 });
    }
    const db = await getDb();
    const mission = await db.collection(COLLECTIONS.missions).findOne({ id: body.missionId });
    if (!mission) {
      return NextResponse.json({ ok: false, error: "mission not found" }, { status: 404 });
    }
    const worker = await db.collection(COLLECTIONS.workers).findOne({ id: body.workerId });
    if (!worker) {
      return NextResponse.json({ ok: false, error: "worker not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const change: AssignmentChange = {
      id: `chg-${Date.now()}`,
      missionId: body.missionId,
      workerId: body.workerId,
      previousWorkerId: mission.assignedWorkerId,
      assignedBy: body.assignedBy || "SUPERVISOR",
      supervisorId: body.supervisorId,
      reason: body.reason || "Manual override by supervisor",
      timestamp: now,
    };

    await db.collection(COLLECTIONS.assignmentChanges).insertOne(change);

    // Reassign the mission
    await db.collection(COLLECTIONS.missions).updateOne(
      { id: body.missionId },
      {
        $set: {
          assignedWorkerId: worker.id,
          assignedWorkerName: worker.name,
          updatedAt: now,
        },
        $push: {
          timeline: {
            at: now,
            status: mission.status,
            note: `Reassigned from ${mission.assignedWorkerId || "unassigned"} → ${worker.id} (${change.assignedBy})`,
          },
        },
      } as any
    );

    // If a previous worker was in-flight, free them
    if (mission.assignedWorkerId && mission.assignedWorkerId !== worker.id) {
      await db.collection(COLLECTIONS.workers).updateOne(
        { id: mission.assignedWorkerId },
        { $set: { status: "available", currentMissionId: null, workload: 0.1 } }
      );
    }

    // Mark new worker moving
    await db.collection(COLLECTIONS.workers).updateOne(
      { id: worker.id },
      { $set: { status: "moving", currentMissionId: body.missionId, workload: 0.8 } }
    );

    return NextResponse.json({ ok: true, change });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
