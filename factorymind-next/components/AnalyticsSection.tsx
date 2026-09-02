"use client";

import { useEffect, useRef, useState } from "react";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTemperatureHalf,
  faGaugeHigh,
  faBolt,
  faWaveSquare,
  faCalendarDay,
  faArrowTrendUp,
  faCircleDot,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";

// Register Chart.js components
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

type TimeRange = "1h" | "8h" | "24h" | "7d";

interface ChartMetricConfig {
  id: string;
  title: string;
  unit: string;
  icon: typeof faTemperatureHalf;
  color: string;
  fillColor: string;
  currentVal: string;
  avgVal: string;
  peakVal: string;
  statusText: string;
  statusColor: string;
  yMin?: number;
  yMax?: number;
  datasetsByRange: Record<TimeRange, { labels: string[]; data: number[] }>;
}

const METRIC_CHARTS: ChartMetricConfig[] = [
  {
    id: "tempChart",
    title: "Spindle Thermal Dynamics",
    unit: "°C",
    icon: faTemperatureHalf,
    color: "#F87171",
    fillColor: "rgba(248, 113, 113, 0.12)",
    currentVal: "68.4 °C",
    avgVal: "66.2 °C",
    peakVal: "72.8 °C",
    statusText: "Normal (< 75°C)",
    statusColor: "#4ADE80",
    yMin: 55,
    yMax: 80,
    datasetsByRange: {
      "1h": {
        labels: ["10m", "20m", "30m", "40m", "50m", "Now"],
        data: [64.2, 65.8, 67.1, 68.4, 67.9, 68.4],
      },
      "8h": {
        labels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
        data: [62.0, 65.2, 68.4, 72.1, 69.8, 68.4],
      },
      "24h": {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
        data: [58.5, 59.2, 63.8, 71.4, 69.2, 68.4],
      },
      "7d": {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data: [64.5, 66.8, 65.2, 69.4, 71.0, 67.2, 68.4],
      },
    },
  },
  {
    id: "rpmChart",
    title: "Motor & Spindle Velocity",
    unit: "RPM",
    icon: faGaugeHigh,
    color: "#A78BFA",
    fillColor: "rgba(167, 139, 250, 0.12)",
    currentVal: "1,450 RPM",
    avgVal: "1,425 RPM",
    peakVal: "1,520 RPM",
    statusText: "Locked at 98.4%",
    statusColor: "#A78BFA",
    yMin: 1200,
    yMax: 1650,
    datasetsByRange: {
      "1h": {
        labels: ["10m", "20m", "30m", "40m", "50m", "Now"],
        data: [1420, 1445, 1460, 1450, 1455, 1450],
      },
      "8h": {
        labels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
        data: [1380, 1420, 1460, 1500, 1470, 1450],
      },
      "24h": {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
        data: [1250, 1280, 1420, 1480, 1460, 1450],
      },
      "7d": {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data: [1410, 1435, 1450, 1420, 1480, 1460, 1450],
      },
    },
  },
  {
    id: "energyChart",
    title: "Plant Energy & Power Draw",
    unit: "kWh",
    icon: faBolt,
    color: "#4ADE80",
    fillColor: "rgba(74, 222, 128, 0.12)",
    currentVal: "126.4 kWh",
    avgVal: "118.2 kWh",
    peakVal: "138.0 kWh",
    statusText: "Optimal Efficiency",
    statusColor: "#4ADE80",
    yMin: 90,
    yMax: 155,
    datasetsByRange: {
      "1h": {
        labels: ["10m", "20m", "30m", "40m", "50m", "Now"],
        data: [118.0, 122.5, 125.0, 128.4, 126.0, 126.4],
      },
      "8h": {
        labels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
        data: [102.0, 115.0, 128.5, 134.0, 129.2, 126.4],
      },
      "24h": {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
        data: [88.0, 92.4, 118.0, 136.5, 131.0, 126.4],
      },
      "7d": {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data: [114.0, 122.0, 119.5, 126.0, 132.0, 110.0, 126.4],
      },
    },
  },
  {
    id: "vibrationChart",
    title: "Vibration FFT Spectrum (RMS)",
    unit: "mm/s",
    icon: faWaveSquare,
    color: "#FACC15",
    fillColor: "rgba(250, 204, 21, 0.12)",
    currentVal: "2.84 mm/s",
    avgVal: "2.10 mm/s",
    peakVal: "4.85 mm/s (CNC-07)",
    statusText: "Warning on CNC-07",
    statusColor: "#FACC15",
    yMin: 0,
    yMax: 6.0,
    datasetsByRange: {
      "1h": {
        labels: ["10m", "20m", "30m", "40m", "50m", "Now"],
        data: [1.8, 2.1, 2.4, 3.1, 2.9, 2.84],
      },
      "8h": {
        labels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
        data: [1.4, 1.8, 2.2, 3.8, 3.2, 2.84],
      },
      "24h": {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
        data: [1.2, 1.3, 1.9, 4.2, 3.6, 2.84],
      },
      "7d": {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data: [1.6, 1.9, 2.4, 2.8, 3.6, 2.2, 2.84],
      },
    },
  },
];

