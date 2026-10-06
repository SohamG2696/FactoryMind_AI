"use client";

import { useEffect, useState } from "react";

export interface MlHealth {
  /** null until the first /api/health response arrives. */
  online: boolean | null;
  source: "fastapi" | "python_cli" | "offline" | null;
  /** Training-time hold-out accuracy reported by ml_service.py (0..1). */
  accuracy: number | null;
  evaluationMethod: string | null;
  pmModel: string | null;
  factoryModel: string | null;
}

const INITIAL: MlHealth = {
  online: null,
  source: null,
  accuracy: null,
  evaluationMethod: null,
  pmModel: null,
  factoryModel: null,
};

/** Polls /api/health so the UI shows whether real model inference is live. */
export function useMlHealth(intervalMs = 30000): MlHealth {
  const [health, setHealth] = useState<MlHealth>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/health");
        const j = await res.json();
        if (cancelled) return;
        setHealth({
          online: !!j.online,
          source: j.source ?? null,
          accuracy: j.data?.evaluation?.accuracy ?? null,
          evaluationMethod: j.data?.evaluation?.method ?? null,
          pmModel: j.data?.models?.best_pm_model?.type ?? null,
          factoryModel: j.data?.models?.factory_model?.type ?? null,
        });
      } catch {
        if (!cancelled) setHealth({ ...INITIAL, online: false, source: "offline" });
      }
    };
    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return health;
}
