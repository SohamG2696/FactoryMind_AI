"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faSliders,
  faBell,
  faShieldHalved,
  faLock,
  faCircleCheck,
  faFloppyDisk,
  faPencil,
} from "@fortawesome/free-solid-svg-icons";

interface SettingItem {
  id: string;
  label: string;
  value: string;
  minRole: "ADMIN" | "SUPERVISOR";
  description: string;
}

const initialSettings: { group: string; icon: any; items: SettingItem[] }[] = [
  {
    group: "Factory Infrastructure & Core",
    icon: faGear,
    items: [
      { id: "cfg-name", label: "Factory Name", value: "FactoryMind AI Plant-01", minRole: "ADMIN", description: "Global plant identifier across all telemetry streams" },
      { id: "cfg-loc", label: "Location", value: "Pune, Maharashtra, India", minRole: "ADMIN", description: "Physical site and time zone synchronizer" },
      { id: "cfg-tz", label: "Timezone", value: "IST (UTC+5:30)", minRole: "ADMIN", description: "Operational telemetry timestamp standard" },
      { id: "cfg-rate", label: "Sensor Poll Frequency", value: "4 seconds", minRole: "ADMIN", description: "High-frequency IoT sensor telemetry ingestion rate" },
    ],
  },
  {
    group: "AI Agent & Inference Thresholds",
    icon: faSliders,
    items: [
      { id: "ai-conf", label: "Prediction Confidence Threshold", value: "85%", minRole: "ADMIN", description: "Minimum probability required for autonomous agent actions" },
      { id: "ai-auto", label: "Auto-Schedule Work Orders", value: "Enabled", minRole: "ADMIN", description: "Automated work order creation on predictive failure detection" },
      { id: "ai-sens", label: "Failure Alert Sensitivity", value: "High", minRole: "SUPERVISOR", description: "Threshold for firing critical operator notifications" },
      { id: "ai-ver", label: "Active Inference Engine", value: "LightGBM + Random Forest v2.1", minRole: "ADMIN", description: "Dual-model predictive maintenance pipeline" },
    ],
  },
  {
    group: "Shift & Alert Dispatch Configuration",
    icon: faBell,
    items: [
      { id: "nt-crit", label: "Critical Alarm Audio-Visual Alert", value: "Enabled", minRole: "SUPERVISOR", description: "Floor sound and popup alerts for RUL < 10 hrs" },
      { id: "nt-rep", label: "Shift Summary Export Interval", value: "Per 8-Hour Shift", minRole: "SUPERVISOR", description: "Automated report compilation schedule" },
      { id: "nt-pop", label: "Real-Time WebSocket Notifications", value: "Active", minRole: "SUPERVISOR", description: "Live telemetry stream updates" },
    ],
  },
];

export default function SettingsPage() {
  const { role: currentRole } = useAuth();
  const [settingsData, setSettingsData] = useState(initialSettings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isAdmin = currentRole === "ADMIN";
  const isSupervisor = currentRole === "SUPERVISOR";

  const handleEdit = (id: string, currentValue: string) => {
    setEditingId(id);
    setTempValue(currentValue);
  };

  const handleSave = (groupIdx: number, itemId: string) => {
    const updated = [...settingsData];
    const item = updated[groupIdx].items.find((i) => i.id === itemId);
    if (item) {
      item.value = tempValue;
      setSettingsData(updated);
    }
    setEditingId(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="settings-page-container">
      {/* Role Badge Banner */}
      <div className="role-notice-banner settings-banner">
        <FontAwesomeIcon icon={faShieldHalved} />
        <div>
          <strong>Role Clearance: {currentRole}</strong>
          <span style={{ display: "block", fontSize: 12, opacity: 0.85, marginTop: 2 }}>
            {isAdmin
              ? "Full configuration clearance. You can modify factory parameters, AI confidence thresholds, and system settings."
              : isSupervisor
              ? "Supervisor clearance. You can modify shift and notification parameters. Core factory parameters require Administrator privilege."
              : "Read-only operator mode. Settings adjustments are locked."}
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="save-success-banner">
          <FontAwesomeIcon icon={faCircleCheck} />
          Configuration updated and deployed across factory nodes.
        </div>
      )}

      <section className="maintenance-section" style={{ marginTop: 0 }}>
        {settingsData.map((group, groupIdx) => (
          <div key={group.group} className="maintenance-card" style={{ marginBottom: 24 }}>
            <div className="settings-card-header">
              <h2>
                <FontAwesomeIcon icon={group.icon} style={{ marginRight: 10, fontSize: 18, color: "#A78BFA" }} />
                {group.group}
              </h2>
            </div>

            <table className="settings-table">
              <thead>
                <tr>
                  <th>Configuration Parameter</th>
                  <th>Current Setting</th>
                  <th>Required Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => {
                  const canEdit =
                    isAdmin ||
                    (isSupervisor && item.minRole === "SUPERVISOR");

                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="setting-label-block">
                          <strong>{item.label}</strong>
                          <span>{item.description}</span>
                        </div>
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="setting-inline-input"
                            autoFocus
                          />
                        ) : (
                          <span className="priority low">{item.value}</span>
                        )}
                      </td>

                      <td>
                        <span className={`role-badge-pill role-badge-${item.minRole.toLowerCase()}`}>
                          {item.minRole}
                        </span>
                      </td>

                      <td>
                        {canEdit ? (
                          isEditing ? (
                            <button
                              className="btn-save-setting"
                              onClick={() => handleSave(groupIdx, item.id)}
                            >
                              <FontAwesomeIcon icon={faFloppyDisk} /> Save
                            </button>
                          ) : (
                            <button
                              className="btn-edit-setting"
                              onClick={() => handleEdit(item.id, item.value)}
                            >
                              <FontAwesomeIcon icon={faPencil} /> Edit
                            </button>
                          )
                        ) : (
                          <span className="locked-action-text" title="Requires Administrator clearance">
                            <FontAwesomeIcon icon={faLock} style={{ marginRight: 5 }} />
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </div>
  );
}

