import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/mongo";
import { runSupervisor } from "@/lib/agents/supervisor";
import { fetchMlPredictions } from "@/lib/agents/ml";
import type {
  PlantSnapshot,
  AgentAction,
  SupervisorContext,
} from "@/lib/agents/types";
import type { SeedWorker } from "@/lib/seedWorkers";

/**
 * POST /api/agent — Coordinator tick.
 * Body: { snapshot: PlantSnapshot }
 *
 * Server-side lifecycle each tick:
 *   OBSERVE   : client-provided snapshot
 *   PREDICT   : /api/predict (LightGBM + RF) per active machine
 *   REASON    : 5 specialized agents in parallel + Workforce agent
 *   PLAN      : Supervisor Agent merges + classifies autonomy
 *   ACT       : create missions, write inbox, mark workers assigned
 *               (mutating sim state is done client-side via returned actions)
 *   VERIFY    : happens next tick — mission auto-close when machine
 *               recovers (client detects and PATCHes /api/missions)
 *
 * Returns the full agent lifecycle so the AI Control Center can render it.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const snapshot: PlantSnapshot = body.snapshot;
    if (!snapshot?.machines) {
      return NextResponse.json({ ok: false, error: "snapshot required" }, { status: 400 });
    }

    const db = await getDb();

    // Load supervisors + workers + open missions in one round trip
    const [supervisorsRaw, workersRaw, openMissionDocs] = await Promise.all([
      db.collection(COLLECTIONS.users)
        .find({ role: "SUPERVISOR" }, { projection: { _id: 0, id: 1, name: 1, assignedMachines: 1 } })
        .toArray(),
      db.collection(COLLECTIONS.workers)
        .find({}, { projection: { _id: 0 } })
        .toArray(),
      db.collection(COLLECTIONS.missions)
        .find({ status: { $nin: ["complete", "cancelled"] } }, { projection: { _id: 0, machineCode: 1, assignedWorkerId: 1 } })
        .toArray(),
    ]);

    const supervisors = supervisorsRaw as unknown as SupervisorContext[];
    const workers = workersRaw as unknown as SeedWorker[];
    const openMissionMachines = new Set(openMissionDocs.map((m: any) => m.machineCode));

    // PREDICT (ML)
    const ml = await fetchMlPredictions(snapshot.machines);

    // REASON + PLAN
    const supOut = await runSupervisor(snapshot, ml, supervisors, workers, openMissionMachines);

    // ACT — persist side effects on our side
    const executedActions: (AgentAction & { missionId?: string })[] = [];
    for (const action of supOut.actions) {
      const persisted = await executeAction(db, action, snapshot);
      executedActions.push(persisted);
    }

    // Log the tick as an aggregate decision (audit trail)
    await db.collection(COLLECTIONS.agentDecisions).insertOne({
      id: `dec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agentName: "SupervisorAgent",
      phase: "plan",
      snapshot: { tick: snapshot.tick, oee: snapshot.oee, wip: snapshot.wip },
      reasoning: supOut.executiveSummary,
      llmUsed: supOut.llmUsed,
      actionCount: supOut.actions.length,
    } as any);

    return NextResponse.json({
      ok: true,
      wallClock: snapshot.wallClock,
      brain: supOut.llmUsed ? "multi-agent + groq" : "multi-agent (deterministic)",
      executiveSummary: supOut.executiveSummary,
      reports: supOut.reports,
      actions: executedActions,
      ml,
    });
  } catch (err: any) {
    console.error("[/api/agent] error:", err);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

/* ─────────── Tool execution — creates missions, writes inbox ─────────── */

