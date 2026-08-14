"use client";

export default function MaintenanceSection() {
  return (
    <section className="maintenance-section">
      <div className="maintenance-card">
        <h2>🔧 AI Generated Maintenance Plan</h2>
        <table>
          <thead>
            <tr>
              <th>Machine</th>
              <th>Issue</th>
              <th>Priority</th>
              <th>Engineer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CNC-07</td>
              <td>Bearing Wear</td>
              <td>
                <span className="priority high">High</span>
              </td>
              <td>Engineer A</td>
              <td>
                <button>Schedule</button>
              </td>
            </tr>
            <tr>
              <td>Conveyor</td>
              <td>Belt Alignment</td>
              <td>
                <span className="priority medium">Medium</span>
              </td>
              <td>Engineer B</td>
              <td>
                <button>Assign</button>
              </td>
            </tr>
            <tr>
              <td>Robot Arm</td>
              <td>Calibration</td>
              <td>
                <span className="priority low">Low</span>
              </td>
              <td>Engineer C</td>
              <td>
                <button>Completed</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
