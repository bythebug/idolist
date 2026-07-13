"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectUpcomingNodes } from "@idolist/core";
import { TreeNodeCheckbox } from "@/components/tree/TreeNodeCheckbox";

const GROUP_LABELS: Record<string, string> = {
  overdue:   "Overdue",
  today:     "Today",
  tomorrow:  "Tomorrow",
  thisweek:  "This week",
};

function groupKey(daysUntil: number): string {
  if (daysUntil < 0)  return "overdue";
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  return "thisweek";
}

const GROUP_ORDER = ["overdue", "today", "tomorrow", "thisweek"];

export function UpcomingPanel() {
  const { nodes, toggleComplete, setSelected, setFocused } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      toggleComplete: s.toggleComplete,
      setSelected: s.setSelected,
      setFocused: s.setFocused,
    }))
  );

  const upcoming = useMemo(() => selectUpcomingNodes(nodes), [nodes]);

  // Group by period
  const groups = useMemo(() => {
    const map: Record<string, typeof upcoming> = {};
    for (const item of upcoming) {
      const key = groupKey(item.daysUntil);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [upcoming]);

  if (upcoming.length === 0) return null;

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px 6px",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Clock size={13} style={{ color: "var(--text-muted)" }} />
          Upcoming
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            background: "var(--bg-sidebar)",
            color: "var(--text-muted)",
            padding: "1px 7px",
            borderRadius: 99,
          }}
        >
          {upcoming.length}
        </span>
      </div>

      {/* Groups */}
      <div style={{ maxHeight: 200, overflowY: "auto", paddingBottom: 8 }}>
        {GROUP_ORDER.filter((k) => groups[k]).map((key) => (
          <div key={key}>
            {/* Group label */}
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: key === "overdue" ? "var(--danger, #ef4444)" : "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "4px 14px 2px",
              }}
            >
              {GROUP_LABELS[key]}
            </div>

            {/* Items */}
            {groups[key].map(({ node, daysUntil }) => (
              <div
                key={node.id}
                onClick={() => { setFocused(node.id); setSelected(node.id); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "4px 14px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "var(--bg-node-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <TreeNodeCheckbox
                    completed={node.completed}
                    onToggle={() => toggleComplete(node.id)}
                  />
                </div>

                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: node.completed ? "var(--text-completed)" : "var(--text-primary)",
                    textDecoration: node.completed ? "line-through" : "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {node.title || "Untitled"}
                </span>

                <span
                  style={{
                    fontSize: 10,
                    flexShrink: 0,
                    color:
                      daysUntil < 0
                        ? "var(--danger, #ef4444)"
                        : daysUntil === 0
                        ? "var(--warning, #f59e0b)"
                        : "var(--text-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {node.dueDate
                    ? format(new Date(node.dueDate), "MMM d")
                    : daysUntil === 0
                    ? "Today"
                    : "Tomorrow"}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
