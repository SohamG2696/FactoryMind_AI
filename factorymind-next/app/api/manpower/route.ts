import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/mongo";

/**
 * GET /api/manpower — returns supervisors, operators, and machine registry
 * in the shape the /manpower page needs (one round trip).
 *
 * PUT /api/manpower — reassign an operator: body = { operatorId, machineCode, supervisorId }
 */

export async function GET() {
  try {
    const db = await getDb();
    const [supervisors, operators, machines] = await Promise.all([
      db.collection(COLLECTIONS.users)
        .find({ role: "SUPERVISOR" }, { projection: { _id: 0, password: 0 } })
        .toArray(),
      db.collection(COLLECTIONS.users)
        .find({ role: "USER" }, { projection: { _id: 0, password: 0 } })
        .toArray(),
      db.collection("machines").find({}, { projection: { _id: 0 } }).toArray(),
    ]);
    return NextResponse.json({ ok: true, supervisors, operators, machines });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { operatorId, machineCode, supervisorId, shift } = await req.json();
    if (!operatorId) {
      return NextResponse.json({ ok: false, error: "operatorId required" }, { status: 400 });
    }
    const patch: Record<string, unknown> = {};
    if (machineCode) patch.assignedMachine = machineCode;
    if (supervisorId) patch.supervisorId = supervisorId;
    if (shift) patch.shift = shift;

    const db = await getDb();
    await db.collection(COLLECTIONS.users).updateOne({ id: operatorId }, { $set: patch });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
