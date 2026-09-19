/**
 * Canonical seed data. Mirrors the shape of the previously hardcoded
 * INITIAL_USERS list in context/AuthContext.tsx, and adds the machine
 * assignments each supervisor is responsible for.
 */

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "SUPERVISOR" | "USER";
  title: string;
  avatar: string;
  department: string;
  status: "Active" | "Idle" | "Offline";
  lastActive?: string;
  machinesManaged?: number;
  fixedClearance?: boolean;
  /** Machine cell codes (e.g. "CELL-01") the supervisor is accountable for. */
  assignedMachines?: string[];
  /** For operators — the single machine they're physically staffed on. */
  assignedMachine?: string;
  shift?: "A" | "B" | "C";
  supervisorId?: string;
}

export const SEED_USERS: SeedUser[] = [
  /* ─── 4 ADMINISTRATORS ─── */
  {
    id: "usr-admin-01", name: "Soham Gaikwad", email: "soham.gaikwad@factorymind.ai",
    password: "Soham@123", role: "ADMIN", title: "Plant Director & General Manager",
    avatar: "https://ui-avatars.com/api/?name=Soham+Gaikwad&background=1c1917&color=f59e0b&bold=true&rounded=true&size=150",
    department: "Plant Leadership & Executive Command",
    status: "Active", lastActive: "Just now", machinesManaged: 26, fixedClearance: true,
  },
  {
    id: "usr-admin-02", name: "Maitrey Bharambe", email: "maitrey.bharambe@factorymind.ai",
    password: "Maitrey@123", role: "ADMIN", title: "Chief Operations Officer (COO)",
    avatar: "https://ui-avatars.com/api/?name=Maitrey+Bharambe&background=1c1917&color=f59e0b&bold=true&rounded=true&size=150",
    department: "Manufacturing Operations & Strategy",
    status: "Active", lastActive: "4 min ago", machinesManaged: 26, fixedClearance: true,
  },
  {
    id: "usr-admin-03", name: "Om Wagale", email: "om.wagale@factorymind.ai",
    password: "Om@123", role: "ADMIN", title: "Head of Digital Twin & AI Systems",
    avatar: "https://ui-avatars.com/api/?name=Om+Wagale&background=1c1917&color=f59e0b&bold=true&rounded=true&size=150",
    department: "AI Infrastructure & ML Workbench",
    status: "Active", lastActive: "Just now", machinesManaged: 26, fixedClearance: true,
  },
  {
    id: "usr-admin-04", name: "Harsh Savnerkar", email: "harsh.savnerkar@factorymind.ai",
    password: "Harsh@123", role: "ADMIN", title: "Chief Safety & Industrial Compliance Officer",
    avatar: "https://ui-avatars.com/api/?name=Harsh+Savnerkar&background=1c1917&color=f59e0b&bold=true&rounded=true&size=150",
    department: "Industrial Safety & Plant Integrity",
    status: "Active", lastActive: "12 min ago", machinesManaged: 26, fixedClearance: true,
  },

  /* ─── 4 SUPERVISORS with machine assignments ─── */
  {
    id: "usr-super-01", name: "Marcus Vance", email: "shift.vance@factorymind.ai",
    password: "Marcus@123", role: "SUPERVISOR", title: "Senior Shift-A Production Supervisor",
    avatar: "https://ui-avatars.com/api/?name=Marcus+Vance&background=042f2e&color=22d3ee&bold=true&rounded=true&size=150",
    department: "CNC Machining & Line 1 Assembly",
    status: "Active", lastActive: "Just now", machinesManaged: 2, fixedClearance: true,
    assignedMachines: ["CELL-01", "CELL-04"], // CNC-01, CNC-07
    shift: "A",
  },
  {
    id: "usr-super-02", name: "Priya Sharma", email: "qa.priya@factorymind.ai",
    password: "Priya@123", role: "SUPERVISOR", title: "QA & Metrology Lead Supervisor",
    avatar: "https://ui-avatars.com/api/?name=Priya+Sharma&background=042f2e&color=22d3ee&bold=true&rounded=true&size=150",
    department: "Quality Assurance & Defect Inspection",
    status: "Active", lastActive: "5 min ago", machinesManaged: 1, fixedClearance: true,
    assignedMachines: ["CELL-03"], // Outfeed Conveyor (QA scan point)
    shift: "B",
  },
  {
    id: "usr-super-03", name: "David Miller", email: "maint.miller@factorymind.ai",
    password: "David@123", role: "SUPERVISOR", title: "Predictive Maintenance Lead Supervisor",
    avatar: "https://ui-avatars.com/api/?name=David+Miller&background=042f2e&color=22d3ee&bold=true&rounded=true&size=150",
    department: "Hydraulics, Robotics & PM Teams",
    status: "Active", lastActive: "18 min ago", machinesManaged: 2, fixedClearance: true,
    assignedMachines: ["CELL-02", "CELL-05"], // Robot arm, Hydraulic press
    shift: "A",
  },
  {
    id: "usr-super-04", name: "Amara Patel", email: "logistics.amara@factorymind.ai",
    password: "Amara@123", role: "SUPERVISOR", title: "Warehouse Automation & Logistics Supervisor",
    avatar: "https://ui-avatars.com/api/?name=Amara+Patel&background=042f2e&color=22d3ee&bold=true&rounded=true&size=150",
    department: "Automated Warehousing & AGV Fleet",
    status: "Active", lastActive: "22 min ago", machinesManaged: 1, fixedClearance: true,
    assignedMachines: ["CELL-06"], // AS/RS Warehouse
    shift: "C",
  },

  /* ─── Base operator accounts ─── */
  {
    id: "usr-op-01", name: "Karan Johar", email: "karan.operator@factorymind.ai",
    password: "Karan@123", role: "USER", title: "Lead CNC Operator",
    avatar: "https://ui-avatars.com/api/?name=Karan+Johar&background=022c22&color=34d399&bold=true&rounded=true&size=150",
    department: "CNC Precision Line",
    status: "Active", lastActive: "Just now", machinesManaged: 1,
    assignedMachine: "CELL-01", shift: "A", supervisorId: "usr-super-01",
  },
  {
    id: "usr-op-02", name: "Lucas Silva", email: "lucas.operator@factorymind.ai",
    password: "Lucas@123", role: "USER", title: "Robotics & Tooling Technician",
    avatar: "https://ui-avatars.com/api/?name=Lucas+Silva&background=022c22&color=34d399&bold=true&rounded=true&size=150",
    department: "Robotics Workcell Beta",
    status: "Active", lastActive: "35 min ago", machinesManaged: 1,
    assignedMachine: "CELL-02", shift: "A", supervisorId: "usr-super-03",
  },
];

