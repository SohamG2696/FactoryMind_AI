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
  if (typeof document === "undefined") return;
  let container = document.querySelector(".app-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "app-toast-container";
    document.body.appendChild(container);
  }

  const div = document.createElement("div");
  div.className = "app-toast-item";
  
  const span = document.createElement("span");
  span.className = "app-toast-text";
  span.textContent = text;
  
  const closeBtn = document.createElement("button");
  closeBtn.className = "app-toast-close";
  closeBtn.setAttribute("aria-label", "Close notification");
  closeBtn.innerHTML = "&times;";
  
  div.appendChild(span);
  div.appendChild(closeBtn);
  
  const remove = () => {
    div.classList.remove("show");
    setTimeout(() => {
      div.remove();
      if (container && container.children.length === 0) {
        container.remove();
      }
    }, 300);
  };
  
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    remove();
  });
  
  container.appendChild(div);
  setTimeout(() => div.classList.add("show"), 50);
  setTimeout(remove, 4500);
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
