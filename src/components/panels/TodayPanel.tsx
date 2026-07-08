"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Sun, Plus } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectTodayNodes } from "@/store/selectors";
import { TreeNodeCheckbox } from "@/components/tree/TreeNodeCheckbox";

export function TodayPanel({ fillHeight = false }: { fillHeight?: boolean }) {
  const {
    nodes,
    todayIds,
    toggleComplete,
    removeFromToday,
    openCommandPalette,
  } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      todayIds: s.todayIds,
      toggleComplete: s.toggleComplete,
      removeFromToday: s.removeFromToday,
      openCommandPalette: s.openCommandPalette,
    }))
  );

  const todayNodes = useMemo(
    () => selectTodayNodes(nodes, todayIds),
    [nodes, todayIds]
  );

  const today = new Date();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: fillHeight ? 1 : undefined,
        overflow: fillHeight ? "hidden" : undefined,
        borderBottom: fillHeight ? "none" : "1px solid var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px 8px",
        }}
      >
        <div>
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
            <Sun size={13} style={{ color: "var(--warning)" }} />
            Today
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
            {format(today, "EEEE, MMMM d")}
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            background: todayNodes.length > 0 ? "var(--accent-subtle)" : "var(--bg-sidebar)",
            color: todayNodes.length > 0 ? "var(--accent)" : "var(--text-muted)",
            padding: "1px 7px",
            borderRadius: 99,
          }}
        >
          {todayNodes.filter((n) => n.completed).length}/{todayNodes.length}
        </span>
      </div>

      {/* Task list */}
      <div style={{ flex: fillHeight ? 1 : undefined, maxHeight: fillHeight ? undefined : 220, overflowY: "auto" }}>
        {todayNodes.length === 0 ? (
          <div
            style={{
              padding: "8px 14px 12px",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            Nothing planned for today.
          </div>
        ) : (
          todayNodes.map((node) => (
            <div
              key={node.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 14px",
                transition: "background 80ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "var(--bg-node-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              <TreeNodeCheckbox
                completed={node.completed}
                onToggle={() => toggleComplete(node.id)}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: node.completed ? "var(--text-completed)" : "var(--text-primary)",
                  textDecoration: node.completed ? "line-through" : "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {node.title}
              </span>
              <button
                onClick={() => removeFromToday(node.id)}
                aria-label="Remove from today"
                title="Remove from Today"
                style={{
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 0,
                  opacity: 0,
                  transition: "opacity 100ms",
                }}
                className="today-remove-btn"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add task button */}
      <button
        onClick={openCommandPalette}
        style={{
          margin: "4px 14px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          background: "transparent",
          border: "1px dashed var(--border)",
          borderRadius: 7,
          cursor: "pointer",
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "inherit",
          transition: "border-color 150ms, color 150ms",
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget;
          btn.style.borderColor = "var(--accent)";
          btn.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget;
          btn.style.borderColor = "var(--border)";
          btn.style.color = "var(--text-muted)";
        }}
      >
        <Plus size={12} />
        Add task to Today
      </button>

      <style>{`
        .today-remove-btn { opacity: 0 !important; }
        div:hover > .today-remove-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