async function executeAction(
  db: any,
  action: AgentAction,
  snap: PlantSnapshot
): Promise<AgentAction & { missionId?: string }> {
  const now = new Date().toISOString();
  const out: AgentAction & { missionId?: string } = { ...action };

  // Every create_mission or assign_worker gets a persistent mission
  if (action.tool === "create_mission") {
    const mid = `M${Date.now().toString().slice(-6)}`;
    const missionDoc = {
      id: mid,
      machineCode: action.args.machineCode,
      type: action.createMissionType || "predictive_maintenance",
      priority: action.args.priority || "high",
      status: "diagnose",
      requiredSkills: action.args.requiredSkills || [],
      requiredCertifications: action.args.requiredCertifications || [],
      agentName: action.agentName,
      agentReasoning: action.args.agentReasoning,
      mlPrediction: action.args.mlPrediction,
      autonomyLevel: action.autonomyLevel,
      expectedImpact: action.args.expectedImpact,
      supervisorId: action.targetSupervisorId,
      createdAt: now,
      updatedAt: now,
      timeline: [
        { at: now, status: "detect", note: `${action.agentName} detected condition` },
        { at: now, status: "diagnose", note: action.args.agentReasoning?.slice(0, 140) },
      ],
    };
    await db.collection(COLLECTIONS.missions).insertOne(missionDoc);
    out.missionId = mid;
    out.args = { ...out.args, missionId: mid };
  }

  if (action.tool === "assign_worker" && action.args.workerId) {
    // Advance the matching mission (find by machineCode & open)
    const mission = await db.collection(COLLECTIONS.missions).findOne({
      machineCode: action.args.machineCode,
      status: { $in: ["detect", "diagnose", "plan", "assign"] },
    });
    if (mission) {
      await db.collection(COLLECTIONS.missions).updateOne(
        { id: mission.id },
        {
          $set: {
            status: "assign",
            assignedWorkerId: action.args.workerId,
            assignedWorkerName: action.args.workerName,
            agentReasoning:
              (mission.agentReasoning || "") +
              ` | Assigned by WorkforceAgent · ${action.args.reasons?.slice(0, 3).join(" · ") || ""}`,
            updatedAt: now,
          },
          $push: {
            timeline: {
              at: now,
              status: "assign",
              note: `Worker ${action.args.workerId} (${action.args.workerName}) selected by WorkforceAgent`,
            },
          },
        }
      );
      out.args.missionId = mission.id;
      out.missionId = mission.id;

      // Mark worker moving in Mongo
      await db.collection(COLLECTIONS.workers).updateOne(
        { id: action.args.workerId },
        {
          $set: {
            status: "moving",
            currentMissionId: mission.id,
            currentTarget: action.args.machineCode,
            workload: 0.8,
          },
        }
      );
    }
  }

  // Every action with a targetSupervisorId also becomes an inbox message
  if (action.targetSupervisorId) {
    const severity: "info" | "warn" | "crit" =
      action.autonomyLevel === "HUMAN_REQUIRED"
        ? "crit"
        : action.autonomyLevel === "APPROVAL_REQUIRED"
        ? "warn"
        : action.tool === "raise_operator_alert"
        ? (action.args.severity as any) || "info"
        : "info";
    const title =
      action.args.title ||
      titleFor(action);
    const bodyTxt =
      action.args.body ||
      `${action.agentName}: ${action.reason}. Machine ${action.args.machineCode || "-"} · ${snap.wallClock}.`;
    await db.collection(COLLECTIONS.inbox).insertOne({
      id: `inb-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      supervisorId: action.targetSupervisorId,
      from: "agent",
      fromName: action.agentName,
      type: action.tool === "assign_worker" ? "task" : "alert",
      severity,
      machineCode: action.args.machineCode,
      title,
      body: bodyTxt,
      createdAt: now,
      read: false,
      missionId: out.missionId,
      autonomyLevel: action.autonomyLevel,
    });
  }

  return out;
}

function titleFor(a: AgentAction): string {
  switch (a.tool) {
    case "create_mission":
      return `Maintenance mission created · ${a.args.machineCode}`;
    case "assign_worker":
      return `Worker ${a.args.workerId} assigned to ${a.args.machineCode}`;
    case "throttle_upstream":
      return `Throttle upstream of ${a.args.machineCode}`;
    case "pause_machine":
      return `Pause requested · ${a.args.machineCode}`;
    case "request_human_approval":
      return `Approval needed · ${a.args.machineCode}`;
    case "reroute_material":
      return `Material rerouted ${a.args.fromCode} → ${a.args.toCode}`;
    default:
      return `${a.agentName} action · ${a.args.machineCode || ""}`;
  }
}
