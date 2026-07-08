"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { getParentChain } from "@/lib/tree";
import type { LifeNode } from "@/types";

interface ItemProps {
  node: LifeNode;
  nodes: Record<string, LifeNode>;
}

function CompletedItem({ node, nodes }: ItemProps) {
  const { setSelected, setFocused, toggleComplete } = useStore(
    useShallow((s) => ({
      setSelected: s.setSelected,
      setFocused: s.setFocused,
      toggleComplete: s.toggleComplete,
    }))
  );

  const parentChain = useMemo(
    () => getParentChain(nodes, node.id),
    [nodes, node.id]
  );

  return (
    <div
      onClick={() => { setSelected(node.id); setFocused(node.id); }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 16px",
        cursor: "pointer",
        borderBottom: "1px solid var(--border-subtle)",
        transition: "background 100ms",
      }}
      className="completed-item"
    >
      {/* Completed icon / uncomplete button */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleComplete(node.id); }}
        title="Mark incomplete"
        aria-label="Mark as incomplete"
        style={{
          flexShrink: 0,
          marginTop: 2,
          width: 16,
          height: 16,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "var(--success)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckCircle2 size={16} />
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            color: "var(--text-completed)",
            textDecoration: "line-through",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.title || "Untitled"}
        </div>
        {parentChain.length > 0 && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {parentChain.map((p) => p.title).join(" › ")}
          </div>
        )}
      </div>

      {/* Completed date + uncomplete hint */}
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {format(new Date(node.updatedAt), "MMM d")}
        </div>
        <div
          className="uncomplete-hint"
          style={{
            display: "none",
            fontSize: 11,
            color: "var(--accent)",
            gap: 3,
            alignItems: "center",
            marginTop: 1,
          }}
        >
          <RotateCcw size={9} /> undo
        </div>
      </div>
    </div>
  );
}

export function CompletedView() {
  const { nodes } = useStore(useShallow((s) => ({ nodes: s.nodes })));

  const completedNodes = useMemo(
    () =>
      Object.values(nodes)
        .filter((n) => n.completed && !n.archived)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [nodes]
  );

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
          Completed
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
          {completedNodes.length} {completedNodes.length === 1 ? "item" : "items"} done
        </p>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {completedNodes.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 8,
              color: "var(--text-muted)",
            }}
          >
            <CheckCircle2 size={28} style={{ opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 13 }}>Nothing completed yet</p>
            <p style={{ margin: 0, fontSize: 12 }}>
              Check off tasks with Space or the checkbox.
            </p>
          </div>
        ) : (
          completedNodes.map((node) => (
            <CompletedItem key={node.id} node={node} nodes={nodes} />
          ))
        )}
      </div>

      <style>{`
        .completed-item:hover { background: var(--bg-node-hover); }
        .completed-item:hover .uncomplete-hint { display: flex !important; }
      `}</style>
    </div>
  );
}
