"use client";

import { useState } from "react";
import { useAuth, UserRole, UserAccount } from "@/context/AuthContext";
import { useOperatorTasks, FACTORY_CELLS } from "@/context/OperatorTaskContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faUserShield,
  faUserTie,
  faUserGear,
  faTrash,
  faXmark,
  faShieldHalved,
  faCircleCheck,
  faLock,
  faGears,
  faPenToSquare,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";

export default function UsersPage() {
  const {
    usersList,
    role: currentRole,
    addUser,
    toggleUserStatus,
    deleteUser,
    updateUserAssignedCells,
  } = useAuth();

  const {
    cellAssignments,
    reassignCellOperator,
    getOperatorAssignedCells,
    getTasksForOperator,
  } = useOperatorTasks();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<UserAccount | null>(null);
  const [selectedCellsForEdit, setSelectedCellsForEdit] = useState<string[]>([]);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDepartment, setNewDepartment] = useState("Plant Operations");
  const [newTitle, setNewTitle] = useState("Floor Machine Operator");
  const [newSelectedCells, setNewSelectedCells] = useState<string[]>(["CELL-01"]);
  const [filterRole, setFilterRole] = useState<"ALL" | UserRole>("ALL");
  const [message, setMessage] = useState<string | null>(null);

  const isAdmin = currentRole === "ADMIN";
  const isSupervisorOrAdmin = currentRole === "ADMIN" || currentRole === "SUPERVISOR";

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    addUser({
      name: newName,
      email: newEmail,
      role: "USER",
      title: newTitle || "Machine Operator",
      department: newDepartment,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=022c22&color=34d399&bold=true&rounded=true&size=150`,
      status: "Active",
      machinesManaged: newSelectedCells.length,
      assignedCells: newSelectedCells,
    });

    setNewName("");
    setNewEmail("");
    setIsAddModalOpen(false);
    setMessage(`New operator account "${newName}" created successfully with ${newSelectedCells.length} assigned cell(s).`);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleOpenEditCells = (u: UserAccount) => {
    setEditingOperator(u);
    const assigned = getOperatorAssignedCells(u.id);
    setSelectedCellsForEdit(assigned.length > 0 ? assigned : (u.assignedCells || []));
  };

  const handleSaveEditCells = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOperator) return;

    // Update cell assignments in OperatorTaskContext
    FACTORY_CELLS.forEach((cell) => {
      if (selectedCellsForEdit.includes(cell.code)) {
        reassignCellOperator(cell.code, editingOperator.id);
      }
    });

    // Update in AuthContext
    updateUserAssignedCells(editingOperator.id, selectedCellsForEdit);

    setMessage(`Updated machine cell allocation for ${editingOperator.name} (${selectedCellsForEdit.join(", ") || "None"}).`);
    setEditingOperator(null);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDelete = (u: UserAccount) => {
    if (u.fixedClearance) {
      alert(`Cannot delete ${u.name}. This is one of the 4 pre-assigned ${u.role === "ADMIN" ? "Administrator" : "Supervisor"} positions.`);
      return;
    }
    deleteUser(u.id);
  };

  const filteredUsers = usersList.filter((u) => {
    if (filterRole === "ALL") return true;
    return u.role === filterRole;
  });

  const adminCount = usersList.filter((u) => u.role === "ADMIN").length;
  const superCount = usersList.filter((u) => u.role === "SUPERVISOR").length;
  const userCount = usersList.filter((u) => u.role === "USER").length;

  return (
    <div className="users-page-container">
      {/* Role Stats Row */}
      <div className="users-stats-row">
        <div className="user-stat-card">
          <div className="stat-icon-wrap" style={{ background: "rgba(200, 125, 31, 0.12)", color: "#C87D1F" }}>
            <FontAwesomeIcon icon={faUserShield} />
          </div>
          <div>
            <div className="stat-count">{adminCount} / 4</div>
            <div className="stat-label">Administrators (Leadership)</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon-wrap" style={{ background: "rgba(74, 109, 140, 0.12)", color: "#4A6D8C" }}>
            <FontAwesomeIcon icon={faUserTie} />
          </div>
          <div>
            <div className="stat-count">{superCount} / 4</div>
            <div className="stat-label">Shift Supervisors (Fixed)</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon-wrap" style={{ background: "rgba(63, 122, 95, 0.12)", color: "#3F7A5F" }}>
            <FontAwesomeIcon icon={faUserGear} />
          </div>
          <div>
            <div className="stat-count">{userCount}</div>
            <div className="stat-label">Floor Machine Operators</div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ background: "rgba(63, 122, 95, 0.12)", border: "1px solid rgba(63, 122, 95, 0.3)", color: "#274E3A", padding: "12px 18px", borderRadius: 12, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#3F7A5F" }} />
          <span>{message}</span>
        </div>
      )}

      {/* Main Table Section */}
      <section className="users-table-card">
        <div className="table-header-row">
          <div>
            <h2>Plant Personnel &amp; Operator Cell Assignments</h2>
            <p>Role-based access control, machine cell monitoring assignments, and operator shift tasks</p>
          </div>

          {isAdmin && (
            <button className="btn-add-user" onClick={() => setIsAddModalOpen(true)}>
              <FontAwesomeIcon icon={faUserPlus} />
              Add Operator
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="users-filter-bar">
          <button
            className={`filter-btn ${filterRole === "ALL" ? "active" : ""}`}
            onClick={() => setFilterRole("ALL")}
          >
            All Accounts ({usersList.length})
          </button>
          <button
            className={`filter-btn admin ${filterRole === "ADMIN" ? "active" : ""}`}
            onClick={() => setFilterRole("ADMIN")}
          >
            👑 Administrators (4)
          </button>
          <button
            className={`filter-btn supervisor ${filterRole === "SUPERVISOR" ? "active" : ""}`}
            onClick={() => setFilterRole("SUPERVISOR")}
          >
            🛡 Supervisors (4)
          </button>
          <button
            className={`filter-btn user ${filterRole === "USER" ? "active" : ""}`}
            onClick={() => setFilterRole("USER")}
          >
            👤 Operators ({userCount})
          </button>
        </div>

        {/* Users Table */}
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User / Identity</th>
                <th>Assigned Position</th>
                <th>Role Clearance</th>
                <th>Department</th>
                <th>Status</th>
                <th>Assigned Machine Cells</th>
                <th>Active Tasks</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const assignedCells = u.role === "USER"
                  ? (getOperatorAssignedCells(u.id).length > 0 ? getOperatorAssignedCells(u.id) : (u.assignedCells || []))
                  : [];
                const opTasks = u.role === "USER" ? getTasksForOperator(u.id) : [];
                const activeOpTasks = opTasks.filter((t) => t.status !== "completed");

                return (
                  <tr key={u.id}>
                    {/* User Column */}
                    <td>
                      <div className="user-identity-cell">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u.avatar} alt={u.name} className="user-table-avatar" />
                        <div>
                          <div className="user-table-name">
                            {u.name}
                            {u.fixedClearance && (
                              <span title="Fixed Plant Leadership Position" style={{ marginLeft: 6, color: "#f59e0b", fontSize: 11 }}>
                                <FontAwesomeIcon icon={faLock} />
                              </span>
                            )}
                          </div>
                          <div className="user-table-email">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Title / Position */}
                    <td>
                      <span style={{ fontWeight: 500, color: "var(--text-secondary)", fontSize: 13 }}>{u.title}</span>
                    </td>

                    {/* Role Column */}
                    <td>
                      <span className={`role-badge-pill role-badge-${u.role.toLowerCase()}`}>
                        {u.role === "ADMIN" ? "ADMINISTRATOR" : u.role === "SUPERVISOR" ? "SUPERVISOR" : "OPERATOR"}
                      </span>
                    </td>

                    {/* Department */}
                    <td>
                      <span className="user-dept-text">{u.department}</span>
                    </td>

                    {/* Status Toggle */}
                    <td>
                      <button
                        className={`status-toggle-btn status-${u.status.toLowerCase()}`}
                        onClick={() => toggleUserStatus(u.id)}
                        title="Click to toggle status"
                      >
                        <span className="status-dot-inner" />
                        {u.status}
                      </button>
                    </td>

                    {/* Assigned Machine Cells */}
                    <td>
                      {u.role === "USER" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {assignedCells.length > 0 ? (
                            assignedCells.map((c) => (
                              <span key={c} className="user-machines-tag" style={{ background: "rgba(63, 122, 95, 0.12)", color: "#274E3A", border: "1px solid rgba(63, 122, 95, 0.25)" }}>
                                {c}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>None</span>
                          )}

                          {isSupervisorOrAdmin && (
                            <button
                              onClick={() => handleOpenEditCells(u)}
                              className="btn-edit-cells"
                              title="Edit Assigned Machine Cells"
                              style={{ border: "none", background: "none", color: "var(--primary)", cursor: "pointer", fontSize: 12, padding: 2 }}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="user-machines-tag">All 26 Plant Units</span>
                      )}
                    </td>

                    {/* Active Tasks */}
                    <td>
                      {u.role === "USER" ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: activeOpTasks.length > 0 ? "var(--warning)" : "var(--success)" }}>
                          <FontAwesomeIcon icon={faListCheck} style={{ marginRight: 4 }} />
                          {activeOpTasks.length} Pending
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Master View</span>
                      )}
                    </td>

                    {/* Actions (Admin Only) */}
                    {isAdmin && (
                      <td>
                        <div className="user-actions-cell">
                          {u.fixedClearance ? (
                            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#f59e0b" }} />
                              Fixed Slot
                            </span>
                          ) : (
                            <button
                              className="btn-delete-user"
                              onClick={() => handleDelete(u)}
                              title="Delete User"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Assigned Machine Cells Modal */}
      {editingOperator && (
        <div className="google-auth-backdrop" onClick={() => setEditingOperator(null)}>
          <div className="google-auth-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="google-auth-topbar">
              <button className="google-close-btn" onClick={() => setEditingOperator(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="google-auth-header">
              <h2 className="google-auth-title">Assign Machine Cells</h2>
              <p className="google-auth-subtitle">Configure dedicated monitoring stations for {editingOperator.name}</p>
            </div>

            <form onSubmit={handleSaveEditCells} style={{ padding: "0 28px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {FACTORY_CELLS.map((cell) => {
                  const isChecked = selectedCellsForEdit.includes(cell.code);
                  return (
                    <label
                      key={cell.code}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1px solid ${isChecked ? "var(--primary)" : "var(--border-subtle)"}`,
                        background: isChecked ? "var(--primary-glow)" : "var(--bg-card)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedCellsForEdit(selectedCellsForEdit.filter((c) => c !== cell.code));
                          } else {
                            setSelectedCellsForEdit([...selectedCellsForEdit, cell.code]);
                          }
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: 13, color: "var(--text-main)" }}>{cell.code} — {cell.label}</strong>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{cell.location}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="google-auth-actions-row">
                <button type="button" className="google-btn-text" onClick={() => setEditingOperator(null)}>
                  Cancel
                </button>
                <button type="submit" className="google-btn-primary">
                  Save Allocations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="google-auth-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="google-auth-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="google-auth-topbar">
              <button className="google-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="google-auth-header">
              <h2 className="google-auth-title">Add Factory Operator</h2>
              <p className="google-auth-subtitle">Assign floor operators to assembly &amp; machining cells</p>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: "0 28px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="google-input-container">
                <label className="google-floating-label">Full Name</label>
                <div className="google-input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. David Zhao"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="google-input-container">
                <label className="google-floating-label">Enterprise Email</label>
                <div className="google-input-wrapper">
                  <input
                    type="email"
                    placeholder="david.zhao@factorymind.ai"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="google-input-container">
                <label className="google-floating-label">Operator Title</label>
                <div className="google-input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. CNC Workcell Lead"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="google-input-container">
                <label className="google-floating-label">Department</label>
                <div className="google-input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. Precision Machining"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                  />
                </div>
              </div>

              {/* Initial Cell Selection */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                  Initial Assigned Machine Cells
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {FACTORY_CELLS.map((cell) => {
                    const isChecked = newSelectedCells.includes(cell.code);
                    return (
                      <label
                        key={cell.code}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: `1px solid ${isChecked ? "var(--primary)" : "var(--border-subtle)"}`,
                          background: isChecked ? "var(--primary-glow)" : "var(--bg-card)",
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewSelectedCells(newSelectedCells.filter((c) => c !== cell.code));
                            } else {
                              setNewSelectedCells([...newSelectedCells, cell.code]);
                            }
                          }}
                        />
                        <span>{cell.code}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="google-restriction-notice" style={{ margin: "4px 0" }}>
                <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#f59e0b" }} />
                <span>Operator password defaults to Name@123 for secure login.</span>
              </div>

              <div className="google-auth-actions-row">
                <button type="button" className="google-btn-text" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="google-btn-primary">
                  Create Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
