"use client";

import { useState, useEffect, useMemo } from "react";
import { useSensorData } from "@/hooks/useSensorData";
import { useAuth } from "@/context/AuthContext";
import { useOperatorTasks, FACTORY_CELLS, TaskPriority, TaskCategory } from "@/context/OperatorTaskContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGears,
  faRobot,
  faArrowRightLong,
  faCompress,
  faWarehouse,
  faXmark,
  faWaveSquare,
  faShieldHalved,
  faBolt,
  faTemperatureHalf,
  faGaugeHigh,
  faTriangleExclamation,
  faWrench,
  faCircleCheck,
  faUserGear,
  faUserTie,
  faUserShield,
  faListCheck,
  faPlus,
  faFilter,
  faClock,
  faCheck,
  faArrowsRotate,
  faPlay,
  faArrowRight,
  faClipboardList,
  faRadio,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

export interface MachineData {
  id: string;
  code: string;
  label: string;
  category: string;
  status: "green" | "yellow" | "red" | "blue";
  cls: string;
  icon: typeof faGears;
  info: [string, string][];
  telemetry: {
    temp: string;
    rpm: string;
    vibration: string;
    load: string;
    healthScore: number;
    riskLevel: string;
    predictiveModel: string;
    aiRecommendation: string;
    lastMaintenance: string;
  };
}

export const MACHINES_DATA: MachineData[] = [
  {
    id: "cnc1",
    code: "CELL-01",
    label: "CNC-01 Milling Station",
    category: "cnc",
    status: "green",
    cls: "healthy",
    icon: faGears,
    info: [["Temp", "64.2°C"], ["RPM", "1450"], ["Health", "97%"]],
    telemetry: {
      temp: "64.2 °C (Normal)",
      rpm: "1,450 RPM",
      vibration: "0.82 mm/s (Low)",
      load: "68%",
      healthScore: 97,
      riskLevel: "Low Risk (3.2%)",
      predictiveModel: "LightGBM Binary + RandomForest",
      aiRecommendation: "Operating within optimal parameters. Next routine calibration in 48h.",
      lastMaintenance: "3 days ago",
    },
  },
  {
    id: "robot",
    code: "CELL-02",
    label: "6-Axis Robotic Arm",
    category: "robotics",
    status: "green",
    cls: "healthy",
    icon: faRobot,
    info: [["Load", "72%"], ["Speed", "89%"], ["Health", "96%"]],
    telemetry: {
      temp: "42.0 °C (Nominal)",
      rpm: "N/A (Servo 3.2 rad/s)",
      vibration: "0.45 mm/s (Stable)",
      load: "72%",
      healthScore: 96,
      riskLevel: "Low Risk (4.1%)",
      predictiveModel: "Trajectory Kinematics AI",
      aiRecommendation: "Joint calibration verified. Precision tolerance at ±0.02mm.",
      lastMaintenance: "Yesterday",
    },
  },
  {
    id: "conveyor",
    code: "CELL-03",
    label: "High-Speed Infeed Conveyor",
    category: "logistics",
    status: "yellow",
    cls: "warning",
    icon: faArrowRightLong,
    info: [["Speed", "2.8 m/s"], ["Load", "84%"], ["Health", "81%"]],
    telemetry: {
      temp: "58.6 °C (Elevated)",
      rpm: "820 RPM Roller",
      vibration: "2.14 mm/s (Moderate)",
      load: "84%",
      healthScore: 81,
      riskLevel: "Medium Warning (38.4%)",
      predictiveModel: "Belt Friction & Tension ML",
      aiRecommendation: "Belt tension deviation detected on Sector-B. Operator action: re-align tensioner.",
      lastMaintenance: "12 days ago",
    },
  },
  {
    id: "cnc7",
    code: "CELL-04",
    label: "CNC-07 Heavy Lathe",
    category: "cnc",
    status: "red",
    cls: "critical",
    icon: faGears,
    info: [["Temp", "91.5°C"], ["Vibration", "High"], ["Health", "58%"]],
    telemetry: {
      temp: "91.5 °C (Critical Heat)",
      rpm: "1,320 RPM (Degraded)",
      vibration: "4.85 mm/s (High Peak)",
      load: "92%",
      healthScore: 58,
      riskLevel: "Critical Risk (88.6%)",
      predictiveModel: "LightGBM Binary Classifier (AI4I)",
      aiRecommendation: "Immediate Bearing Replacement & Thermal Sensor Check Required! Operator LOTO instructed.",
      lastMaintenance: "28 days ago",
    },
  },
  {
    id: "press",
    code: "CELL-05",
    label: "Hydraulic Stamping Press",
    category: "press",
    status: "green",
    cls: "healthy",
    icon: faCompress,
    info: [["Pressure", "132 bar"], ["Cycles", "482"], ["Health", "94%"]],
    telemetry: {
      temp: "51.3 °C (Nominal)",
      rpm: "Pump 1,750 RPM",
      vibration: "1.10 mm/s (Normal)",
      load: "76%",
      healthScore: 94,
      riskLevel: "Low Risk (5.8%)",
      predictiveModel: "Hydraulic Seal Degradation ML",
      aiRecommendation: "Hydraulic fluid viscosity in optimal zone. Valve pressure stable.",
      lastMaintenance: "5 days ago",
    },
  },
  {
    id: "warehouse",
    code: "CELL-06",
    label: "AS/RS Automated Warehouse",
    category: "logistics",
    status: "blue",
    cls: "maintenance",
    icon: faWarehouse,
    info: [["Stock", "82%"], ["Robots", "5 Active"], ["Status", "Active"]],
    telemetry: {
      temp: "22.4 °C (Climate Controlled)",
      rpm: "Shuttle 2.4 m/s",
      vibration: "0.30 mm/s",
      load: "82% Capacity",
      healthScore: 91,
      riskLevel: "Nominal / Scheduled Sweep",
      predictiveModel: "Automated Inventory Routing AI",
      aiRecommendation: "AGV fleet battery recharge rotation active. Buffer throughput normal.",
      lastMaintenance: "Weekly cycle active",
    },
  },
];

