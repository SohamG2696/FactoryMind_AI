import { NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/mongo";
import { ALL_SEED, MACHINE_REGISTRY } from "@/lib/seedData";
import { SEED_WORKERS } from "@/lib/seedWorkers";

/**
 * POST /api/seed — idempotent. Wipes and reinserts the canonical
 * plant personnel + machine registry into Mongo. Safe to run repeatedly.
 * Call this once after setting MONGODB_URI to migrate off the hardcoded list.
 */
export async function POST() {
  try {
    const db = await getDb();

    // Users
    const users = db.collection(COLLECTIONS.users);
    await users.deleteMany({});
    await users.insertMany(ALL_SEED.map((u) => ({ ...u })));
    await users.createIndex({ id: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ role: 1 });

    // Machine registry as a small reference collection
    const machines = db.collection("machines");
    await machines.deleteMany({});
    await machines.insertMany(MACHINE_REGISTRY.map((m) => ({ ...m })));

    // Inbox / agent reports — empty but indexed
    const inbox = db.collection(COLLECTIONS.inbox);
    await inbox.createIndex({ supervisorId: 1, createdAt: -1 });
    await inbox.createIndex({ read: 1 });

    const reports = db.collection(COLLECTIONS.agentReports);
    await reports.createIndex({ generatedAt: -1 });

    /* v2.0 — workers, missions, decisions, assignment changes */
    const workers = db.collection(COLLECTIONS.workers);
    await workers.deleteMany({});
    await workers.insertMany(SEED_WORKERS.map((w) => ({ ...w })));
    await workers.createIndex({ id: 1 }, { unique: true });
    await workers.createIndex({ status: 1 });
    await workers.createIndex({ skills: 1 });

    const missions = db.collection(COLLECTIONS.missions);
    await missions.createIndex({ status: 1, createdAt: -1 });
    await missions.createIndex({ machineCode: 1 });
    await missions.createIndex({ assignedWorkerId: 1 });

    const decisions = db.collection(COLLECTIONS.agentDecisions);
    await decisions.createIndex({ timestamp: -1 });
    await decisions.createIndex({ agentName: 1 });

    const changes = db.collection(COLLECTIONS.assignmentChanges);
    await changes.createIndex({ timestamp: -1 });

    return NextResponse.json({
      ok: true,
      seeded: {
        users: ALL_SEED.length,
        machines: MACHINE_REGISTRY.length,
        workers: SEED_WORKERS.length,
      },
    });
  } catch (err: any) {
    console.error("[/api/seed] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

/** GET returns whether the DB has been seeded (used by the UI for first-run hint). */
export async function GET() {
  try {
    const db = await getDb();
    const count = await db.collection(COLLECTIONS.users).countDocuments();
    return NextResponse.json({ ok: true, users: count, seeded: count > 0 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
