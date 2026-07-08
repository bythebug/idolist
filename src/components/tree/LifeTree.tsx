"use client";

import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus } from "lucide-react";
import { useStore } from "@/store";
import { selectVisibleNodes } from "@/store/selectors";
import { TreeNode } from "./TreeNode";

export function LifeTree() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { visibleNodes, focusedId, addNode, setFocused, setEditing } =
    useStore((s) => ({
      visibleNodes: selectVisibleNodes(
        s.nodes,
        s.rootIds,
        s.collapsedIds,
        s.view
      ),
      focusedId: s.focusedId,
      addNode: s.addNode,
      setFocused: s.setFocused,
      setEditing: s.setEditing,
    }));

  const rowVirtualizer = useVirtualizer({
    count: visibleNodes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  // Scroll focused node into view
  useEffect(() => {
    if (!focusedId) return;
    const idx = visibleNodes.findIndex((n) => n.id === focusedId);
    if (idx !== -1) {
      rowVirtualizer.scrollToIndex(idx, { behavior: "smooth" });
    }
  }, [focusedId, visibleNodes, rowVirtualizer]);

  function handleAddRoot() {
    const newId = addNode(null);
    setFocused(newId);
    setEditing(newId);
  }

  if (visibleNodes.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "var(--text-muted)",
        }}
      >
        <p style={{ fontSize: 15, margin: 0 }}>Your life tree is empty.</p>
        <button
          onClick={handleAddRoot}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        >
          <Plus size={14} />
          Add your first area
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Tree header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          Life
        </h1>
        <button
          onClick={handleAddRoot}
          title="Add area (root node)"
          aria-label="Add root node"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            color: "var(--text-secondary)",
            fontFamily: "inherit",
          }}
        >
          <Plus size={12} />
          Add area
        </button>
      </div>

      {/* Virtualized tree */}
      <div
        ref={scrollRef}
        role="tree"
        aria-label="Life tree"
        style={{
          flex: 1,
          overflow: "auto",
          paddingTop: 4,
          paddingBottom: 40,
        }}
      >
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const vnode = visibleNodes[virtualItem.index];
            return (
              <div
                key={vnode.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: virtualItem.size,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <TreeNode id={vnode.id} depth={vnode.depth} />
              </div>
            );
          })}
        </div>
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
