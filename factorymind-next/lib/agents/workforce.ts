import type { AgentAction, AgentReport } from "./types";
import type { SeedWorker } from "../seedWorkers";
import { MACHINE_REQUIREMENTS } from "../seedWorkers";

/**
 * Workforce Agent — given a set of pending human-required missions,
 * scores every available worker and produces `assign_worker` actions.
 *
 * Scoring weights (all normalized 0..1, higher = better):
 *   0.40  skill/cert match (0/0.5/1)
 *   0.20  zone proximity   (1 same zone, 0.5 adjacent, 0.2 far)
 *   0.20  lower workload   (1 - workload)
 *   0.10  experience       (min(years,15)/15)
 *   0.10  shift match      (1 if shift matches sim window else 0.4)
 */

const ZONE_DIST: Record<string, Record<string, number>> = {
  A: { A: 0, B: 1, W: 1 },
  B: { A: 1, B: 0, W: 1 },
  W: { A: 1, B: 1, W: 0 },
};

export interface PendingMission {
  id?: string;
  machineCode: string;
  requiredSkills: string[];
  requiredCertifications: string[];
  priority: string;
  supervisorId?: string;
  agentReasoning?: string;
}

export interface WorkerCandidate {
  worker: SeedWorker;
  score: number;
  reasons: string[];
}

function scoreWorker(w: SeedWorker, mission: PendingMission, req: any): WorkerCandidate {
  const reasons: string[] = [];
  let score = 0;

  // Skill match
  const wantSkills = mission.requiredSkills.length ? mission.requiredSkills : req?.skills || [];
  const hasAllSkills = wantSkills.every((s: string) => w.skills.includes(s as any));
  const hasSomeSkills = wantSkills.some((s: string) => w.skills.includes(s as any));
  if (hasAllSkills) {
    score += 0.4; reasons.push(`✓ Skills: ${wantSkills.join(", ")}`);
  } else if (hasSomeSkills) {
    score += 0.15; reasons.push(`~ Partial skill overlap`);
  } else {
    reasons.push(`✗ Missing skill`);
  }

  // Certification match
  const wantCerts = mission.requiredCertifications.length ? mission.requiredCertifications : req?.certifications || [];
  const hasAllCerts = wantCerts.every((c: string) => w.certifications.includes(c as any));
  if (hasAllCerts && wantCerts.length > 0) {
    reasons.push(`✓ Certified: ${wantCerts.join(", ")}`);
  } else if (wantCerts.length > 0) {
    score -= 0.2; reasons.push(`✗ Missing cert: ${wantCerts.join(", ")}`);
  }

  // Zone proximity
  const dist = ZONE_DIST[w.zone]?.[req?.zone || w.zone] ?? 1;
  const proxScore = 1 - dist * 0.4;
  score += 0.2 * proxScore;
  if (dist === 0) reasons.push(`✓ Same zone (${w.zone})`);
  else reasons.push(`~ Zone ${w.zone} → ${req?.zone}`);

  // Workload
  score += 0.2 * (1 - w.workload);
  reasons.push(`Workload ${(w.workload * 100).toFixed(0)}%`);

  // Experience
  score += 0.1 * (Math.min(w.experienceYears, 15) / 15);
  reasons.push(`${w.experienceYears}y experience`);

  return { worker: w, score, reasons };
}

export function workforceAgent(
  missions: PendingMission[],
  workers: SeedWorker[]
): AgentReport {
  const thoughts: string[] = [];
  const actions: AgentAction[] = [];

  const available = workers.filter((w) => w.status === "available" && w.shift === "A");
  thoughts.push(`${missions.length} pending human mission(s), ${available.length} workers available.`);

  const used = new Set<string>();
  for (const mission of missions) {
    const req = MACHINE_REQUIREMENTS[mission.machineCode];
    const candidates = available
      .filter((w) => !used.has(w.id))
      .map((w) => scoreWorker(w, mission, req))
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      actions.push({
        tool: "request_human_approval",
        args: {
          missionId: mission.id,
          machineCode: mission.machineCode,
          reason: "No qualified worker available on current shift",
        },
        reason: `No qualified worker for ${mission.machineCode}`,
        autonomyLevel: "APPROVAL_REQUIRED",
        agentName: "WorkforceAgent",
        targetSupervisorId: mission.supervisorId,
      });
      thoughts.push(`No candidate for ${mission.machineCode} — supervisor approval needed.`);
      continue;
    }

    const best = candidates[0];
    used.add(best.worker.id);

    actions.push({
      tool: "assign_worker",
      args: {
        missionId: mission.id,
        machineCode: mission.machineCode,
        workerId: best.worker.id,
        workerName: best.worker.name,
        matchScore: Number(best.score.toFixed(3)),
        reasons: best.reasons,
        candidatesConsidered: candidates.slice(0, 3).map((c) => ({
          id: c.worker.id,
          name: c.worker.name,
          score: Number(c.score.toFixed(3)),
        })),
      },
      reason: `${best.worker.id} ${best.worker.name} (score ${best.score.toFixed(2)}) → ${mission.machineCode}`,
      autonomyLevel: "SAFE",
      agentName: "WorkforceAgent",
      targetSupervisorId: mission.supervisorId,
    });
    thoughts.push(`Selected ${best.worker.id} for ${mission.machineCode} (score ${best.score.toFixed(2)}).`);
  }

  return { agentName: "WorkforceAgent", thoughts, actions };
}
