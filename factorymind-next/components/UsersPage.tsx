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
  faCheck,
  faXmark,
  faShieldHalved,
  faCircleCheck,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

export default function UsersPage() {
  const {
    usersList,
    role: currentRole,
    addUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
  } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDepartment, setNewDepartment] = useState("Plant Operations");
  const [newRole, setNewRole] = useState<UserRole>("USER");
  const [newMachines, setNewMachines] = useState(4);
  const [filterRole, setFilterRole] = useState<"ALL" | UserRole>("ALL");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const isAdmin = currentRole === "ADMIN";

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    addUser({
      name: newName,
      email: newEmail,
      role: newRole,
      title:
        newRole === "ADMIN"
          ? "System Administrator"
          : newRole === "SUPERVISOR"
          ? "Floor Supervisor"
          : "Machine Operator",
      department: newDepartment,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${newEmail}`,
      status: "Active",
      machinesManaged: Number(newMachines),
    });

    setNewName("");
    setNewEmail("");
    setIsAddModalOpen(false);
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
            <div className="stat-count">{adminCount}</div>
            <div className="stat-label">Administrators</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
            <FontAwesomeIcon icon={faUserTie} />
          </div>
          <div>
            <div className="stat-count">{superCount}</div>
            <div className="stat-label">Shift Supervisors</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
            <FontAwesomeIcon icon={faUserGear} />
          </div>
          <div>
            <div className="stat-count">{userCount}</div>
            <div className="stat-label">Operators & Techs</div>
          </div>
        </div>
      </div>

      {/* Permission Notice for non-admins */}
      {!isAdmin && (
        <div className="role-notice-banner supervisor-banner">
          <FontAwesomeIcon icon={faShieldHalved} />
          <span>
            <strong>Read-Only Mode:</strong> You are viewing the operational team roster as <strong>{currentRole}</strong>. Role promotions and user additions require Administrator credentials.
          </span>
        </div>
      )}

      {/* Main Table Card */}
      <section className="maintenance-section" style={{ marginTop: 0 }}>
        <div className="maintenance-card">
          <div className="users-header-row">
            <div>
              <h2>👤 Identity & Role-Based Access Control</h2>
              <p className="users-subtext">Manage accounts, security clearances, and machine assignments.</p>
            </div>

            <div className="users-actions-bar">
              {/* Filter Tabs */}
              <div className="role-filter-pills">
                <button
                  className={`filter-pill ${filterRole === "ALL" ? "active" : ""}`}
                  onClick={() => setFilterRole("ALL")}
                >
                  All ({usersList.length})
                </button>
                <button
                  className={`filter-pill admin ${filterRole === "ADMIN" ? "active" : ""}`}
                  onClick={() => setFilterRole("ADMIN")}
                >
                  Admin ({adminCount})
                </button>
                <button
                  className={`filter-pill supervisor ${filterRole === "SUPERVISOR" ? "active" : ""}`}
                  onClick={() => setFilterRole("SUPERVISOR")}
                >
                  Supervisor ({superCount})
                </button>
                <button
                  className={`filter-pill user ${filterRole === "USER" ? "active" : ""}`}
                  onClick={() => setFilterRole("USER")}
                >
                  Operators ({userCount})
                </button>
              </div>

              {isAdmin && (
                <button
                  className="btn-add-user"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  Add User
                </button>
              )}
            </div>
          </div>

          <table className="users-table">
            <thead>
              <tr>
                <th>User / Identity</th>
                <th>Security Role</th>
                <th>Department</th>
                <th>Machines</th>
                <th>Status</th>
                <th>Last Active</th>
                {isAdmin && <th>Role Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-identity-cell">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="user-table-avatar"
                      />
                      <div>
                        <strong>{u.name}</strong>
                        <span>{u.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    {editingUserId === u.id && isAdmin ? (
                      <select
                        className="role-select-inline"
                        value={u.role}
                        onChange={(e) => {
                          updateUserRole(u.id, e.target.value as UserRole);
                          setEditingUserId(null);
                        }}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPERVISOR">SUPERVISOR</option>
                        <option value="USER">USER</option>
                      </select>
                    ) : (
                      <span className={`role-badge-pill role-badge-${u.role.toLowerCase()}`}>
                        {u.role}
                      </span>
                    )}
                  </td>

                  <td>{u.department}</td>
                  <td>
                    <strong>{u.machinesManaged || 0}</strong> units
                  </td>

                  <td>
                    <button
                      className={`status-pill ${u.status === "Active" ? "active" : "idle"}`}
                      onClick={() => isAdmin && toggleUserStatus(u.id)}
                      disabled={!isAdmin}
                      title={isAdmin ? "Click to toggle status" : undefined}
                    >
                      <span className="status-dot" />
                      {u.status}
                    </button>
                  </td>

                  <td>
                    <span className="last-active-text">
                      <FontAwesomeIcon icon={faClock} style={{ marginRight: 4, opacity: 0.6 }} />
                      {u.lastActive || "Recently"}
                    </span>
                  </td>

                  {isAdmin && (
                    <td>
                      <div className="table-actions-group">
                        <button
                          className="btn-edit-role"
                          onClick={() => setEditingUserId(editingUserId === u.id ? null : u.id)}
                          title="Change Role"
                        >
                          {editingUserId === u.id ? "Done" : "Change Role"}
                        </button>

                        <button
                          className="btn-delete-user"
                          onClick={() => deleteUser(u.id)}
                          title="Delete User"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
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
        <div className="auth-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <button className="auth-close-btn" onClick={() => setIsAddModalOpen(false)}>
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <div className="auth-header">
              <h2>Add New FactoryMind Account</h2>
              <p>Assign security roles and floor machine allocations</p>
            </div>

            <form onSubmit={handleAddSubmit} className="auth-form">
              <div className="auth-input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rachel Adams"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Enterprise Email</label>
                <input
                  type="email"
                  placeholder="rachel.adams@factorymind.ai"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Department</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="modal-select"
                >
                  <option value="Plant Operations">Plant Operations</option>
                  <option value="Preventive Maintenance">Preventive Maintenance</option>
                  <option value="Precision Machining">Precision Machining</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Executive & AI Systems">Executive & AI Systems</option>
                </select>
              </div>

              <div className="auth-input-group">
                <label>Access Security Role</label>
                <div className="role-radio-group">
                  <label className={`role-radio-label ${newRole === "ADMIN" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="newUserRole"
                      value="ADMIN"
                      checked={newRole === "ADMIN"}
                      onChange={() => setNewRole("ADMIN")}
                    />
                    <span>Administrator</span>
                  </label>

                  <label className={`role-radio-label ${newRole === "SUPERVISOR" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="newUserRole"
                      value="SUPERVISOR"
                      checked={newRole === "SUPERVISOR"}
                      onChange={() => setNewRole("SUPERVISOR")}
                    />
                    <span>Supervisor</span>
                  </label>

                  <label className={`role-radio-label ${newRole === "USER" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="newUserRole"
                      value="USER"
                      checked={newRole === "USER"}
                      onChange={() => setNewRole("USER")}
                    />
                    <span>User (Operator)</span>
                  </label>
                </div>
              </div>

              <div className="auth-input-group">
                <label>Machines Managed</label>
                <input
                  type="number"
                  min="0"
                  max="26"
                  value={newMachines}
                  onChange={(e) => setNewMachines(Number(e.target.value))}
                />
              </div>

              <button type="submit" className="auth-submit-btn">
                <FontAwesomeIcon icon={faCircleCheck} />
                Create Account & Grant Role
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

