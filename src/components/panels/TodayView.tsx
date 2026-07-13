"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectTodayNodes } from "@/store/selectors";
import { TreeNode } from "@/components/tree/TreeNode";

export function TodayView() {
  const { nodes, todayIds } = useStore(
    useShallow((s) => ({ nodes: s.nodes, todayIds: s.todayIds }))
  );

  const todayNodes = selectTodayNodes(nodes, todayIds);
  const completed = todayNodes.filter((n) => n.completed).length;
  const total = todayNodes.length;
  const progress = total > 0 ? completed / total : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
          background: "var(--glass-toolbar-bg)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <h1 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>Today</h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
          {format(new Date(), "EEEE, MMMM d")}
          {total > 0 && ` · ${completed} of ${total} done`}
        </p>

        {total > 0 && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                flex: 1,
                height: 3,
                background: "var(--bg-node-hover)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress * 100}%`,
                  background: progress === 1 ? "var(--success)" : "var(--accent)",
                  borderRadius: 99,
                  transition: "width 400ms ease, background 300ms ease",
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, minWidth: 28, textAlign: "right" }}>
              {Math.round(progress * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div style={{ flex: 1, overflow: "auto", paddingTop: 4, paddingBottom: 40 }}>
        {todayNodes.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            No tasks for today. Press ⌘T on any task to add it.
          </div>
        ) : (
          todayNodes.map((node) => (
            <TreeNode key={node.id} id={node.id} depth={0} />
          ))
        )}
      </div>

      <style>{`
        .tree-node-row:hover .node-actions { opacity: 1 !important; }
        .tree-node-row:hover { background: var(--bg-node-hover) !important; }
      `}</style>
    </div>
  );
}
