"use client";

export default function OverviewSection() {
  return (
    <section className="overview">
      <div className="overview-card">
        <h3>Today&apos;s Production</h3>
        <h1>18,450</h1>
        <p>Units Produced</p>
      </div>

      <div className="overview-card">
        <h3>Maintenance Saved</h3>
        <h1>₹2.8 Lakh</h1>
        <p>Estimated Cost Reduction</p>
      </div>

      <div className="overview-card">
        <h3>Average Machine Efficiency</h3>
        <h1>92.4%</h1>
        <p>Across All Departments</p>
      </div>

      <div className="overview-card">
        <h3>AI Recommendations</h3>
        <h1>18</h1>
        <p>Generated Today</p>
      </div>
    </section>
  );
}
