"use client";

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faRobot,
  faCircleCheck,
  faCircleNodes,
  faTriangleExclamation,
  faWrench,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const WELCOME: Message = {
  role: "assistant",
  text: `### 🤖 FactoryMind AI Assistant online\n\nI am your **Preventive Maintenance & Safety Advisor** powered by Groq.\n\nAsk me about machine precautions, thermal limits, lubrication checklists, or vibration diagnostics. Or click one of the quick scenarios below:`,
};

const SUGGESTIONS = [
  { label: "🔥 CNC Overheating Limit", text: "What immediate precautions and preventive measures should be taken if CNC-07 spindle temperature exceeds 85°C?" },
  { label: "⚙️ Conveyor Belt Slip", text: "What early warning signs and preventive maintenance steps should be followed for high-friction conveyor belt motor slippage?" },
  { label: "💧 Hydraulic Arm Leak", text: "What immediate actions and precautions prevent pressure drop and seal blowout in hydraulic robotic arms?" },
  { label: "⚡ Spindle Vibration Peaks", text: "Give me the checklist for vibration peaks exceeding 4.8 mm/s in machine bearings to prevent spindle seizure." },
];

export default function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: queryText }]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: queryText }],
        }),
      });

      if (!res.ok) {
        let errMsg = `Server returned status ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errData.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "No response received. Please check connection.";

      setMessages((prev) => [...prev, { role: "assistant", text: content }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `⚠️ **Precaution Diagnostic Error**\n\n${err.message || "Failed to reach the FactoryMind AI server. Please make sure the Next.js and python dev servers are running and healthy."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery(input);
    }
  };

  // Helper to parse markdown-like bold tags, line breaks, warnings, and headers
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let isWarning = line.includes("🔴") || line.includes("⚠️") || line.includes("WARNING") || line.includes("IMMEDIATE") || line.includes("Immediate");
      let isAction = line.includes("🔧") || line.includes("PREVENTIVE") || line.includes("Measure") || line.includes("Action");

      // Replace bold markdown (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} style={{ color: "#fff", fontWeight: 700 }}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : line;

      // Render headers
      if (line.startsWith("###")) {
        return (
          <h4 key={idx} style={{ color: "#fff", fontSize: "14px", fontWeight: 700, margin: "14px 0 6px 0", letterSpacing: "0.02em" }}>
            {content}
          </h4>
        );
      }

      // Render lists
      if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
        // Strip out bullet symbol
        const cleanContent = typeof content === "string" ? content.replace(/^[-•*]\s*/, "") : content;
        return (
          <li key={idx} style={{ marginLeft: "16px", marginBottom: "4px", listStyleType: "disc", color: "#cbd5e1", lineHeight: "1.5", fontSize: "13px" }}>
            {cleanContent}
          </li>
        );
      }

      // Warning paragraph card formatting
      if (isWarning) {
        return (
          <div key={idx} style={{ background: "rgba(239, 68, 68, 0.08)", borderLeft: "3px solid #ef4444", padding: "8px 12px", borderRadius: "0 8px 8px 0", margin: "8px 0", fontSize: "13px", color: "#fca5a5" }}>
            {content}
          </div>
        );
      }

      // Action/Preventive section card formatting
      if (isAction) {
        return (
          <div key={idx} style={{ background: "rgba(56, 189, 248, 0.08)", borderLeft: "3px solid #38bdf8", padding: "8px 12px", borderRadius: "0 8px 8px 0", margin: "8px 0", fontSize: "13px", color: "#bae6fd" }}>
            {content}
          </div>
        );
      }

      if (!line.trim()) return <div key={idx} style={{ height: "6px" }} />;

      return (
        <p key={idx} style={{ margin: "0 0 6px 0", lineHeight: "1.55", fontSize: "13px", color: "#cbd5e1" }}>
          {content}
        </p>
      );
    });
  };

  return (
    <section className="chat-section" style={{ marginTop: 0 }}>
      <div className="chat-container">
        {/* Chat Header with Status Pill */}
        <div className="chat-header">
          <div className="chat-title-info">
            <FontAwesomeIcon icon={faRobot} className="chat-title-robot" />
            <span>Preventive Precaution Assistant</span>
          </div>
          <div className="chat-status-pill">
            <span className="chat-status-dot pulse" />
            <span>Active Inference</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="chat-body" ref={bodyRef}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-message-row ${m.role === "user" ? "user-row" : "ai-row"}`}
            >
              <div className="message-sender-avatar">
                {m.role === "user" ? "👤" : "🤖"}
              </div>
              <div className={`message-bubble ${m.role === "user" ? "user-bubble" : "ai-bubble"}`}>
                {renderMessageContent(m.text)}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="chat-message-row ai-row">
              <div className="message-sender-avatar">🤖</div>
              <div className="message-bubble ai-bubble loading-bubble">
                <span className="chat-loading-dot" />
                <span className="chat-loading-dot" />
                <span className="chat-loading-dot" />
                <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "10px" }}>
                  FactoryMind AI is formulating precaution guidance...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="chat-suggestions-container">
          <span className="suggestions-label">Quick Scenarios:</span>
          <div className="suggestions-scroll">
            {SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                className="suggestion-chip"
                onClick={() => sendQuery(chip.text)}
                disabled={loading}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="chat-input">
          <textarea
            rows={1}
            placeholder="Ask about machine safety, oil pressure drop, bearing temperature..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button
            className="send-button"
            onClick={() => sendQuery(input)}
            disabled={loading || !input.trim()}
            title="Send precaution query"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>
    </section>
  );
}
