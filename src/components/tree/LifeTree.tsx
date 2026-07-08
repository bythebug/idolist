"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectVisibleNodes } from "@/store/selectors";
import { isDescendant } from "@/lib/tree";
import { TreeNode, COL_PROGRESS, COL_TODAY, COL_DUE } from "./TreeNode";
import { TreeDropIndicator } from "./TreeDropIndicator";

interface DragInfo {
  draggingId: string;
  overId: string | null;
  dropPosition: "before" | "after" | "inside" | null;
}

function computeDropTarget(
  nodes: ReturnType<typeof useStore.getState>["nodes"],
  rootIds: string[],
  draggingId: string,
  overId: string,
  dropPosition: "before" | "after" | "inside"
): { newParentId: string | null; newIndex: number } | null {
  const draggingNode = nodes[draggingId];
  const overNode = nodes[overId];
  if (!draggingNode || !overNode) return null;
  if (draggingId === overId) return null;
  if (isDescendant(nodes, draggingId, overId)) return null;

  if (dropPosition === "inside") {
    return { newParentId: overId, newIndex: overNode.childIds.length };
  }

  const newParentId = overNode.parentId;
  const overSiblings = newParentId ? nodes[newParentId]!.childIds : rootIds;
  const overIdx = overSiblings.indexOf(overId);
  if (overIdx === -1) return null;

  // After removing draggingId, if it was in the same list before overId, overId shifts left
  const sameParent = draggingNode.parentId === newParentId;
  const draggingIdx = sameParent
    ? (newParentId ? nodes[newParentId]!.childIds : rootIds).indexOf(draggingId)
    : -1;
  const shift = sameParent && draggingIdx >= 0 && draggingIdx < overIdx ? 1 : 0;

  const newIndex = dropPosition === "before" ? overIdx - shift : overIdx - shift + 1;
  return { newParentId, newIndex };
}

