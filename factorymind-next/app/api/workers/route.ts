import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/mongo";

/**
 * GET  /api/workers                        — all
 * GET  /api/workers?available=1            — status=available
 * GET  /api/workers?skill=mechanical&cert=cnc-lathe&zone=A
 * PATCH /api/workers                       — { id, patch }
 */

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const p = req.nextUrl.searchParams;
    const q: Record<string, unknown> = {};
    if (p.get("available") === "1") q.status = "available";
    if (p.get("skill")) q.skills = p.get("skill");
    if (p.get("cert")) q.certifications = p.get("cert");
    if (p.get("zone")) q.zone = p.get("zone");
    if (p.get("shift")) q.shift = p.get("shift");
    const workers = await db
      .collection(COLLECTIONS.workers)
      .find(q, { projection: { _id: 0 } })
      .toArray();
    return NextResponse.json({ ok: true, workers });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, patch } = await req.json();
    if (!id || !patch) {
      return NextResponse.json({ ok: false, error: "id + patch required" }, { status: 400 });
    }
    const db = await getDb();
    await db.collection(COLLECTIONS.workers).updateOne({ id }, { $set: patch });
    const updated = await db
      .collection(COLLECTIONS.workers)
      .findOne({ id }, { projection: { _id: 0 } });
    return NextResponse.json({ ok: true, worker: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