function AnalyticsChartCard({
  config,
  activeRange,
}: {
  config: ChartMetricConfig;
  activeRange: TimeRange;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const rangeData = config.datasetsByRange[activeRange];
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Linear gradient for area fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, config.color + "33");
    gradient.addColorStop(1, "transparent");

    chartInstanceRef.current = new Chart(canvas, {
      type: "line",
      data: {
        labels: rangeData.labels,
        datasets: [
          {
            label: config.title,
            data: rangeData.data,
            borderColor: config.color,
            backgroundColor: gradient,
            borderWidth: 2.5,
            pointBackgroundColor: config.color,
            pointBorderColor: "#080914",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "#ffffff",
            pointHoverBorderColor: config.color,
            pointHoverBorderWidth: 2,
            tension: 0.38,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#11121F",
            titleColor: "#A1A1B5",
            bodyColor: "#F5F3FF",
            borderColor: "rgba(167, 139, 250, 0.3)",
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y;
                return ` ${config.title}: ${val} ${config.unit}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#6F7085",
              font: {
                family: "'JetBrains Mono', monospace",
                size: 11,
              },
            },
            grid: {
              color: "rgba(39, 40, 58, 0.5)",
            },
            border: {
              display: false,
            },
          },
          y: {
            suggestedMin: config.yMin,
            suggestedMax: config.yMax,
            ticks: {
              color: "#6F7085",
              font: {
                family: "'JetBrains Mono', monospace",
                size: 11,
              },
              callback: (val) => `${val}`,
            },
            grid: {
              color: "rgba(39, 40, 58, 0.5)",
            },
            border: {
              display: false,
            },
          },
        },
      },
    });

    return () => {
      chartInstanceRef.current?.destroy();
    };
  }, [config, activeRange]);

  return (
    <div className="analytics-chart-hud-card">
      <div className="chart-hud-header">
        <div className="chart-hud-title-row">
          <div className="chart-icon-box" style={{ color: config.color, background: config.color + "18" }}>
            <FontAwesomeIcon icon={config.icon} />
          </div>
          <div>
            <h4>{config.title}</h4>
            <span className="chart-unit-badge">{config.unit} TELEMETRY</span>
          </div>
        </div>

        <div className="chart-hud-status" style={{ color: config.statusColor }}>
          <span className="status-spark-dot" style={{ background: config.statusColor }} />
          <span>{config.statusText}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="chart-metrics-row">
        <div className="cm-item">
          <span className="cm-label">LIVE READOUT</span>
          <span className="cm-val" style={{ color: config.color }}>{config.currentVal}</span>
        </div>
        <div className="cm-sep" />
        <div className="cm-item">
          <span className="cm-label">PERIOD AVG</span>
          <span className="cm-val">{config.avgVal}</span>
        </div>
        <div className="cm-sep" />
        <div className="cm-item">
          <span className="cm-label">PEAK EXCURSION</span>
          <span className="cm-val">{config.peakVal}</span>
        </div>
      </div>

      {/* Fixed Responsive Canvas Container */}
      <div className="chart-canvas-wrapper">
        <canvas ref={canvasRef} id={config.id} />
      </div>
    </div>
  );
}

export default function AnalyticsSection() {
  const [activeRange, setActiveRange] = useState<TimeRange>("8h");

  return (
    <section className="analytics-section-hud">
      {/* Top Controls Header */}
      <div className="analytics-header-banner">
        <div className="ah-left">
          <div className="ah-eyebrow">
            <span className="ah-pulse-dot" />
            <span>REAL-TIME SCADA TELEMETRY &amp; TRENDS</span>
          </div>
          <h2>📊 Plant Telemetry &amp; Historical Analytics</h2>
          <p>Sensor Time-Series Analysis · Predictive Trend Modeling</p>
        </div>

        <div className="ah-time-filters">
          <button
            className={`ah-filter-btn ${activeRange === "1h" ? "active" : ""}`}
            onClick={() => setActiveRange("1h")}
          >
            1H Live
          </button>
          <button
            className={`ah-filter-btn ${activeRange === "8h" ? "active" : ""}`}
            onClick={() => setActiveRange("8h")}
          >
            8H Shift
          </button>
          <button
            className={`ah-filter-btn ${activeRange === "24h" ? "active" : ""}`}
            onClick={() => setActiveRange("24h")}
          >
            24 Hours
          </button>
          <button
            className={`ah-filter-btn ${activeRange === "7d" ? "active" : ""}`}
            onClick={() => setActiveRange("7d")}
          >
            7 Days
          </button>
        </div>
      </div>

      {/* 2x2 Grid of Chart Cards */}
      <div className="analytics-grid-hud">
        {METRIC_CHARTS.map((c) => (
          <AnalyticsChartCard key={c.id} config={c} activeRange={activeRange} />
        ))}
      </div>
    </section>
  );
}
