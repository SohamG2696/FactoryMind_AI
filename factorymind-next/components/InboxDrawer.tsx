"use client";

import { useInbox, InboxMessage } from "@/hooks/useInbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faEnvelope,
  faEnvelopeOpen,
  faCircleCheck,
  faTrash,
  faTriangleExclamation,
  faInbox,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  open: boolean;
  onClose: () => void;
  supervisorId?: string;
  supervisorName?: string;
}

const SEVERITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  info: { color: "#4A6D8C", bg: "rgba(74,109,140,0.10)", label: "INFO" },
  warn: { color: "#C87D1F", bg: "rgba(200,125,31,0.12)", label: "WARN" },
  crit: { color: "#B23A3A", bg: "rgba(178,58,58,0.12)", label: "CRIT" },
};

const TYPE_ICON: Record<string, string> = {
  alert: "⚠",
  report: "📊",
  task: "🔧",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function MessageRow({
  m,
  onRead,
  onResolve,
  onDelete,
}: {
  m: InboxMessage;
  onRead: () => void;
  onResolve: () => void;
  onDelete: () => void;
}) {
  const sev = SEVERITY_STYLE[m.severity] || SEVERITY_STYLE.info;
  const isResolved = !!m.resolvedAt;

  return (
    <div className={`inbox-msg ${m.read ? "read" : "unread"} ${isResolved ? "resolved" : ""}`}>
      <div className="inbox-msg-head">
        <div className="inbox-msg-title-row">
          <span className="inbox-msg-icon">{TYPE_ICON[m.type] || "📨"}</span>
          <span className="inbox-msg-title">{m.title}</span>
          {!m.read && <span className="inbox-unread-dot" />}
        </div>
        <span
          className="inbox-msg-sev"
          style={{ color: sev.color, background: sev.bg, borderColor: sev.color }}
        >
          {sev.label}
        </span>
      </div>

      <div className="inbox-msg-meta">
        <span>
          <FontAwesomeIcon icon={faRobot} style={{ marginRight: 4, opacity: 0.6 }} />
          {m.fromName || m.from}
        </span>
        {m.machineCode && <span className="inbox-msg-chip">{m.machineCode}</span>}
        <span className="inbox-msg-time">{timeAgo(m.createdAt)}</span>
      </div>

      <div className="inbox-msg-body">{m.body}</div>

      <div className="inbox-msg-actions">
        {!m.read && (
          <button className="inbox-btn" onClick={onRead}>
            <FontAwesomeIcon icon={faEnvelopeOpen} /> Mark read
          </button>
        )}
        {!isResolved && (
          <button className="inbox-btn ok" onClick={onResolve}>
            <FontAwesomeIcon icon={faCircleCheck} /> Resolve
          </button>
        )}
        {isResolved && (
          <span className="inbox-resolved-tag">
            <FontAwesomeIcon icon={faCircleCheck} /> Resolved
          </span>
        )}
        <button className="inbox-btn danger" onClick={onDelete}>
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
}

export default function InboxDrawer({ open, onClose, supervisorId, supervisorName }: Props) {
  const { messages, unreadCount, markRead, markAllRead, resolve, remove } = useInbox(supervisorId);

  if (!open) return null;

  return (
    <>
      <div className="inbox-backdrop" onClick={onClose} />
      <aside className="inbox-drawer" role="dialog" aria-label="Supervisor inbox">
        <header className="inbox-header">
          <div>
            <div className="inbox-header-eyebrow">SUPERVISOR INBOX</div>
            <div className="inbox-header-name">
              <FontAwesomeIcon icon={faInbox} style={{ marginRight: 8, color: "var(--primary)" }} />
              {supervisorName || "Inbox"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {unreadCount > 0 && (
              <button className="inbox-btn" onClick={markAllRead}>
                Mark all read ({unreadCount})
              </button>
            )}
            <button className="inbox-close" onClick={onClose} aria-label="Close inbox">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </header>

        <div className="inbox-summary">
          <div className="inbox-stat">
            <span className="inbox-stat-val">{unreadCount}</span>
            <span className="inbox-stat-lbl">Unread</span>
          </div>
          <div className="inbox-stat">
            <span className="inbox-stat-val">
              {messages.filter((m) => m.severity === "crit").length}
            </span>
            <span className="inbox-stat-lbl">Critical</span>
          </div>
          <div className="inbox-stat">
            <span className="inbox-stat-val">{messages.length}</span>
            <span className="inbox-stat-lbl">Total</span>
          </div>
        </div>

        <div className="inbox-list">
          {!supervisorId && (
            <div className="inbox-empty">
              <FontAwesomeIcon icon={faTriangleExclamation} /> No supervisor selected — sign in as one to see routed alerts.
            </div>
          )}
          {supervisorId && messages.length === 0 && (
            <div className="inbox-empty">
              <FontAwesomeIcon icon={faEnvelope} /> Inbox empty — Coordinator Agent has nothing to report right now.
            </div>
          )}
          {messages.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              onRead={() => markRead(m.id)}
              onResolve={() => resolve(m.id)}
              onDelete={() => remove(m.id)}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
