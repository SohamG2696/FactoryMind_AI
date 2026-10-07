"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth, UserAccount } from "./AuthContext";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskCategory = "Inspection" | "Maintenance" | "Calibration" | "Tooling" | "Safety";

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface OperatorTask {
  id: string;
  operatorId: string;
  operatorName: string;
  machineCode: string; // e.g. "CELL-01", "CELL-04"
  machineId: string;   // e.g. "cnc1", "cnc7"
  machineLabel: string; // e.g. "CNC-01 Milling Station"
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  dueIn: string;
  checklist: TaskChecklistItem[];
  aiReasoning?: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface MachineCellInfo {
  code: string;
  id: string;
  label: string;
  category: string;
  defaultOperatorId: string;
  location: string;
}

export const FACTORY_CELLS: MachineCellInfo[] = [
  { code: "CELL-01", id: "cnc1", label: "CNC-01 Milling Station", category: "cnc", defaultOperatorId: "usr-op-01", location: "Bay A - CNC Precision Line" },
  { code: "CELL-02", id: "robot", label: "6-Axis Robotic Arm", category: "robotics", defaultOperatorId: "usr-op-02", location: "Bay B - Robotics Workcell" },
  { code: "CELL-03", id: "conveyor", label: "High-Speed Infeed Conveyor", category: "logistics", defaultOperatorId: "usr-op-02", location: "Bay B - Infeed Material Line" },
  { code: "CELL-04", id: "cnc7", label: "CNC-07 Heavy Lathe", category: "cnc", defaultOperatorId: "usr-op-01", location: "Bay A - CNC Heavy Lathe" },
  { code: "CELL-05", id: "press", label: "Hydraulic Stamping Press", category: "press", defaultOperatorId: "usr-op-02", location: "Bay C - Stamping & Forming" },
  { code: "CELL-06", id: "warehouse", label: "AS/RS Automated Warehouse", category: "logistics", defaultOperatorId: "usr-op-03", location: "Bay D - Logistics Hub" },
];

export const INITIAL_OPERATOR_TASKS: OperatorTask[] = [
  {
    id: "tsk-cnc-01",
    operatorId: "usr-op-01", // Karan Johar
    operatorName: "Karan Johar",
    machineCode: "CELL-04",
    machineId: "cnc7",
    machineLabel: "CNC-07 Heavy Lathe",
    title: "Critical Spindle Thermal Runaway & Bearing Vibration Check",
    description: "Spindle temperature peaked at 91.5°C with 4.85 mm/s RMS vibration peak. Inspect lubricant feed, thermal sensor contacts, and spindle free-spin play before next heavy titanium cut.",
    priority: "urgent",
    status: "in_progress",
    category: "Safety",
    dueIn: "15 min (Immediate)",
    aiReasoning: "LightGBM Binary Model flagged 88.6% failure risk due to rapid heat dissipation decay.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    checklist: [
      { id: "c1", text: "Disengage spindle emergency interlock & verify free-spin manual rotation", done: true },
      { id: "c2", text: "Inspect ISO-40 tool taper for thermal discoloration or fretting", done: true },
      { id: "c3", text: "Refill synthetic high-viscosity spindle lubricant reservoir to 100%", done: false },
      { id: "c4", text: "Run 30-second low-RPM test sweep and log vibration RMS", done: false },
    ],
  },
  {
    id: "tsk-cnc-02",
    operatorId: "usr-op-01", // Karan Johar
    operatorName: "Karan Johar",
    machineCode: "CELL-01",
    machineId: "cnc1",
    machineLabel: "CNC-01 Milling Station",
    title: "Tool Offset & G-Code Feed Rate Verification",
    description: "Verify carbide 5-flute end mill offset tolerance (target < 15μm) for batch #A48 aero-bracket milling run.",
    priority: "medium",
    status: "pending",
    category: "Tooling",
    dueIn: "45 min",
    aiReasoning: "Aero bracket batch requires tight tolerance ±0.015mm. Pre-shift offset calibration requested.",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    checklist: [
      { id: "c1", text: "Clean optical touch probe stylus and glass optical scale", done: false },
      { id: "c2", text: "Execute automated tool length compensation routine in controller", done: false },
      { id: "c3", text: "Verify dual high-pressure chip evacuation coolant nozzles", done: false },
    ],
  },
  {
    id: "tsk-cnc-03",
    operatorId: "usr-op-01", // Karan Johar
    operatorName: "Karan Johar",
    machineCode: "CELL-01",
    machineId: "cnc1",
    machineLabel: "CNC-01 Milling Station",
    title: "Coolant Concentration Refractometer Sample Check",
    description: "Sample semi-synthetic coolant from return tray to verify 7-9% Brix range and pH levels.",
    priority: "low",
    status: "completed",
    category: "Inspection",
    dueIn: "Completed",
    aiReasoning: "Routine daily shift fluid inspection passed at 8.2% Brix.",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    completedAt: new Date(Date.now() - 1800000).toISOString(),
    checklist: [
      { id: "c1", text: "Sample coolant from CNC-01 main chip basin", done: true },
      { id: "c2", text: "Measure Brix on digital optical refractometer (8.2% recorded)", done: true },
      { id: "c3", text: "Log concentration in digital twin maintenance register", done: true },
    ],
  },
  {
    id: "tsk-rob-01",
    operatorId: "usr-op-02", // Lucas Silva
    operatorName: "Lucas Silva",
    machineCode: "CELL-03",
    machineId: "conveyor",
    machineLabel: "High-Speed Infeed Conveyor",
    title: "Sector-B Belt Tension & Roller Bearing Realignment",
    description: "Optical encoder detected 2.8 m/s speed deviation with motor temperature elevated at 58.6°C. Adjust idler bolt tension and check roller alignment.",
    priority: "high",
    status: "in_progress",
    category: "Maintenance",
    dueIn: "30 min",
    aiReasoning: "Belt slip telemetry flagged 38.4% medium warning. Tension re-calibration will avert jam.",
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    checklist: [
      { id: "c1", text: "Lockout/Tagout (LOTO) infeed power isolation switch", done: true },
      { id: "c2", text: "Measure belt deflection with ultrasonic acoustic meter", done: true },
      { id: "c3", text: "Tighten Sector-B tensioner screw 1.5 turns to specification", done: false },
      { id: "c4", text: "Perform 60-second test run at 3.0 m/s nominal speed", done: false },
    ],
  },
  {
    id: "tsk-rob-02",
    operatorId: "usr-op-02", // Lucas Silva
    operatorName: "Lucas Silva",
    machineCode: "CELL-02",
    machineId: "robot",
    machineLabel: "6-Axis Robotic Arm",
    title: "Joint 4 Harmonic Drive & EOAT Gripper Calibration",
    description: "Calibrate 6-axis robotic arm trajectory repeatability within ±0.02mm before next AGV pallet pickup cycle.",
    priority: "medium",
    status: "pending",
    category: "Calibration",
    dueIn: "1.5 hours",
    aiReasoning: "Kinematics AI scheduled precision zero-point mastering for AGV interchange station.",
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    checklist: [
      { id: "c1", text: "Inspect pneumatic vacuum suction cups on end-effector for micro-cracks", done: false },
      { id: "c2", text: "Run automated Axis 4 and Axis 5 harmonic mastering zero-check", done: false },
      { id: "c3", text: "Clear safety light curtain perimeter and test emergency stop", done: false },
    ],
  },
  {
    id: "tsk-rob-03",
    operatorId: "usr-op-02", // Lucas Silva
    operatorName: "Lucas Silva",
    machineCode: "CELL-05",
    machineId: "press",
    machineLabel: "Hydraulic Stamping Press",
    title: "Hydraulic Seal Valve Pressure & Die Stroke Sweep",
    description: "Verify main cylinder pressure holds stable at 132 bar across 20 test stamping strokes.",
    priority: "low",
    status: "completed",
    category: "Inspection",
    dueIn: "Completed",
    aiReasoning: "Hydraulic fluid viscosity in optimal zone. Valve pressure verified at 132 bar.",
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    completedAt: new Date(Date.now() - 7200000).toISOString(),
    checklist: [
      { id: "c1", text: "Inspect high-pressure hydraulic manifolds for micro-seepage", done: true },
      { id: "c2", text: "Verify nitrogen accumulator pre-charge pressure at 85 bar", done: true },
      { id: "c3", text: "Log cycle stroke depth tolerance into SCADA telemetry register", done: true },
    ],
  },
  {
    id: "tsk-wh-01",
    operatorId: "usr-op-03", // Elena Rostova
    operatorName: "Elena Rostova",
    machineCode: "CELL-06",
    machineId: "warehouse",
    machineLabel: "AS/RS Automated Warehouse",
    title: "AGV Fleet Buffer Synchronization & Battery Swap Sweep",
    description: "Inspect Floor Grid optical tracking tape and verify automated battery swap rotation for AGV-01, AGV-02, and AGV-03.",
    priority: "medium",
    status: "pending",
    category: "Inspection",
    dueIn: "2 hours",
    aiReasoning: "AS/RS high-density buffer throughput normal; battery swap telemetry syncing required.",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    checklist: [
      { id: "c1", text: "Check optical QR code guidance tracks along Warehouse Bay D", done: false },
      { id: "c2", text: "Inspect wireless charging dock contact pads for dust accumulation", done: false },
      { id: "c3", text: "Verify automated shuttle vertical rack alignment sensor", done: false },
    ],
  },
];

