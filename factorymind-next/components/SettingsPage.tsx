"use client";

const settings = [
  { group: "Factory Configuration", items: [
    { label: "Factory Name", value: "FactoryMind AI Plant-01", type: "text" },
    { label: "Location", value: "Pune, Maharashtra, India", type: "text" },
    { label: "Timezone", value: "IST (UTC+5:30)", type: "text" },
    { label: "Data Refresh Rate", value: "4 seconds", type: "text" },
  ]},
  { group: "AI Agent Settings", items: [
    { label: "Prediction Confidence Threshold", value: "85%", type: "text" },
    { label: "Auto-Schedule Maintenance", value: "Enabled", type: "toggle" },
    { label: "Failure Alert Sensitivity", value: "High", type: "text" },
    { label: "AI Model Version", value: "FactoryGPT-v2.1", type: "text" },
  ]},
  { group: "Notification Settings", items: [
    { label: "Critical Alert Notifications", value: "Enabled", type: "toggle" },
    { label: "Email Reports", value: "Daily", type: "text" },
    { label: "Popup Notifications", value: "Enabled", type: "toggle" },
  ]},
];

export default function SettingsPage() {
  return (
    <section className="maintenance-section" style={{ marginTop: 0 }}>
      {settings.map((group) => (
        <div key={group.group} className="maintenance-card" style={{ marginBottom: 24 }}>
          <h2>⚙ {group.group}</h2>
          <table>
            <thead>
              <tr>
                <th>Setting</th>
                <th>Current Value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td>
                    <span className="priority low">{item.value}</span>
                  </td>
                  <td>
                    <button>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
