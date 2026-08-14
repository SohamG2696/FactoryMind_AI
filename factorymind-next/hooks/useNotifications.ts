import { useEffect } from "react";

const NOTIFICATIONS = [
  "⚠ CNC-07 Temperature Increased",
  "✔ Robot Arm Calibration Completed",
  "⚡ Energy Consumption Increased",
  "🤖 AI Generated Maintenance Plan",
  "📦 Warehouse Inventory Updated",
  "🔧 Conveyor Belt Requires Inspection",
];

function showNotification(text: string) {
  const div = document.createElement("div");
  div.className = "popup";
  div.innerHTML = text;
  document.body.appendChild(div);
  setTimeout(() => div.classList.add("show"), 100);
  setTimeout(() => {
    div.classList.remove("show");
    setTimeout(() => div.remove(), 400);
  }, 3500);
}

export function useNotifications() {
  useEffect(() => {
    const id = setInterval(() => {
      showNotification(
        NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)]
      );
    }, 9000);
    return () => clearInterval(id);
  }, []);
}
