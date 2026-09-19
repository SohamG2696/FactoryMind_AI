import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/mongo";

/**
 * GET  /api/inbox?supervisorId=xxx[&unread=1] — list messages for one supervisor
 * POST /api/inbox — create a new message (typically from the coordinator agent)
 * PATCH /api/inbox — { id, read?: true, resolved?: true }
 * DELETE /api/inbox?id=xxx
 */

export interface InboxMessage {
  id: string;
  supervisorId: string;
  from: "agent" | "operator" | "system";
  fromName?: string;
  type: "alert" | "report" | "task";
  severity: "info" | "warn" | "crit";
  machineCode?: string;
  title: string;
  body: string;
  createdAt: string;      // ISO
  read: boolean;
  resolvedAt?: string;
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const supervisorId = req.nextUrl.searchParams.get("supervisorId");
    const unread = req.nextUrl.searchParams.get("unread") === "1";
    const query: Record<string, unknown> = {};
    if (supervisorId) query.supervisorId = supervisorId;
    if (unread) query.read = false;

    const messages = await db
      .collection(COLLECTIONS.inbox)
      .find(query, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    const unreadCount = await db
      .collection(COLLECTIONS.inbox)
      .countDocuments({ ...(supervisorId ? { supervisorId } : {}), read: false });

    return NextResponse.json({ ok: true, messages, unreadCount });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.supervisorId || !body.title) {
      return NextResponse.json(
        { ok: false, error: "supervisorId + title required" },
        { status: 400 }
      );
    }
    const doc: InboxMessage = {
      id: body.id || `inb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      supervisorId: body.supervisorId,
      from: body.from || "agent",
      fromName: body.fromName || "Coordinator Agent",
      type: body.type || "alert",
      severity: body.severity || "info",
      machineCode: body.machineCode,
      title: body.title,
      body: body.body || "",
      createdAt: new Date().toISOString(),
      read: false,
    };
    const db = await getDb();
    await db.collection(COLLECTIONS.inbox).insertOne(doc);
    return NextResponse.json({ ok: true, message: doc });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, read, resolved } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    const patch: Record<string, unknown> = {};
    if (typeof read === "boolean") patch.read = read;
    if (resolved) patch.resolvedAt = new Date().toISOString();

    const db = await getDb();
    await db.collection(COLLECTIONS.inbox).updateOne({ id }, { $set: patch });
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
    await db.collection(COLLECTIONS.inbox).deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
