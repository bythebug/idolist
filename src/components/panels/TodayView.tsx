"use client";

import { format } from "date-fns";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectTodayNodes } from "@/store/selectors";
import { TreeNode } from "@/components/tree/TreeNode";

export function TodayView() {
  const { nodes, todayIds } = useStore(useShallow((s) => ({
    nodes: s.nodes,
    todayIds: s.todayIds,
  })));

  const todayNodes = selectTodayNodes(nodes, todayIds);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 16px 8px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            margin: 0,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Today
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            margin: "2px 0 0",
          }}
        >
          {format(new Date(), "EEEE, MMMM d")} · {todayNodes.length} tasks
        </p>
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
        .tree-node-row:hover .node-actions {
          opacity: 1 !important;
        }
        .tree-node-row:hover {
          background: var(--bg-node-hover) !important;
        }
      `}</style>
    </div>
  );
}
