"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Archive, ArchiveRestore } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { getParentChain } from "@/lib/tree";
import type { LifeNode } from "@/types";

interface ItemProps {
  node: LifeNode;
  nodes: Record<string, LifeNode>;
}

function ArchiveItem({ node, nodes }: ItemProps) {
  const { setSelected, setFocused, updateNode } = useStore(
    useShallow((s) => ({
      setSelected: s.setSelected,
      setFocused: s.setFocused,
      updateNode: s.updateNode,
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
      className="archive-item"
    >
      {/* Archive icon */}
      <div
        style={{
          flexShrink: 0,
          marginTop: 2,
          color: "var(--text-muted)",
          opacity: 0.6,
        }}
      >
        <Archive size={14} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
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
              opacity: 0.7,
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

      {/* Date + restore */}
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.7 }}>
          {format(new Date(node.updatedAt), "MMM d")}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateNode(node.id, { archived: false });
          }}
          title="Restore from archive"
          className="restore-btn"
          style={{
            display: "none",
            alignItems: "center",
            gap: 3,
            fontSize: 11,
            color: "var(--accent)",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: 2,
          }}
        >
          <ArchiveRestore size={9} /> restore
        </button>
      </div>
    </div>
  );
}

export function ArchiveView() {
  const { nodes } = useStore(useShallow((s) => ({ nodes: s.nodes })));

  const archivedNodes = useMemo(
    () =>
      Object.values(nodes)
        .filter((n) => n.archived)
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
          Archive
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
          {archivedNodes.length} archived {archivedNodes.length === 1 ? "item" : "items"}
        </p>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {archivedNodes.length === 0 ? (
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
            <Archive size={28} style={{ opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 13 }}>Archive is empty</p>
            <p style={{ margin: 0, fontSize: 12 }}>
              Archive a node from its options menu (···).
            </p>
          </div>
        ) : (
          archivedNodes.map((node) => (
            <ArchiveItem key={node.id} node={node} nodes={nodes} />
          ))
        )}
      </div>

      <style>{`
        .archive-item:hover { background: var(--bg-node-hover); }
        .archive-item:hover .restore-btn { display: flex !important; }
      `}</style>
    </div>
  );
}