export function LifeTree() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { nodes, rootIds, collapsedIds, view, focusedId, addNode, moveNode, toggleCollapsed, setFocused, setEditing } =
    useStore(useShallow((s) => ({
      nodes: s.nodes,
      rootIds: s.rootIds,
      collapsedIds: s.collapsedIds,
      view: s.view,
      focusedId: s.focusedId,
      addNode: s.addNode,
      moveNode: s.moveNode,
      toggleCollapsed: s.toggleCollapsed,
      setFocused: s.setFocused,
      setEditing: s.setEditing,
    })));

  const visibleNodes = useMemo(
    () => selectVisibleNodes(nodes, rootIds, collapsedIds, view),
    [nodes, rootIds, collapsedIds, view]
  );

  // Local drag state — avoids writing to Zustand on every pointer move
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  // Track last values to skip unnecessary setState calls
  const lastOverId = useRef<string | null>(null);
  const lastDropPos = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const rowVirtualizer = useVirtualizer({
    count: visibleNodes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 40,
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const draggingId = String(event.active.id);
    lastOverId.current = null;
    lastDropPos.current = null;
    setDragInfo({ draggingId, overId: null, dropPosition: null });
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!dragInfo?.draggingId && !event.active.id) return;
    if (!event.over) {
      // Moved off all droppables
      if (lastOverId.current !== null) {
        lastOverId.current = null;
        lastDropPos.current = null;
        setDragInfo((prev) => prev ? { ...prev, overId: null, dropPosition: null } : null);
      }
      return;
    }

    const overId = String(event.over.id);
    const overRect = event.over.rect;
    const translated = event.active.rect.current.translated;
    if (!translated) return;

    // Determine zone: top 30% = before, middle 40% = inside, bottom 30% = after
    const midY = translated.top + translated.height / 2;
    const relY = (midY - overRect.top) / overRect.height;
    const pos: "before" | "inside" | "after" =
      relY < 0.3 ? "before" : relY > 0.7 ? "after" : "inside";

    // Only setState when something actually changes
    if (overId === lastOverId.current && pos === lastDropPos.current) return;
    lastOverId.current = overId;
    lastDropPos.current = pos;

    const draggingId = String(event.active.id);
    setDragInfo({ draggingId, overId, dropPosition: pos });
  }, [dragInfo?.draggingId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const draggingId = String(active.id);
    const overId = over ? String(over.id) : null;
    const dropPosition = dragInfo?.dropPosition ?? null;

    setDragInfo(null);
    lastOverId.current = null;
    lastDropPos.current = null;

    if (!overId || !dropPosition) return;

    const storeState = useStore.getState();
    const target = computeDropTarget(
      storeState.nodes,
      storeState.rootIds,
      draggingId,
      overId,
      dropPosition
    );
    if (!target) return;

    // Expand the drop-inside target if collapsed
    if (dropPosition === "inside" && storeState.collapsedIds.has(overId)) {
      toggleCollapsed(overId);
    }

    moveNode(draggingId, target.newParentId, target.newIndex);
  }, [dragInfo?.dropPosition, moveNode, toggleCollapsed]);

  const handleDragCancel = useCallback(() => {
    setDragInfo(null);
    lastOverId.current = null;
    lastDropPos.current = null;
  }, []);

  const draggingNode = dragInfo?.draggingId ? nodes[dragInfo.draggingId] : null;

  if (visibleNodes.length === 0) {
    return (
      <DndContext sensors={sensors}>
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
      </DndContext>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Tree toolbar */}
        <div
          style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid var(--border-subtle)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                Life
              </h1>
            </div>
            <button
              onClick={handleAddRoot}
              title="Add area (root node)"
              aria-label="Add root node"
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                color: "var(--text-secondary)",
                fontFamily: "inherit",
                marginTop: 2,
              }}
            >
              <Plus size={12} />
              Add area
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            height: 28,
            borderBottom: "1px solid var(--border-subtle)",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }} />
          <div
            style={{
              width: COL_PROGRESS,
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              paddingRight: 8,
            }}
          >
            Progress
          </div>
          <div
            style={{
              width: COL_TODAY,
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textAlign: "center",
            }}
          >
            Today
          </div>
          <div
            style={{
              width: COL_DUE,
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              paddingRight: 8,
            }}
          >
            Due
          </div>
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
              const isDragging = dragInfo?.draggingId === vnode.id;
              const isOver = dragInfo?.overId === vnode.id;
              const dropPos = dragInfo?.dropPosition ?? null;
              const isDropInside = isOver && dropPos === "inside";

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
                  {/* Drop indicator above */}
                  {isOver && dropPos === "before" && (
                    <TreeDropIndicator depth={vnode.depth} position="top" />
                  )}

                  <TreeNode
                    id={vnode.id}
                    depth={vnode.depth}
                    isDragging={isDragging}
                    isDropInside={isDropInside}
                  />

                  {/* Drop indicator below */}
                  {isOver && dropPos === "after" && (
                    <TreeDropIndicator depth={vnode.depth} position="bottom" />
                  )}
                </div>
              );
            })}
          </div>

          {/* "New Item" pinned at bottom of list */}
          {visibleNodes.length > 0 && (
            <button
              onClick={handleAddRoot}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                margin: "6px 12px",
                padding: "6px 8px",
                background: "transparent",
                border: "none",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13,
                color: "var(--text-muted)",
                fontFamily: "inherit",
                width: "calc(100% - 24px)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-node-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <Plus size={13} />
              New Item
            </button>
          )}
        </div>
      </div>

      {/* Drag ghost overlay */}
      <DragOverlay dropAnimation={null}>
        {draggingNode ? (
          <div
            style={{
              height: 40,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 12px 0 10px",
              background: "var(--bg-app)",
              border: "1px solid var(--accent)",
              borderRadius: 8,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              fontSize: 14,
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans, sans-serif)",
              cursor: "grabbing",
              userSelect: "none",
              minWidth: 160,
              maxWidth: 320,
              opacity: 0.95,
            }}
          >
            <GripVertical size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            {draggingNode.icon && (
              <span style={{ fontSize: 13, flexShrink: 0 }}>{draggingNode.icon}</span>
            )}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {draggingNode.title || "Untitled"}
            </span>
          </div>
        ) : null}
      </DragOverlay>

      <style>{`
        .tree-node-row:hover .node-actions,
        .tree-node-row:hover .drag-handle {
          opacity: 1 !important;
        }
        .tree-node-row:hover {
          background: var(--bg-node-hover) !important;
        }
      `}</style>
    </DndContext>
  );
}
