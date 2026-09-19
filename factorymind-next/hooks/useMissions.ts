"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Mission {
  id: string;
  machineCode: string;
  type: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "detect" | "diagnose" | "plan" | "assign" | "execute" | "verify" | "complete" | "cancelled";
  requiredSkills: string[];
  requiredCertifications: string[];
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  agentName?: string;
  agentReasoning?: string;
  mlPrediction?: { failureProbability?: number; riskLevel?: string; confidence?: number };
  autonomyLevel: "SAFE" | "APPROVAL_REQUIRED" | "HUMAN_REQUIRED";
  expectedImpact?: { downtimeMinutes?: number; productionLossUnits?: number };
  supervisorId?: string;
  createdAt: string;
  updatedAt?: string;
  timeline: { at: string; status: string; note?: string }[];
}

export function useMissions(opts?: { openOnly?: boolean; intervalMs?: number }) {
  const { openOnly = false, intervalMs = 6000 } = opts || {};
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const q = openOnly ? "?open=1" : "";
      const res = await fetch(`/api/missions${q}`, { cache: "no-store" });
      const json = await res.json();
      if (cancelledRef.current) return;
      if (json?.ok) setMissions(json.missions || []);
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, [openOnly]);

  useEffect(() => {
    cancelledRef.current = false;
    fetchAll();
    const id = setInterval(fetchAll, intervalMs);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, [fetchAll, intervalMs]);

  const updateStatus = async (id: string, status: string, note?: string) => {
    await fetch("/api/missions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patch: { status }, timelineNote: note }),
    });
    fetchAll();
  };

  const reassign = async (missionId: string, workerId: string, reason?: string) => {
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId, workerId, assignedBy: "SUPERVISOR", reason }),
    });
    const json = await res.json();
    fetchAll();
    return json?.ok;
  };

  return { missions, loading, refresh: fetchAll, updateStatus, reassign };
}
