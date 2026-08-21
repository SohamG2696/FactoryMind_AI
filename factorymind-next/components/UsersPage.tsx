"use client";

import { useState } from "react";
import { useAuth, UserRole, UserAccount } from "@/context/AuthContext";
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
} from "@fortawesome/free-solid-svg-icons";

export default function UsersPage() {
  const {
    usersList,
    role: currentRole,
    addUser,
    toggleUserStatus,
    deleteUser,
  } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDepartment, setNewDepartment] = useState("Plant Operations");
  const [newTitle, setNewTitle] = useState("Floor Machine Operator");
  const [newMachines, setNewMachines] = useState(4);
  const [filterRole, setFilterRole] = useState<"ALL" | UserRole>("ALL");
  const [message, setMessage] = useState<string | null>(null);

  const isAdmin = currentRole === "ADMIN";

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    addUser({
      name: newName,
      email: newEmail,
      role: "USER",
      title: newTitle || "Machine Operator",
      department: newDepartment,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${newEmail}`,
      status: "Active",
      machinesManaged: Number(newMachines),
    });

    setNewName("");
    setNewEmail("");
    setIsAddModalOpen(false);
    setMessage(`New operator account "${newName}" created successfully.`);
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
          <div className="stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
            <FontAwesomeIcon icon={faUserShield} />
          </div>
          <div>
            <div className="stat-count">{adminCount} / 4</div>
            <div className="stat-label">Administrators (Fixed)</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
            <FontAwesomeIcon icon={faUserTie} />
          </div>
          <div>
            <div className="stat-count">{superCount} / 4</div>
            <div className="stat-label">Shift Supervisors (Fixed)</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
            <FontAwesomeIcon icon={faUserGear} />
          </div>
          <div>
            <div className="stat-count">{userCount}</div>
            <div className="stat-label">Active Operators</div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#6ee7b7", padding: "10px 16px", borderRadius: 12, marginBottom: 16 }}>
          <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: 8 }} />
          {message}
        </div>
      )}

      {/* Main Table Section */}
      <section className="users-table-card">
        <div className="table-header-row">
          <div>
            <h2>Plant Personnel & Security Clearance</h2>
            <p>Access control, shift allocations, and active machine monitoring assignments</p>
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
                <th>Machines</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
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
                    <span style={{ fontWeight: 500, color: "#cbd5e1", fontSize: 13 }}>{u.title}</span>
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

                  {/* Machines Managed */}
                  <td>
                    <span className="user-machines-tag">{u.machinesManaged || 0} Units</span>
                  </td>

                  {/* Actions (Admin Only) */}
                  {isAdmin && (
                    <td>
                      <div className="user-actions-cell">
                        {u.fixedClearance ? (
                          <span style={{ fontSize: 11, color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: 4 }}>
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
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
              <p className="google-auth-subtitle">Assign floor operators to assembly & machining cells</p>
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

              <div className="google-restriction-notice" style={{ margin: "4px 0" }}>
                <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#f59e0b" }} />
                <span>Administrator and Supervisor positions are limited to the 4 pre-assigned leadership slots.</span>
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
