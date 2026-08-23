import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FactoryMind AI — Agentic Digital Twin Platform",
  description:
    "FactoryMind AI is an agentic digital twin platform for smart factory automation, predictive maintenance, and real-time machine health monitoring.",
  keywords: [
    "digital twin",
    "factory automation",
    "predictive maintenance",
    "IoT",
    "Industry 4.0",
    "AI",
  ],
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

