"use client";

export default function UsersPage() {
  const users = [
    { name: "Administrator", role: "Factory Manager", status: "Active", machines: 26 },
    { name: "Engineer A", role: "Maintenance Lead", status: "Active", machines: 8 },
    { name: "Engineer B", role: "Machine Operator", status: "Active", machines: 5 },
    { name: "Engineer C", role: "Quality Control", status: "Idle", machines: 4 },
    { name: "Technician 1", role: "Field Technician", status: "Active", machines: 3 },
  ];

  return (
    <section className="maintenance-section" style={{ marginTop: 0 }}>
      <div className="maintenance-card">
        <h2>👤 User Management</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Machines Managed</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.name}>
                <td>{u.name}</td>
                <td>{u.role}</td>
                <td>{u.machines}</td>
                <td>
                  <span className={`priority ${u.status === "Active" ? "low" : "medium"}`}>
                    {u.status}
                  </span>
                </td>
                <td>
                  <button>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