const STORAGE_KEY_TASKS = "factorymind_operator_tasks_v2";
const STORAGE_KEY_CELL_MAP = "factorymind_cell_operator_map_v2";

interface OperatorTaskContextType {
  tasks: OperatorTask[];
  cellAssignments: Record<string, string>; // machineCode -> operatorId
  getTasksForOperator: (operatorId: string) => OperatorTask[];
  getTasksForCell: (machineCode: string) => OperatorTask[];
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  completeTask: (taskId: string) => void;
  createTask: (newTask: Omit<OperatorTask, "id" | "createdAt">) => void;
  reassignCellOperator: (machineCode: string, operatorId: string) => void;
  getAssignedOperatorForCell: (machineCode: string) => UserAccount | undefined;
  getOperatorAssignedCells: (operatorId: string) => string[];
  resetTasksToDefault: () => void;
}

const OperatorTaskContext = createContext<OperatorTaskContextType | undefined>(undefined);

export function OperatorTaskProvider({ children }: { children: React.ReactNode }) {
  const { usersList } = useAuth();

  const [tasks, setTasks] = useState<OperatorTask[]>(INITIAL_OPERATOR_TASKS);
  const [cellAssignments, setCellAssignments] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    FACTORY_CELLS.forEach((cell) => {
      initialMap[cell.code] = cell.defaultOperatorId;
    });
    return initialMap;
  });

  // Hydrate from localStorage on client
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
      const savedMap = localStorage.getItem(STORAGE_KEY_CELL_MAP);
      if (savedMap) {
        setCellAssignments(JSON.parse(savedMap));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveTasks = (newTasks: OperatorTask[]) => {
    setTasks(newTasks);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(newTasks));
    }
  };

  const saveCellMap = (newMap: Record<string, string>) => {
    setCellAssignments(newMap);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_CELL_MAP, JSON.stringify(newMap));
    }
  };

  const getTasksForOperator = (operatorId: string) => {
    return tasks.filter((t) => t.operatorId === operatorId);
  };

  const getTasksForCell = (machineCode: string) => {
    return tasks.filter((t) => t.machineCode === machineCode);
  };

  const toggleChecklistItem = (taskId: string, itemId: string) => {
    const updated = tasks.map((task) => {
      if (task.id !== taskId) return task;
      const updatedChecklist = task.checklist.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, done: !item.done };
      });
      const allDone = updatedChecklist.every((item) => item.done);
      return {
        ...task,
        checklist: updatedChecklist,
        status: allDone ? "completed" : task.status === "pending" ? "in_progress" : task.status,
        completedAt: allDone ? new Date().toISOString() : task.completedAt,
      };
    });
    saveTasks(updated);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const updated = tasks.map((task) => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        status,
        completedAt: status === "completed" ? new Date().toISOString() : undefined,
      };
    });
    saveTasks(updated);
  };

  const completeTask = (taskId: string) => {
    const updated = tasks.map((task) => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        status: "completed" as TaskStatus,
        completedAt: new Date().toISOString(),
        checklist: task.checklist.map((item) => ({ ...item, done: true })),
      };
    });
    saveTasks(updated);
  };

  const createTask = (newTaskData: Omit<OperatorTask, "id" | "createdAt">) => {
    const newTask: OperatorTask = {
      ...newTaskData,
      id: `tsk-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    saveTasks([newTask, ...tasks]);
  };

  const reassignCellOperator = (machineCode: string, operatorId: string) => {
    const newMap = { ...cellAssignments, [machineCode]: operatorId };
    saveCellMap(newMap);

    const targetUser = usersList.find((u) => u.id === operatorId);
    if (targetUser) {
      // Also update tasks for this cell if not completed
      const updatedTasks = tasks.map((task) => {
        if (task.machineCode === machineCode && task.status !== "completed") {
          return {
            ...task,
            operatorId,
            operatorName: targetUser.name,
          };
        }
        return task;
      });
      saveTasks(updatedTasks);
    }
  };

  const getAssignedOperatorForCell = (machineCode: string): UserAccount | undefined => {
    const opId = cellAssignments[machineCode];
    if (!opId) return undefined;
    return usersList.find((u) => u.id === opId);
  };

  const getOperatorAssignedCells = (operatorId: string): string[] => {
    return Object.entries(cellAssignments)
      .filter(([_, opId]) => opId === operatorId)
      .map(([code]) => code);
  };

  const resetTasksToDefault = () => {
    saveTasks(INITIAL_OPERATOR_TASKS);
    const initialMap: Record<string, string> = {};
    FACTORY_CELLS.forEach((cell) => {
      initialMap[cell.code] = cell.defaultOperatorId;
    });
    saveCellMap(initialMap);
  };

  return (
    <OperatorTaskContext.Provider
      value={{
        tasks,
        cellAssignments,
        getTasksForOperator,
        getTasksForCell,
        toggleChecklistItem,
        updateTaskStatus,
        completeTask,
        createTask,
        reassignCellOperator,
        getAssignedOperatorForCell,
        getOperatorAssignedCells,
        resetTasksToDefault,
      }}
    >
      {children}
    </OperatorTaskContext.Provider>
  );
}

export function useOperatorTasks() {
  const context = useContext(OperatorTaskContext);
  if (!context) {
    throw new Error("useOperatorTasks must be used within an OperatorTaskProvider");
  }
  return context;
}
