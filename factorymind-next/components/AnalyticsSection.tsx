"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Tooltip,
} from "chart.js";

Chart.register(
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Tooltip
);

const labels = ["8AM", "10AM", "12PM", "2PM", "4PM", "6PM"];

const charts = [
  { id: "tempChart", label: "🌡 Temperature Trend", data: [65, 67, 69, 72, 70, 68], color: "#ff5252" },
  { id: "rpmChart", label: "⚙ RPM Analysis", data: [1200, 1350, 1450, 1500, 1420, 1380], color: "#ffffff" },
  { id: "energyChart", label: "⚡ Energy Consumption", data: [90, 105, 110, 120, 126, 118], color: "#22C55E" },
  { id: "vibrationChart", label: "📳 Vibration Analysis", data: [20, 25, 30, 45, 35, 28], color: "#FACC15" },
];

function ChartCard({ id, label, data, color }: (typeof charts)[0]) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            borderColor: color,
            backgroundColor: "rgba(0,229,255,0.08)",
            borderWidth: 3,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "white" } },
        },
        scales: {
          x: { ticks: { color: "#ddd" }, grid: { color: "rgba(255,255,255,.08)" } },
          y: { ticks: { color: "#ddd" }, grid: { color: "rgba(255,255,255,.08)" } },
        },
      },
    });
    return () => {
      chartRef.current?.destroy();
    };
  }, [label, data, color]);

  return (
    <div className="chart-card">
      <h3>{label}</h3>
      <canvas id={id} ref={ref} style={{ height: 300 }} />
    </div>
  );
}

export default function AnalyticsSection() {
  return (
    <section className="analytics-section">
      {charts.map((c) => (
        <ChartCard key={c.id} {...c} />
      ))}
    </section>
  );
}
