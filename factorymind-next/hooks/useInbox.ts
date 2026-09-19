"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface InboxMessage {
  id: string;
  supervisorId: string;
  from: "agent" | "operator" | "system";
  fromName?: string;
  type: "alert" | "report" | "task";
  severity: "info" | "warn" | "crit";
  machineCode?: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  resolvedAt?: string;
}

/**
 * Poll the inbox for a given supervisor every `intervalMs` (default 8s).
 * Returns messages + unread count + mutation helpers.
 */
export function useInbox(supervisorId?: string, intervalMs = 8000) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);

  const fetchInbox = useCallback(async () => {
    if (!supervisorId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/inbox?supervisorId=${encodeURIComponent(supervisorId)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (cancelledRef.current) return;
      if (json?.ok) {
        setMessages(json.messages || []);
        setUnreadCount(json.unreadCount || 0);
      }
    } catch {
      /* swallow — inbox is best-effort */
    } finally {
      setLoading(false);
    }
  }, [supervisorId]);

  useEffect(() => {
    cancelledRef.current = false;
    fetchInbox();
    const id = setInterval(fetchInbox, intervalMs);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, [fetchInbox, intervalMs]);

  const markRead = async (msgId: string) => {
    await fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msgId, read: true }),
    });
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, read: true } : m)));
    setUnreadCount((n) => Math.max(0, n - 1));
  };

  const markAllRead = async () => {
    const unread = messages.filter((m) => !m.read);
    await Promise.all(
      unread.map((m) =>
        fetch("/api/inbox", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: m.id, read: true }),
        })
      )
    );
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    setUnreadCount(0);
  };

  const resolve = async (msgId: string) => {
    await fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msgId, resolved: true, read: true }),
    });
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, resolvedAt: new Date().toISOString(), read: true } : m))
    );
  };

  const remove = async (msgId: string) => {
    await fetch(`/api/inbox?id=${encodeURIComponent(msgId)}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  return { messages, unreadCount, loading, refresh: fetchInbox, markRead, markAllRead, resolve, remove };
}
