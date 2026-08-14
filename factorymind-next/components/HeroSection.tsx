"use client";

import { useState, useEffect, useRef } from "react";

export default function HeroSection() {
  const [health, setHealth] = useState(96);
  const digitalTwinRef = useRef<HTMLElement | null>(null);
  const aiSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    digitalTwinRef.current = document.querySelector(".digital-twin-section");
    aiSectionRef.current = document.querySelector(".ai-section");
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setHealth((prev) => {
        let next = prev + Math.floor(Math.random() * 3) - 1;
        if (next > 99) next = 99;
        if (next < 91) next = 91;
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const scrollTo = (ref: React.MutableRefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <div>
          <h2>Smart Factory Intelligence Dashboard</h2>
          <p>
            Monitor every machine in real time using Digital Twin, Predictive
            Maintenance and Agentic AI.
          </p>
          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() => scrollTo(digitalTwinRef)}
            >
              Open Digital Twin
            </button>
            <button
              className="secondary-btn"
              onClick={() => scrollTo(aiSectionRef)}
            >
              AI Insights
            </button>
          </div>
        </div>
        <div className="hero-status">
          <div className="status-circle">
            <h1>{health}%</h1>
            <p>Factory Health</p>
          </div>
        </div>
      </div>
    </section>
  );
}
