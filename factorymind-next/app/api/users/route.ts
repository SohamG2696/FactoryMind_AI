import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/mongo";

/**
 * GET  /api/users              — list all
 * GET  /api/users?role=SUPERVISOR — filter by role
 * POST /api/users              — create (operators only)
 * PUT  /api/users               — bulk update {id, patch}
 * DELETE /api/users?id=xxx     — delete non-fixed
 */

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const role = req.nextUrl.searchParams.get("role");
    const query: Record<string, unknown> = {};
    if (role) query.role = role;
    const users = await db
      .collection(COLLECTIONS.users)
      .find(query, { projection: { _id: 0 } })
      .toArray();
    return NextResponse.json({ ok: true, users });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.email) {
      return NextResponse.json({ ok: false, error: "name + email required" }, { status: 400 });
    }
    const db = await getDb();
    const id = body.id || `usr-${Date.now()}`;
    const doc = {
      id,
      role: "USER",
      status: "Active",
      machinesManaged: 1,
      ...body,
      fixedClearance: false,
    };
    await db.collection(COLLECTIONS.users).insertOne(doc);
    return NextResponse.json({ ok: true, user: { ...doc, _id: undefined } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, patch } = await req.json();
    if (!id || !patch) {
      return NextResponse.json({ ok: false, error: "id + patch required" }, { status: 400 });
    }
    const db = await getDb();
    const target = await db.collection(COLLECTIONS.users).findOne({ id });
    if (target?.fixedClearance && (patch.role || patch.email || patch.password)) {
      return NextResponse.json(
        { ok: false, error: "Fixed leadership slot — role/email/password immutable" },
        { status: 403 }
      );
    }
    await db.collection(COLLECTIONS.users).updateOne({ id }, { $set: patch });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    const db = await getDb();
    const target = await db.collection(COLLECTIONS.users).findOne({ id });
    if (target?.fixedClearance) {
      return NextResponse.json({ ok: false, error: "Fixed slot — cannot delete" }, { status: 403 });
    }
    await db.collection(COLLECTIONS.users).deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
