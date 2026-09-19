/**
 * Intervention workers — modeled as HUMAN INTERVENTION RESOURCES, not
 * permanent floor staff. They stay off the sim until the Workforce Agent
 * dispatches them. Every one has skills + certifications the agent
 * matches against mission requirements.
 *
 * Machine zones (used by the closeness heuristic):
 *   Zone A = top row  (CNC-01, Robotic Arm)
 *   Zone B = bottom row (CNC-07, Press, Conveyor)
 *   Zone W = warehouse
 */

export type WorkerSkill =
  | "mechanical"
  | "electrical"
  | "robotics"
  | "hydraulic"
  | "quality"
  | "logistics";

export type WorkerCertification =
  | "cnc-milling"
  | "cnc-lathe"
  | "robotics-arm"
  | "hydraulic-press"
  | "conveyor"
  | "as-rs"
  | "safety-lockout";

export type WorkerStatus =
  | "available"
  | "moving"
  | "on_task"
  | "verifying"
  | "off_shift";

export interface SeedWorker {
  id: string;
  name: string;
  skills: WorkerSkill[];
  certifications: WorkerCertification[];
  zone: "A" | "B" | "W";
  shift: "A" | "B" | "C";
  status: WorkerStatus;
  workload: number; // 0..1
  supervisorId?: string;
  avatar: string;
  experienceYears: number;
}

const avatar = (name: string, bg = "1e293b", fg = "f59e0b") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${fg}&bold=true&rounded=true&size=150`;

export const SEED_WORKERS: SeedWorker[] = [
  {
    id: "W01", name: "Aarav Mehta",
    skills: ["mechanical", "hydraulic"],
    certifications: ["hydraulic-press", "safety-lockout"],
    zone: "B", shift: "A", status: "available", workload: 0.2,
    supervisorId: "usr-super-03",
    avatar: avatar("Aarav Mehta"), experienceYears: 8,
  },
  {
    id: "W02", name: "Sofia Rossi",
    skills: ["electrical", "robotics"],
    certifications: ["robotics-arm"],
    zone: "A", shift: "A", status: "available", workload: 0.1,
    supervisorId: "usr-super-03",
    avatar: avatar("Sofia Rossi", "312e81", "a5b4fc"), experienceYears: 5,
  },
  {
    id: "W03", name: "Kenji Nakamura",
    skills: ["mechanical", "robotics"],
    certifications: ["robotics-arm", "cnc-milling"],
    zone: "A", shift: "A", status: "available", workload: 0.3,
    supervisorId: "usr-super-03",
    avatar: avatar("Kenji Nakamura", "1c1917", "fb923c"), experienceYears: 12,
  },
  {
    id: "W04", name: "Rahul Deshpande",
    skills: ["mechanical"],
    certifications: ["cnc-milling", "cnc-lathe", "safety-lockout"],
    zone: "A", shift: "A", status: "available", workload: 0.1,
    supervisorId: "usr-super-01",
    avatar: avatar("Rahul Deshpande", "3f1d2c", "fda4af"), experienceYears: 10,
  },
  {
    id: "W05", name: "Elena Petrova",
    skills: ["electrical"],
    certifications: ["hydraulic-press", "safety-lockout"],
    zone: "B", shift: "A", status: "available", workload: 0.4,
    supervisorId: "usr-super-03",
    avatar: avatar("Elena Petrova", "422006", "fbbf24"), experienceYears: 7,
  },
  {
    id: "W06", name: "Marcus O'Brien",
    skills: ["mechanical", "hydraulic"],
    certifications: ["cnc-lathe", "hydraulic-press"],
    zone: "B", shift: "B", status: "off_shift", workload: 0,
    supervisorId: "usr-super-01",
    avatar: avatar("Marcus OBrien", "052e16", "86efac"), experienceYears: 15,
  },
  {
    id: "W07", name: "Priyanka Rao",
    skills: ["quality"],
    certifications: ["conveyor"],
    zone: "B", shift: "A", status: "available", workload: 0.2,
    supervisorId: "usr-super-02",
    avatar: avatar("Priyanka Rao", "3b0764", "d8b4fe"), experienceYears: 6,
  },
  {
    id: "W08", name: "Liam Andersen",
    skills: ["logistics"],
    certifications: ["as-rs"],
    zone: "W", shift: "A", status: "available", workload: 0.5,
    supervisorId: "usr-super-04",
    avatar: avatar("Liam Andersen", "0f172a", "60a5fa"), experienceYears: 4,
  },
  {
    id: "W09", name: "Fatima Al-Sayed",
    skills: ["electrical", "quality"],
    certifications: ["conveyor", "robotics-arm"],
    zone: "B", shift: "B", status: "off_shift", workload: 0,
    supervisorId: "usr-super-02",
    avatar: avatar("Fatima AlSayed", "1e1b4b", "c7d2fe"), experienceYears: 9,
  },
  {
    id: "W10", name: "Diego Ramirez",
    skills: ["mechanical", "robotics"],
    certifications: ["cnc-milling", "robotics-arm"],
    zone: "A", shift: "B", status: "off_shift", workload: 0,
    supervisorId: "usr-super-03",
    avatar: avatar("Diego Ramirez", "1c1917", "fdba74"), experienceYears: 3,
  },
  {
    id: "W11", name: "Yuki Tanaka",
    skills: ["mechanical", "hydraulic"],
    certifications: ["hydraulic-press", "cnc-lathe", "safety-lockout"],
    zone: "B", shift: "A", status: "available", workload: 0.3,
    supervisorId: "usr-super-01",
    avatar: avatar("Yuki Tanaka", "042f2e", "5eead4"), experienceYears: 11,
  },
  {
    id: "W12", name: "Sarah Chen",
    skills: ["logistics", "electrical"],
    certifications: ["as-rs", "safety-lockout"],
    zone: "W", shift: "A", status: "available", workload: 0.2,
    supervisorId: "usr-super-04",
    avatar: avatar("Sarah Chen", "1e40af", "bfdbfe"), experienceYears: 5,
  },
];

/* Certification requirements per machine — used by the Workforce Agent. */
export const MACHINE_REQUIREMENTS: Record<
  string,
  { skills: WorkerSkill[]; certifications: WorkerCertification[]; zone: "A" | "B" | "W" }
> = {
  "CELL-01": { skills: ["mechanical"], certifications: ["cnc-milling"], zone: "A" },
  "CELL-02": { skills: ["robotics"], certifications: ["robotics-arm"], zone: "A" },
  "CELL-03": { skills: ["quality"], certifications: ["conveyor"], zone: "B" },
  "CELL-04": { skills: ["mechanical"], certifications: ["cnc-lathe"], zone: "B" },
  "CELL-05": { skills: ["hydraulic"], certifications: ["hydraulic-press"], zone: "B" },
  "CELL-06": { skills: ["logistics"], certifications: ["as-rs"], zone: "W" },
};
