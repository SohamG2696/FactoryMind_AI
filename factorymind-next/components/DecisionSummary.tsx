"use client";

export default function DecisionSummary() {
  return (
    <section className="decision-summary">
      <div className="summary-card">
        <h2>📋 Current AI Decision</h2>
        <p>
          ✔ CNC-07 will likely fail within the next <strong>18 hours</strong>.
        </p>
        <p>✔ Bearing replacement is recommended immediately.</p>
        <p>
          ✔ Estimated downtime reduction: <strong>72%</strong>
        </p>
        <p>
          ✔ Estimated maintenance cost saving: <strong>₹2.3 Lakhs</strong>
        </p>
        <p>
          ✔ Production loss prevented: <strong>1,250 Units</strong>
        </p>
        <div className="summary-buttons">
          <button className="primary-btn">Approve Plan</button>
          <button className="secondary-btn">Run Simulation</button>
        </div>
      </div>
    </section>
  );
}
