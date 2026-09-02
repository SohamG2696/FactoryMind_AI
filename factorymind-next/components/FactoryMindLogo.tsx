import React from "react";
import Image from "next/image";

interface FactoryMindLogoProps {
  width?: number;
  height?: number;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function FactoryMindLogo({
  width = 34,
  height = 34,
  className = "",
  style = {},
}: FactoryMindLogoProps) {
  return (
    <div
      className={`factorymind-logo-wrap ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        position: "relative",
        flexShrink: 0,
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="FactoryMind AI"
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 2px 8px rgba(167, 139, 250, 0.25))",
        }}
      />
    </div>
  );
}