/** Extra seeded operators to make the manpower page look populated. */
export const SEED_OPERATORS_EXTRA: SeedUser[] = [
  {
    id: "usr-op-03", name: "Neha Iyer", email: "neha.iyer@factorymind.ai",
    password: "Neha@123", role: "USER", title: "CNC Lathe Operator",
    avatar: "https://ui-avatars.com/api/?name=Neha+Iyer&background=022c22&color=34d399&bold=true&rounded=true&size=150",
    department: "CNC Precision Line",
    status: "Active", machinesManaged: 1,
    assignedMachine: "CELL-04", shift: "B", supervisorId: "usr-super-01",
  },
  {
    id: "usr-op-04", name: "Ivan Petrov", email: "ivan.petrov@factorymind.ai",
    password: "Ivan@123", role: "USER", title: "Press Machine Operator",
    avatar: "https://ui-avatars.com/api/?name=Ivan+Petrov&background=022c22&color=34d399&bold=true&rounded=true&size=150",
    department: "Hydraulic Line",
    status: "Active", machinesManaged: 1,
    assignedMachine: "CELL-05", shift: "A", supervisorId: "usr-super-03",
  },
  {
    id: "usr-op-05", name: "Rin Takahashi", email: "rin.takahashi@factorymind.ai",
    password: "Rin@123", role: "USER", title: "QA Line Inspector",
    avatar: "https://ui-avatars.com/api/?name=Rin+Takahashi&background=022c22&color=34d399&bold=true&rounded=true&size=150",
    department: "Quality Assurance",
    status: "Active", machinesManaged: 1,
    assignedMachine: "CELL-03", shift: "B", supervisorId: "usr-super-02",
  },
  {
    id: "usr-op-06", name: "Aisha Khan", email: "aisha.khan@factorymind.ai",
    password: "Aisha@123", role: "USER", title: "AS/RS Warehouse Operator",
    avatar: "https://ui-avatars.com/api/?name=Aisha+Khan&background=022c22&color=34d399&bold=true&rounded=true&size=150",
    department: "Automated Warehousing",
    status: "Active", machinesManaged: 1,
    assignedMachine: "CELL-06", shift: "C", supervisorId: "usr-super-04",
  },
  {
    id: "usr-op-07", name: "Diego Ramirez", email: "diego.ramirez@factorymind.ai",
    password: "Diego@123", role: "USER", title: "Night-Shift Machinist",
    avatar: "https://ui-avatars.com/api/?name=Diego+Ramirez&background=022c22&color=34d399&bold=true&rounded=true&size=150",
    department: "CNC Precision Line",
    status: "Active", machinesManaged: 1,
    assignedMachine: "CELL-01", shift: "C", supervisorId: "usr-super-01",
  },
  {
    id: "usr-op-08", name: "Emma Lindqvist", email: "emma.lindqvist@factorymind.ai",
    password: "Emma@123", role: "USER", title: "Robotics Support Technician",
    avatar: "https://ui-avatars.com/api/?name=Emma+Lindqvist&background=022c22&color=34d399&bold=true&rounded=true&size=150",
    department: "Robotics Workcell",
    status: "Active", machinesManaged: 1,
    assignedMachine: "CELL-02", shift: "B", supervisorId: "usr-super-03",
  },
];

/* Machine registry — cross-referenced by supervisors and operators. */
export const MACHINE_REGISTRY = [
  { code: "CELL-01", label: "CNC-01 Milling", kind: "cnc" },
  { code: "CELL-02", label: "6-Axis Robotic Arm", kind: "robot" },
  { code: "CELL-03", label: "Outfeed Conveyor", kind: "conveyor" },
  { code: "CELL-04", label: "CNC-07 Heavy Lathe", kind: "cnc" },
  { code: "CELL-05", label: "Hydraulic Press", kind: "press" },
  { code: "CELL-06", label: "AS/RS Warehouse", kind: "warehouse" },
] as const;

export const ALL_SEED = [...SEED_USERS, ...SEED_OPERATORS_EXTRA];
