"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Sun, Calendar, X } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectBreadcrumb } from "@/store/selectors";
import { TreeNodeIcon } from "@/components/tree/TreeNodeIcon";
import type { ReminderOption, RepeatOption } from "@/types";

interface Props {
  id: string;
}

const REMINDER_OPTIONS: { value: ReminderOption; label: string }[] = [
  { value: "none", label: "None" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "custom", label: "Custom" },
];

const REPEAT_OPTIONS: { value: RepeatOption; label: string; icon: string }[] = [
  { value: "none",    label: "None",    icon: "—" },
  { value: "daily",   label: "Daily",   icon: "↺" },
  { value: "weekly",  label: "Weekly",  icon: "↺" },
  { value: "monthly", label: "Monthly", icon: "↺" },
];

export function NodeDetails({ id }: Props) {
  const { node, nodes, todayIds, updateNode, addToToday, removeFromToday, setSelected } =
    useStore(useShallow((s) => ({
      node: s.nodes[id],
      nodes: s.nodes,
      todayIds: s.todayIds,
      updateNode: s.updateNode,
      addToToday: s.addToToday,
      removeFromToday: s.removeFromToday,
      setSelected: s.setSelected,
    })));

  const breadcrumb = useMemo(() => selectBreadcrumb(nodes, id), [nodes, id]);

  if (!node) return null;

  const isToday = todayIds.has(id);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            color: "var(--text-muted)",
            overflow: "hidden",
          }}
        >
          {breadcrumb.map((ancestor, i) => (
            <span key={ancestor.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <span>›</span>}
              <span
                style={{ cursor: "pointer", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={ancestor.title}
              >
                {ancestor.title}
              </span>
            </span>
          ))}
        </div>
        <button
          onClick={() => setSelected(null)}
          aria-label="Close panel"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            padding: 4,
            borderRadius: 5,
            display: "flex",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
        {/* Icon + Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <TreeNodeIcon id={id} icon={node.icon} depth={node.parentId ? 1 : 0} type={node.type} />
          <input
            key={id}
            defaultValue={node.title}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (next !== node.title) updateNode(id, { title: next });
            }}
            placeholder="Untitled"
            style={{
              flex: 1,
              fontSize: 18,
              fontWeight: 600,
              fontFamily: "inherit",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              padding: 0,
            }}
          />
        </div>

        {/* Today toggle */}
        <button
          onClick={() => (isToday ? removeFromToday(id) : addToToday(id))}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: isToday ? "var(--accent-subtle)" : "transparent",
            border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 7,
            cursor: "pointer",
            fontSize: 13,
            color: isToday ? "var(--accent)" : "var(--text-secondary)",
            fontFamily: "inherit",
            marginBottom: 16,
          }}
        >
          <Sun size={13} />
          {isToday ? "Remove from Today" : "Add to Today"}
        </button>

        {/* Due date */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Due Date &amp; Time
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="date"
              defaultValue={node.dueDate ?? ""}
              onChange={(e) => updateNode(id, { dueDate: e.target.value || null, dueTime: e.target.value ? node.dueTime : null })}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="time"
              defaultValue={node.dueTime ?? ""}
              disabled={!node.dueDate}
              onChange={(e) => updateNode(id, { dueTime: e.target.value || null })}
              title={!node.dueDate ? "Set a due date first" : ""}
              style={{ ...inputStyle, width: 100, opacity: node.dueDate ? 1 : 0.4, cursor: node.dueDate ? "auto" : "not-allowed" }}
            />
          </div>
        </div>

        {/* Reminder */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Reminder
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {REMINDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateNode(id, { reminder: opt.value })}
                style={{
                  padding: "5px 10px",
                  fontSize: 12,
                  fontFamily: "inherit",
                  background:
                    node.reminder === opt.value
                      ? "var(--accent)"
                      : "var(--bg-sidebar)",
                  color:
                    node.reminder === opt.value ? "white" : "var(--text-secondary)",
                  border: `1px solid ${
                    node.reminder === opt.value
                      ? "var(--accent)"
                      : "var(--border)"
                  }`,
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Repeat */}
        {node.type !== "area" && (
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Repeat
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {REPEAT_OPTIONS.map((opt) => {
                const active = (node.repeat ?? "none") === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateNode(id, { repeat: opt.value })}
                    style={{
                      padding: "5px 10px",
                      fontSize: 12,
                      fontFamily: "inherit",
                      background: active ? "var(--accent)" : "var(--bg-sidebar)",
                      color: active ? "white" : "var(--text-secondary)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {opt.value !== "none" && (
                      <span style={{ fontSize: 11, opacity: 0.8 }}>↺</span>
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {(node.repeat ?? "none") !== "none" && node.lastCompletedAt && (
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 0" }}>
                Last completed {format(new Date(node.lastCompletedAt), "MMM d 'at' h:mm a")}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Notes
          </label>
          <textarea
            key={id}
            defaultValue={node.notes}
            onBlur={(e) => updateNode(id, { notes: e.target.value })}
            placeholder="Add notes..."
            rows={5}
            style={{
              width: "100%",
              fontFamily: "inherit",
              fontSize: 13,
              lineHeight: "1.6",
              background: "var(--bg-sidebar)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 10px",
              color: "var(--text-primary)",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Footer timestamps */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Created {format(new Date(node.createdAt), "MMM d, yyyy")}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Updated {format(new Date(node.updatedAt), "MMM d, h:mm a")}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: 13,
  background: "var(--bg-sidebar)",
  border: "1px solid var(--border)",
  borderRadius: 7,
  padding: "6px 10px",
  color: "var(--text-primary)",
  outline: "none",
};
