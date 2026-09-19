"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Worker {
  id: string;
  name: string;
  skills: string[];
  certifications: string[];
  zone: "A" | "B" | "W";
  shift: "A" | "B" | "C";
  status: "available" | "moving" | "on_task" | "verifying" | "off_shift";
  workload: number;
  supervisorId?: string;
  avatar: string;
  experienceYears: number;
  currentMissionId?: string;
  currentTarget?: string;
}

export function useWorkers(intervalMs = 5000) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/workers", { cache: "no-store" });
      const json = await res.json();
      if (cancelledRef.current) return;
      if (json?.ok) setWorkers(json.workers || []);
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    fetchAll();
    const id = setInterval(fetchAll, intervalMs);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, [fetchAll, intervalMs]);

  return { workers, loading, refresh: fetchAll };
}
