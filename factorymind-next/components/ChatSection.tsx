"use client";

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

function generateReply(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("temperature"))
    return "Current factory temperature is within operational range except CNC-07, which is reporting higher than normal values.";
  if (msg.includes("machine"))
    return "24 out of 26 machines are operational. CNC-07 requires maintenance and Conveyor Belt requires inspection.";
  if (msg.includes("health"))
    return "Overall factory health is excellent at approximately 96%. One critical machine has been identified.";
  if (msg.includes("prediction"))
    return "The AI predicts a high probability of bearing failure in CNC-07 within the next 18 hours.";
  if (msg.includes("maintenance"))
    return "Maintenance has been scheduled automatically. Engineer A has been assigned to CNC-07.";
  if (msg.includes("energy"))
    return "Current energy usage is approximately 126 kWh. Consumption remains within acceptable limits.";
  if (msg.includes("hello") || msg.includes("hi"))
    return "Hello! I'm FactoryMind AI. Ask me about machine health, maintenance, sensors, energy, or predictions.";
  return "I understand your request. Based on current factory telemetry, no additional critical issues are detected.";
}

interface Message {
  role: "user" | "ai";
  text: string;
}

const WELCOME: Message = {
  role: "ai",
  text: `Hello 👋\n\nI am your Agentic AI Assistant.\n\nAsk me about:\n• Machine Health\n• Failure Prediction\n• RUL\n• Factory Status\n• Maintenance Plan`,
};

export default function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: generateReply(msg) },
      ]);
    }, 800);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") send();
  };

  return (
    <section className="chat-section">
      <div className="chat-container">
        <div className="chat-header">🤖 FactoryMind AI Assistant</div>
        <div className="chat-body" id="chatBody" ref={bodyRef}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "user-message" : "ai-message"}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            id="chatInput"
            type="text"
            placeholder="Ask your AI Assistant..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKey}
          />
          <button id="sendBtn" onClick={send}>
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>
    </section>
  );
}