export default function DigitalTwin() {
  const sensor = useSensorData();
  const { user, role, usersList } = useAuth();
  const {
    tasks,
    cellAssignments,
    getTasksForCell,
    toggleChecklistItem,
    updateTaskStatus,
    completeTask,
    createTask,
    reassignCellOperator,
    getAssignedOperatorForCell,
    getOperatorAssignedCells,
  } = useOperatorTasks();

  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachineData | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Operator workflow states
  const isOperator = role === "USER";
  const [operatorScope, setOperatorScope] = useState<"my_cells" | "all_cells">(isOperator ? "my_cells" : "all_cells");
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>("ALL");
  const [taskFilterTab, setTaskFilterTab] = useState<"all" | "active" | "urgent" | "completed">("active");
  const [activeTaskViewOpen, setActiveTaskViewOpen] = useState(true);

  // Modals for supervisor actions
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New task form state
  const [newCellCode, setNewCellCode] = useState("CELL-01");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newCategory, setNewCategory] = useState<TaskCategory>("Inspection");
  const [newDueIn, setNewDueIn] = useState("1 hour");
  const [newChecklistText, setNewChecklistText] = useState("Verify sensor calibration\nCheck mechanical alignment\nLog results in register");

  // Reassign modal state
  const [reassignCell, setReassignCell] = useState("CELL-01");
  const [reassignOpId, setReassignOpId] = useState("");

  // Sync default operator scope on role change
  useEffect(() => {
    if (isOperator) {
      setOperatorScope("my_cells");
    } else {
      setOperatorScope("all_cells");
    }
  }, [isOperator, user?.id]);

  // Periodic random highlight pulse
  useEffect(() => {
    const id = setInterval(() => {
      setHighlighted(Math.floor(Math.random() * MACHINES_DATA.length));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const operatorAssignedCells = useMemo(() => {
    if (!user) return [];
    return getOperatorAssignedCells(user.id);
  }, [user, cellAssignments, getOperatorAssignedCells]);

  // Machines filtered by role, operator assignment, and category
  const filteredMachines = useMemo(() => {
    return MACHINES_DATA.filter((m) => {
      // 1. Category filter
      if (filterCategory !== "all" && m.category !== filterCategory) {
        return false;
      }

      // 2. Operator scope filter
      if (isOperator && operatorScope === "my_cells") {
        return operatorAssignedCells.includes(m.code);
      }

      // 3. Supervisor operator filter
      if (!isOperator && selectedOperatorFilter !== "ALL") {
        const assignedOp = cellAssignments[m.code];
        return assignedOp === selectedOperatorFilter;
      }

      return true;
    });
  }, [filterCategory, isOperator, operatorScope, operatorAssignedCells, selectedOperatorFilter, cellAssignments]);

  // Current active tasks based on view scope
  const relevantTasks = useMemo(() => {
    let list = tasks;
    if (isOperator && operatorScope === "my_cells" && user) {
      list = tasks.filter((t) => t.operatorId === user.id || operatorAssignedCells.includes(t.machineCode));
    } else if (!isOperator && selectedOperatorFilter !== "ALL") {
      list = tasks.filter((t) => t.operatorId === selectedOperatorFilter);
    }

    if (taskFilterTab === "active") {
      return list.filter((t) => t.status !== "completed");
    } else if (taskFilterTab === "urgent") {
      return list.filter((t) => t.priority === "urgent" || t.priority === "high");
    } else if (taskFilterTab === "completed") {
      return list.filter((t) => t.status === "completed");
    }
    return list;
  }, [tasks, isOperator, operatorScope, user, operatorAssignedCells, selectedOperatorFilter, taskFilterTab]);

  const operatorStats = useMemo(() => {
    const opTasks = isOperator && user ? tasks.filter((t) => t.operatorId === user.id) : tasks;
    const total = opTasks.length;
    const pending = opTasks.filter((t) => t.status === "pending").length;
    const inProgress = opTasks.filter((t) => t.status === "in_progress").length;
    const completed = opTasks.filter((t) => t.status === "completed").length;
    const urgent = opTasks.filter((t) => (t.priority === "urgent" || t.priority === "high") && t.status !== "completed").length;
    const cellsCount = isOperator ? operatorAssignedCells.length : FACTORY_CELLS.length;

    return { total, pending, inProgress, completed, urgent, cellsCount };
  }, [tasks, isOperator, user, operatorAssignedCells]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetCell = FACTORY_CELLS.find((c) => c.code === newCellCode);
    const assignedOpId = cellAssignments[newCellCode];
    const assignedOp = usersList.find((u) => u.id === assignedOpId);

    const checklistItems = newChecklistText
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((text, idx) => ({
        id: `c_${idx + 1}`,
        text: text.trim(),
        done: false,
      }));

    createTask({
      operatorId: assignedOpId || "usr-op-01",
      operatorName: assignedOp?.name || "Karan Johar",
      machineCode: newCellCode,
      machineId: targetCell?.id || "cnc1",
      machineLabel: targetCell?.label || "Machine Cell",
      title: newTitle,
      description: newDesc || `Standard operational task for ${targetCell?.label}`,
      priority: newPriority,
      status: "pending",
      category: newCategory,
      dueIn: newDueIn,
      checklist: checklistItems.length > 0 ? checklistItems : [{ id: "c1", text: "Execute inspection procedure", done: false }],
      aiReasoning: "Supervisor dispatched task via Digital Twin control center.",
    });

    setNewTitle("");
    setNewDesc("");
    setIsDispatchModalOpen(false);
    showNotice(`Dispatched task "${newTitle}" for ${newCellCode} to ${assignedOp?.name || "Operator"}`);
  };

  return (
    <div className="digital-twin-page-container">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="dt-action-toast">
          <FontAwesomeIcon icon={faCircleCheck} className="dt-toast-icon" />
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="dt-toast-close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      {/* ─── 1. TOP FULL-WIDTH: OPERATOR COMMAND BAR / SUPERVISOR CONTROL ─────── */}
      <div className="dt-operator-command-bar">
        <div className="dt-ocb-profile-zone">
          <div className="dt-ocb-avatar-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user?.avatar || "https://ui-avatars.com/api/?name=Operator&background=022c22&color=34d399"}
              alt={user?.name || "Operator"}
              className="dt-ocb-avatar"
            />
            <span className={`dt-ocb-status-indicator ${user?.status === "Active" ? "active" : "idle"}`} />
          </div>

          <div className="dt-ocb-user-meta">
            <div className="dt-ocb-name-row">
              <h3>{user?.name || "Karan Johar"}</h3>
              <span className={`dt-role-badge ${role.toLowerCase()}`}>
                <FontAwesomeIcon icon={role === "ADMIN" ? faUserShield : role === "SUPERVISOR" ? faUserTie : faUserGear} />
                {role === "USER" ? "MACHINE OPERATOR" : role}
              </span>
            </div>
            <p className="dt-ocb-subtitle">
              {user?.title || "Lead CNC Operator"} · <span className="dt-ocb-dept">{user?.department || "CNC Precision Line"}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Shift KPIs */}
        <div className="dt-ocb-metrics">
          <div className="dt-ocb-metric-item">
            <span className="dt-metric-label">Assigned Cells</span>
            <span className="dt-metric-val highlight">{operatorStats.cellsCount} Cells</span>
          </div>
          <div className="dt-ocb-metric-item">
            <span className="dt-metric-label">Active Tasks</span>
            <span className="dt-metric-val">{operatorStats.pending + operatorStats.inProgress}</span>
          </div>
          <div className="dt-ocb-metric-item">
            <span className="dt-metric-label">Urgent / Warning</span>
            <span className={`dt-metric-val ${operatorStats.urgent > 0 ? "urgent" : "nominal"}`}>
              {operatorStats.urgent}
            </span>
          </div>
          <div className="dt-ocb-metric-item">
            <span className="dt-metric-label">Resolved Today</span>
            <span className="dt-metric-val success">{operatorStats.completed}</span>
          </div>
        </div>

        {/* Scope / Filter Switchers */}
        <div className="dt-ocb-actions-zone">
          {isOperator ? (
            <div className="dt-scope-toggle-group">
              <button
                className={`dt-scope-btn ${operatorScope === "my_cells" ? "active" : ""}`}
                onClick={() => setOperatorScope("my_cells")}
                title="Filter to only machines assigned to your shift"
              >
                <FontAwesomeIcon icon={faUserGear} />
                <span>My Assigned Cells ({operatorAssignedCells.length})</span>
              </button>
              <button
                className={`dt-scope-btn ${operatorScope === "all_cells" ? "active" : ""}`}
                onClick={() => setOperatorScope("all_cells")}
                title="View full factory digital twin"
              >
                <FontAwesomeIcon icon={faGears} />
                <span>All Plant Cells (6)</span>
              </button>
            </div>
          ) : (
            <div className="dt-supervisor-toolbar">
              <div className="dt-supervisor-select-wrap">
                <FontAwesomeIcon icon={faFilter} className="dt-select-icon" />
                <select
                  value={selectedOperatorFilter}
                  onChange={(e) => setSelectedOperatorFilter(e.target.value)}
                  className="dt-operator-select"
                  aria-label="Filter by Assigned Operator"
                >
                  <option value="ALL">All Operators Fleet (6 Cells)</option>
                  {usersList
                    .filter((u) => u.role === "USER")
                    .map((op) => (
                      <option key={op.id} value={op.id}>
                        👤 {op.name} ({getOperatorAssignedCells(op.id).join(", ") || "No cells"})
                      </option>
                    ))}
                </select>
              </div>

              <button
                className="dt-btn-supervisor-action"
                onClick={() => setIsReassignModalOpen(true)}
                title="Reassign machine cells between operators"
              >
                <FontAwesomeIcon icon={faArrowsRotate} />
                <span>Reassign Cells</span>
              </button>

              <button
                className="dt-btn-supervisor-action primary"
                onClick={() => setIsDispatchModalOpen(true)}
                title="Dispatch new task to operator"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Dispatch Task</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. MAIN 2-COLUMN SECTION: BLUEPRINT & TASKS (LEFT) + SENSORS (RIGHT) ─── */}
      <div className="digital-twin-section">
        {/* LEFT COLUMN: BLUEPRINT + WORK ORDER HUB */}
        <div className="dt-primary-content">
          {/* Factory Floor Blueprint & Cells Grid */}
          <div className="factory-layout">
            <div className="dt-header-banner">
              <div className="dt-title-left">
                <div className="dt-live-tag">
                  <span className="dt-pulse" />
                  <span>LIVE DIGITAL TWIN SCHEMATIC</span>
                </div>
                <h2>🏭 Factory Floor Blueprint &amp; Station Cells</h2>
                <p>
                  {isOperator && operatorScope === "my_cells"
                    ? `Active Monitoring for Your Assigned Station Cells (${filteredMachines.length} Cells)`
                    : "Real-Time SCADA Floor Model · Interactive Machine Fleet Inspector"}
                </p>
              </div>

              {/* Filter Pills */}
              <div className="dt-filter-pills">
                <button
                  className={`dt-filter-pill ${filterCategory === "all" ? "active" : ""}`}
                  onClick={() => setFilterCategory("all")}
                >
                  All ({filteredMachines.length})
                </button>
                <button
                  className={`dt-filter-pill ${filterCategory === "cnc" ? "active" : ""}`}
                  onClick={() => setFilterCategory("cnc")}
                >
                  CNC Precision (2)
                </button>
                <button
                  className={`dt-filter-pill ${filterCategory === "robotics" ? "active" : ""}`}
                  onClick={() => setFilterCategory("robotics")}
                >
                  Robotics
                </button>
                <button
                  className={`dt-filter-pill ${filterCategory === "logistics" ? "active" : ""}`}
                  onClick={() => setFilterCategory("logistics")}
                >
                  Logistics
                </button>
                <button
                  className={`dt-filter-pill ${filterCategory === "press" ? "active" : ""}`}
                  onClick={() => setFilterCategory("press")}
                >
                  Press
                </button>
              </div>
            </div>

            {/* Machine Cards Grid */}
            <div className="factory-map">
              {filteredMachines.map((m, idx) => {
                const assignedOp = getAssignedOperatorForCell(m.code);
                const isAssignedToCurrentUser = user?.id === assignedOp?.id;
                const cellTasks = getTasksForCell(m.code);
                const activeCellTasks = cellTasks.filter((t) => t.status !== "completed");
                const hasUrgentTask = activeCellTasks.some((t) => t.priority === "urgent" || t.priority === "high");

                return (
                  <div
                    key={m.id}
                    id={m.id}
                    className={`machine-card ${m.cls} ${highlighted === idx ? "pulse-active" : ""} ${isAssignedToCurrentUser ? "dt-my-station-glow" : ""}`}
                    onClick={() => setSelectedMachine(m)}
                    title="Click to inspect real-time machine telemetry, operator tasks, and AI diagnosis"
                    role="button"
                    tabIndex={0}
                  >
                    {/* Header with Code + Name + Status */}
                    <div className="machine-header">
                      <div className="machine-code-badge">{m.code}</div>
                      <span className="machine-name">{m.label}</span>
                      <span className={`status-dot ${m.status}`} />
                    </div>

                    {/* Operator Assignment Badge on Card */}
                    <div className="dt-card-operator-row">
                      <div className="dt-card-op-badge">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assignedOp?.avatar || "https://ui-avatars.com/api/?name=Operator&background=022c22&color=34d399"}
                          alt={assignedOp?.name || "Operator"}
                          className="dt-card-op-avatar"
                        />
                        <span className="dt-card-op-name">{assignedOp?.name || "Karan Johar"}</span>
                      </div>

                      {isAssignedToCurrentUser ? (
                        <span className="dt-my-cell-tag">★ MY STATION</span>
                      ) : (
                        <span className="dt-op-station-tag">{assignedOp?.title.split(" ")[0]}</span>
                      )}
                    </div>

                    {/* Machine Icon & Basic Telemetry */}
                    <div className="machine-icon">
                      <FontAwesomeIcon icon={m.icon} />
                    </div>

                    <div className="machine-info">
                      {m.info.map(([key, val]) => (
                        <p key={key}>
                          <span className="info-key">{key}:</span> <span className="info-val">{val}</span>
                        </p>
                      ))}
                    </div>

                    {/* Active Work Order Indicator */}
                    {activeCellTasks.length > 0 ? (
                      <div className={`dt-card-task-chip ${hasUrgentTask ? "urgent" : "standard"}`}>
                        <FontAwesomeIcon icon={hasUrgentTask ? faTriangleExclamation : faListCheck} />
                        <span>{activeCellTasks.length} Task{activeCellTasks.length > 1 ? "s" : ""}: {activeCellTasks[0].title.slice(0, 22)}...</span>
                      </div>
                    ) : (
                      <div className="dt-card-task-chip nominal">
                        <FontAwesomeIcon icon={faCircleCheck} />
                        <span>0 Pending Tasks · Nominal</span>
                      </div>
                    )}

                    <div className="machine-card-footer">
                      <span className="inspect-hint">Inspect Telemetry &amp; Work Orders →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operator Individual Tasks & Work Order Hub */}
          <div className="dt-tasks-command-hub">
            <div className="dt-tasks-hub-header">
              <div className="dt-tasks-title-group">
                <div className="dt-tasks-badge">
                  <FontAwesomeIcon icon={faClipboardList} />
                  <span>DIGITAL TWIN WORK ORDER FEED</span>
                </div>
                <h3>
                  {isOperator && operatorScope === "my_cells"
                    ? `Active Shift Tasks for ${user?.name || "Operator"}`
                    : selectedOperatorFilter !== "ALL"
                    ? `Assigned Tasks for ${usersList.find((u) => u.id === selectedOperatorFilter)?.name || "Operator"}`
                    : "Plant-Wide Machine Tasks & Individual Operator Work Orders"}
                </h3>
              </div>

              <div className="dt-tasks-tab-pills">
                <button
                  className={`dt-task-tab ${taskFilterTab === "active" ? "active" : ""}`}
                  onClick={() => setTaskFilterTab("active")}
                >
                  Active ({relevantTasks.filter((t) => t.status !== "completed").length})
                </button>
                <button
                  className={`dt-task-tab ${taskFilterTab === "urgent" ? "active" : ""}`}
                  onClick={() => setTaskFilterTab("urgent")}
                >
                  Urgent ({relevantTasks.filter((t) => (t.priority === "urgent" || t.priority === "high") && t.status !== "completed").length})
                </button>
                <button
                  className={`dt-task-tab ${taskFilterTab === "completed" ? "active" : ""}`}
                  onClick={() => setTaskFilterTab("completed")}
                >
                  Resolved ({relevantTasks.filter((t) => t.status === "completed").length})
                </button>
                <button
                  className={`dt-task-tab ${taskFilterTab === "all" ? "active" : ""}`}
                  onClick={() => setTaskFilterTab("all")}
                >
                  All ({relevantTasks.length})
                </button>
                <button
                  className="dt-task-collapse-btn"
                  onClick={() => setActiveTaskViewOpen(!activeTaskViewOpen)}
                  title={activeTaskViewOpen ? "Collapse Task List" : "Expand Task List"}
                >
                  <FontAwesomeIcon icon={activeTaskViewOpen ? faXmark : faListCheck} />
                </button>
              </div>
            </div>

            {activeTaskViewOpen && (
              <div className="dt-tasks-grid">
                {relevantTasks.length === 0 ? (
                  <div className="dt-tasks-empty-state">
                    <FontAwesomeIcon icon={faCircleCheck} className="dt-empty-icon" />
                    <h4>All Machine Tasks Completed</h4>
                    <p>No open work orders pending for the selected machine cell scope.</p>
                  </div>
                ) : (
                  relevantTasks.map((task) => {
                    const assignedOp = usersList.find((u) => u.id === task.operatorId);
                    const isMyTask = user?.id === task.operatorId;
                    const completedCount = task.checklist.filter((c) => c.done).length;
                    const totalChecklist = task.checklist.length;
                    const progressPct = totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0;

                    return (
                      <div
                        key={task.id}
                        className={`dt-task-card priority-${task.priority} ${task.status === "completed" ? "completed" : ""} ${isMyTask ? "my-task-card" : ""}`}
                      >
                        <div className="dt-tc-header">
                          <div className="dt-tc-cell-tag">
                            <span className="dt-cell-code">{task.machineCode}</span>
                            <span className="dt-cell-name">{task.machineLabel}</span>
                          </div>

                          <div className="dt-tc-meta-pills">
                            <span className={`dt-priority-pill ${task.priority}`}>
                              {task.priority.toUpperCase()}
                            </span>
                            <span className="dt-category-pill">{task.category}</span>
                          </div>
                        </div>

                        <h4 className="dt-tc-title">{task.title}</h4>
                        <p className="dt-tc-desc">{task.description}</p>

                        {task.aiReasoning && (
                          <div className="dt-tc-ai-note">
                            <FontAwesomeIcon icon={faShieldHalved} className="dt-ai-icon" />
                            <span>{task.aiReasoning}</span>
                          </div>
                        )}

                        {/* Operator Assignment Tag */}
                        <div className="dt-tc-operator-row">
                          <div className="dt-tc-op-info">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={assignedOp?.avatar || "https://ui-avatars.com/api/?name=Operator&background=022c22&color=34d399"}
                              alt={task.operatorName}
                              className="dt-tc-op-avatar"
                            />
                            <span className="dt-tc-op-name">
                              {task.operatorName} {isMyTask && <span className="dt-you-tag">(You)</span>}
                            </span>
                          </div>

                          <span className="dt-tc-due">
                            <FontAwesomeIcon icon={faClock} /> {task.dueIn}
                          </span>
                        </div>

                        {/* Interactive Checklist */}
                        <div className="dt-tc-checklist-box">
                          <div className="dt-checklist-header">
                            <span>Checklist Protocol</span>
                            <span className="dt-progress-counter">{completedCount}/{totalChecklist} done ({progressPct}%)</span>
                          </div>

                          <div className="dt-checklist-bar">
                            <div className="dt-checklist-fill" style={{ width: `${progressPct}%` }} />
                          </div>

                          <ul className="dt-checklist-list">
                            {task.checklist.map((item) => (
                              <li
                                key={item.id}
                                className={`dt-checklist-item ${item.done ? "done" : ""}`}
                                onClick={() => toggleChecklistItem(task.id, item.id)}
                                role="button"
                                tabIndex={0}
                              >
                                <span className={`dt-check-box ${item.done ? "checked" : ""}`}>
                                  {item.done && <FontAwesomeIcon icon={faCheck} />}
                                </span>
                                <span className="dt-check-text">{item.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Task Actions */}
                        <div className="dt-tc-actions">
                          {task.status !== "completed" ? (
                            <>
                              {task.status === "pending" ? (
                                <button
                                  className="dt-btn-task-action start"
                                  onClick={() => {
                                    updateTaskStatus(task.id, "in_progress");
                                    showNotice(`Started task "${task.title}"`);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPlay} />
                                  <span>Start Task</span>
                                </button>
                              ) : (
                                <button
                                  className="dt-btn-task-action in-prog"
                                  onClick={() => {
                                    completeTask(task.id);
                                    showNotice(`Completed task "${task.title}"`);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faCircleCheck} />
                                  <span>Complete Task</span>
                                </button>
                              )}

                              <button
                                className="dt-btn-task-action inspect"
                                onClick={() => {
                                  const match = MACHINES_DATA.find((m) => m.code === task.machineCode);
                                  if (match) setSelectedMachine(match);
                                }}
                              >
                                <span>Inspect Telemetry</span>
                                <FontAwesomeIcon icon={faArrowRight} />
                              </button>
                            </>
                          ) : (
                            <div className="dt-tc-resolved-banner">
                              <FontAwesomeIcon icon={faCircleCheck} />
                              <span>Task Resolved &amp; Synced to Digital Twin</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SENSOR TELEMETRY STREAM & SHIFT SAFETY SUMMARY */}
        <div className="dt-secondary-content">
          {/* Live Sensor Telemetry Stream */}
          <div className="sensor-panel">
            <div className="sensor-panel-header">
              <div className="sensor-panel-title">
                <span className="sensor-live-dot" />
                <h3>📡 Live Sensor Stream</h3>
              </div>
              <span className="sensor-rate-badge">100 Hz MQTT</span>
            </div>

            <div className="sensor-card">
              <div className="sensor-card-top">
                <h4>🌡 Spindle Temperature</h4>
                <span className="sensor-badge red">Thermal Probe</span>
              </div>
              <h2 id="tempValue">{sensor.temp}</h2>
              <div className="progress">
                <div className="progress-fill red-fill" />
              </div>
              <div className="sensor-meta">
                <span>Peak: 91.5°C</span>
                <span>Limit: 95°C</span>
              </div>
            </div>

            <div className="sensor-card">
              <div className="sensor-card-top">
                <h4>⚙ Spindle RPM</h4>
                <span className="sensor-badge blue">Optical Encoder</span>
              </div>
              <h2 id="rpmValue">{sensor.rpm}</h2>
              <div className="progress">
                <div className="progress-fill blue-fill" />
              </div>
              <div className="sensor-meta">
                <span>Target: 1,500 RPM</span>
                <span>Load: 86%</span>
              </div>
            </div>

            <div className="sensor-card">
              <div className="sensor-card-top">
                <h4>🔋 Plant Energy Draw</h4>
                <span className="sensor-badge green">Power Monitor</span>
              </div>
              <h2 id="energyValue">{sensor.energy}</h2>
              <div className="progress">
                <div className="progress-fill green-fill" />
              </div>
              <div className="sensor-meta">
                <span>Grid: 415V 50Hz</span>
                <span>PF: 0.98</span>
              </div>
            </div>

            <div className="sensor-card">
              <div className="sensor-card-top">
                <h4>📳 Spindle Vibration</h4>
                <span className="sensor-badge yellow">3-Axis Piezo</span>
              </div>
              <h2 id="vibrationValue">{sensor.vibration}</h2>
              <div className="progress">
                <div className="progress-fill yellow-fill" />
              </div>
              <div className="sensor-meta">
                <span>RMS: 3.4 mm/s</span>
                <span>Freq: 120 Hz</span>
              </div>
            </div>
          </div>

          {/* Shift Safety & Station Briefing Card */}
          <div className="dt-shift-briefing-card">
            <div className="dt-sbc-header">
              <FontAwesomeIcon icon={faRadio} className="dt-sbc-icon" />
              <h4>Station Safety Protocol</h4>
            </div>
            <p className="dt-sbc-text">
              Active radio channel: <strong>CH-04 (CNC Line)</strong>. Prioritize high-temp alarms on CELL-04 before authorizing automated tool changes.
            </p>
            <div className="dt-sbc-status-pill">
              <span className="dt-sbc-dot" />
              <span>SAFETY INTERLOCK: ENGAGED</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE MACHINE DETAIL INSPECTOR MODAL ─────────────────────── */}
      {selectedMachine && (
        <div className="dt-inspector-backdrop" onClick={() => setSelectedMachine(null)}>
          <div className="dt-inspector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dt-modal-header">
              <div className="dt-modal-title-group">
                <span className="dt-modal-code">{selectedMachine.code}</span>
                <h3>{selectedMachine.label}</h3>
                <span className={`dt-status-pill status-${selectedMachine.status}`}>
                  <span className="dt-status-dot" />
                  {selectedMachine.cls.toUpperCase()}
                </span>
              </div>
              <button
                className="dt-modal-close"
                onClick={() => setSelectedMachine(null)}
                aria-label="Close Inspector"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="dt-modal-body">
              {/* Operator Assignment Card in Modal */}
              {(() => {
                const assignedOp = getAssignedOperatorForCell(selectedMachine.code);
                const isAssignedToCurrentUser = user?.id === assignedOp?.id;

                return (
                  <div className={`dt-modal-operator-card ${isAssignedToCurrentUser ? "mine" : ""}`}>
                    <div className="dt-moc-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assignedOp?.avatar || "https://ui-avatars.com/api/?name=Operator&background=022c22&color=34d399"}
                        alt={assignedOp?.name || "Operator"}
                        className="dt-moc-avatar"
                      />
                      <div className="dt-moc-info">
                        <div className="dt-moc-title-row">
                          <span className="dt-moc-label">Assigned Cell Operator</span>
                          {isAssignedToCurrentUser && <span className="dt-moc-you-badge">★ YOU</span>}
                        </div>
                        <h4 className="dt-moc-name">{assignedOp?.name || "Karan Johar"}</h4>
                        <p className="dt-moc-role">{assignedOp?.title || "Lead CNC Operator"} · Radio CH-04</p>
                      </div>
                    </div>

                    {!isOperator && (
                      <div className="dt-moc-reassign-quick">
                        <label>Reassign Cell:</label>
                        <select
                          value={cellAssignments[selectedMachine.code] || "usr-op-01"}
                          onChange={(e) => {
                            reassignCellOperator(selectedMachine.code, e.target.value);
                            showNotice(`Reassigned ${selectedMachine.code} to ${usersList.find((u) => u.id === e.target.value)?.name}`);
                          }}
                          className="dt-quick-select"
                        >
                          {usersList
                            .filter((u) => u.role === "USER")
                            .map((op) => (
                              <option key={op.id} value={op.id}>
                                {op.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Telemetry stats grid */}
              <div className="dt-telemetry-grid">
                <div className="dt-telemetry-card">
                  <div className="dt-tc-label">
                    <FontAwesomeIcon icon={faTemperatureHalf} style={{ color: "#B23A3A" }} />
                    <span>Operating Temperature</span>
                  </div>
                  <div className="dt-tc-value">{selectedMachine.telemetry.temp}</div>
                </div>

                <div className="dt-telemetry-card">
                  <div className="dt-tc-label">
                    <FontAwesomeIcon icon={faGaugeHigh} style={{ color: "#FF5A1F" }} />
                    <span>Spindle / Motor Speed</span>
                  </div>
                  <div className="dt-tc-value">{selectedMachine.telemetry.rpm}</div>
                </div>

                <div className="dt-telemetry-card">
                  <div className="dt-tc-label">
                    <FontAwesomeIcon icon={faWaveSquare} style={{ color: "#C87D1F" }} />
                    <span>Vibration Amplitude</span>
                  </div>
                  <div className="dt-tc-value">{selectedMachine.telemetry.vibration}</div>
                </div>

                <div className="dt-telemetry-card">
                  <div className="dt-tc-label">
                    <FontAwesomeIcon icon={faBolt} style={{ color: "#3F7A5F" }} />
                    <span>Load Utilization</span>
                  </div>
                  <div className="dt-tc-value">{selectedMachine.telemetry.load}</div>
                </div>
              </div>

              {/* AI Predictive Inference Box */}
              <div className="dt-ai-verdict-box">
                <div className="dt-verdict-header">
                  <div className="dt-vh-title">
                    <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#FF5A1F" }} />
                    <strong>Digital Twin AI Diagnostics &amp; Risk Inference</strong>
                  </div>
                  <span className="dt-verdict-model">{selectedMachine.telemetry.predictiveModel}</span>
                </div>
                <div className="dt-verdict-content">
                  <div className="dt-verdict-score-row">
                    <span>Machine Health Score:</span>
                    <strong style={{ color: selectedMachine.telemetry.healthScore > 75 ? "#3F7A5F" : "#B23A3A" }}>
                      {selectedMachine.telemetry.healthScore}%
                    </strong>
                    <span className="dt-verdict-sep">·</span>
                    <span>Risk:</span>
                    <strong style={{ color: selectedMachine.status === "red" ? "#B23A3A" : selectedMachine.status === "yellow" ? "#C87D1F" : "#3F7A5F" }}>
                      {selectedMachine.telemetry.riskLevel}
                    </strong>
                  </div>
                  <p className="dt-verdict-recommendation">
                    {selectedMachine.telemetry.aiRecommendation}
                  </p>
                </div>
              </div>

              {/* Active Machine Tasks in Modal */}
              {(() => {
                const cellTasks = getTasksForCell(selectedMachine.code);
                if (cellTasks.length === 0) return null;

                return (
                  <div className="dt-modal-tasks-section">
                    <h4 className="dt-mts-heading">
                      <FontAwesomeIcon icon={faListCheck} /> Active Work Orders for {selectedMachine.code} ({cellTasks.length})
                    </h4>
                    <div className="dt-mts-list">
                      {cellTasks.map((task) => (
                        <div key={task.id} className="dt-mts-task-row">
                          <div className="dt-mts-task-info">
                            <span className={`dt-priority-pill ${task.priority}`}>{task.priority.toUpperCase()}</span>
                            <strong>{task.title}</strong>
                            <span className="dt-mts-due">Due: {task.dueIn}</span>
                          </div>

                          <div className="dt-mts-checklist">
                            {task.checklist.map((item) => (
                              <label key={item.id} className="dt-mts-check-item">
                                <input
                                  type="checkbox"
                                  checked={item.done}
                                  onChange={() => toggleChecklistItem(task.id, item.id)}
                                />
                                <span className={item.done ? "done" : ""}>{item.text}</span>
                              </label>
                            ))}
                          </div>

                          {task.status !== "completed" && (
                            <button
                              className="dt-btn-resolve-sm"
                              onClick={() => {
                                completeTask(task.id);
                                showNotice(`Completed task "${task.title}" for ${selectedMachine.code}`);
                              }}
                            >
                              <FontAwesomeIcon icon={faCircleCheck} />
                              <span>Complete Work Order</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="dt-modal-actions">
                <button
                  className="dt-btn-action primary"
                  onClick={() => {
                    showNotice(`Dispatched maintenance diagnostics for ${selectedMachine.label}`);
                    setSelectedMachine(null);
                  }}
                >
                  <FontAwesomeIcon icon={faWrench} />
                  <span>Dispatch Maintenance Engineer</span>
                </button>
                <button
                  className="dt-btn-action secondary"
                  onClick={() => {
                    showNotice(`Acknowledged telemetry for ${selectedMachine.code}`);
                    setSelectedMachine(null);
                  }}
                >
                  <FontAwesomeIcon icon={faCircleCheck} />
                  <span>Acknowledge Telemetry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DISPATCH TASK MODAL (SUPERVISOR / ADMIN) ───────────────────────── */}
      {isDispatchModalOpen && (
        <div className="dt-inspector-backdrop" onClick={() => setIsDispatchModalOpen(false)}>
          <div className="dt-inspector-modal dispatch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dt-modal-header">
              <div className="dt-modal-title-group">
                <FontAwesomeIcon icon={faPlus} style={{ color: "var(--primary)" }} />
                <h3>Dispatch Work Order to Machine Operator</h3>
              </div>
              <button className="dt-modal-close" onClick={() => setIsDispatchModalOpen(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="dt-dispatch-form">
              <div className="dt-form-row">
                <div className="dt-form-field">
                  <label>Target Machine Cell</label>
                  <select
                    value={newCellCode}
                    onChange={(e) => setNewCellCode(e.target.value)}
                    required
                  >
                    {FACTORY_CELLS.map((cell) => {
                      const op = getAssignedOperatorForCell(cell.code);
                      return (
                        <option key={cell.code} value={cell.code}>
                          {cell.code} — {cell.label} (Op: {op?.name || "Unassigned"})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="dt-form-field">
                  <label>Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  >
                    <option value="low">Low (Routine)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Attention Needed)</option>
                    <option value="urgent">Urgent (Immediate LOTO/Inspection)</option>
                  </select>
                </div>
              </div>

              <div className="dt-form-row">
                <div className="dt-form-field">
                  <label>Task Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                  >
                    <option value="Inspection">Inspection</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Calibration">Calibration</option>
                    <option value="Tooling">Tooling &amp; Offset</option>
                    <option value="Safety">Safety &amp; Sensor</option>
                  </select>
                </div>

                <div className="dt-form-field">
                  <label>Due Time / SLA</label>
                  <input
                    type="text"
                    value={newDueIn}
                    onChange={(e) => setNewDueIn(e.target.value)}
                    placeholder="e.g. 30 min, 1.5 hours"
                    required
                  />
                </div>
              </div>

              <div className="dt-form-field">
                <label>Task Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Spindle Vibration Verification & Lubrication Sweep"
                  required
                />
              </div>

              <div className="dt-form-field">
                <label>Work Order Description / Instructions</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detailed instructions for the floor operator..."
                  rows={3}
                />
              </div>

              <div className="dt-form-field">
                <label>Checklist Items (One per line)</label>
                <textarea
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Line 1 checklist item&#10;Line 2 checklist item"
                  rows={3}
                  required
                />
              </div>

              <div className="dt-modal-actions">
                <button type="submit" className="dt-btn-action primary">
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Dispatch Task to Operator</span>
                </button>
                <button
                  type="button"
                  className="dt-btn-action secondary"
                  onClick={() => setIsDispatchModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REASSIGN MACHINE CELLS MODAL (SUPERVISOR / ADMIN) ────────────────── */}
      {isReassignModalOpen && (
        <div className="dt-inspector-backdrop" onClick={() => setIsReassignModalOpen(false)}>
          <div className="dt-inspector-modal reassign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dt-modal-header">
              <div className="dt-modal-title-group">
                <FontAwesomeIcon icon={faArrowsRotate} style={{ color: "var(--primary)" }} />
                <h3>Machine Cell &amp; Operator Allocations</h3>
              </div>
              <button className="dt-modal-close" onClick={() => setIsReassignModalOpen(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="dt-reassign-content">
              <p className="dt-reassign-desc">
                Allocate machine cells to operators to separate monitoring workflows. Each operator will monitor their assigned cells on their digital twin station.
              </p>

              <div className="dt-cell-allocation-table">
                {FACTORY_CELLS.map((cell) => {
                  const currentOpId = cellAssignments[cell.code] || cell.defaultOperatorId;

                  return (
                    <div key={cell.code} className="dt-cat-row">
                      <div className="dt-cat-cell-meta">
                        <span className="dt-cat-code">{cell.code}</span>
                        <div className="dt-cat-labels">
                          <strong>{cell.label}</strong>
                          <span>{cell.location}</span>
                        </div>
                      </div>

                      <div className="dt-cat-assignee">
                        <label>Assigned Operator:</label>
                        <select
                          value={currentOpId}
                          onChange={(e) => {
                            reassignCellOperator(cell.code, e.target.value);
                            showNotice(`Updated ${cell.code} assigned operator to ${usersList.find((u) => u.id === e.target.value)?.name}`);
                          }}
                          className="dt-cat-select"
                        >
                          {usersList
                            .filter((u) => u.role === "USER")
                            .map((op) => (
                              <option key={op.id} value={op.id}>
                                👤 {op.name} ({op.title})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="dt-modal-actions">
                <button
                  className="dt-btn-action primary"
                  onClick={() => setIsReassignModalOpen(false)}
                >
                  <FontAwesomeIcon icon={faCircleCheck} />
                  <span>Done &amp; Save Cell Mappings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
