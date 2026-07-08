"use client";

import { memo, useCallback, useMemo } from "react";
import { ChevronRight, Plus, GripVertical, Archive, Sun } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { getSubtreeCompletionRatio } from "@/lib/tree";
import { TreeNodeCheckbox } from "./TreeNodeCheckbox";
import { TreeNodeTitle } from "./TreeNodeTitle";
import { TreeNodeIcon } from "./TreeNodeIcon";

interface Props {
  id: string;
  depth: number;
  isDragging?: boolean;
  isDropInside?: boolean;
}

// Column widths — must match the header in LifeTree
export const COL_PROGRESS = 96;
export const COL_TODAY = 40;
export const COL_DUE = 72;

export const TreeNode = memo(function TreeNode({ id, depth, isDragging, isDropInside }: Props) {
  const {
    node,
    nodes,
    todayIds,
    isSelected,
    isFocused,
    isEditing,
    isCollapsed,
    setSelected,
    setFocused,
    setEditing,
    toggleComplete,
    toggleCollapsed,
    addNode,
    archiveNode,
    addToToday,
    removeFromToday,
  } = useStore(useShallow((s) => ({
    node: s.nodes[id],
    nodes: s.nodes,
    todayIds: s.todayIds,
    isSelected: s.selectedId === id,
    isFocused: s.focusedId === id,
    isEditing: s.editingId === id,
    isCollapsed: s.collapsedIds.has(id),
    setSelected: s.setSelected,
    setFocused: s.setFocused,
    setEditing: s.setEditing,
    toggleComplete: s.toggleComplete,
    toggleCollapsed: s.toggleCollapsed,
    addNode: s.addNode,
    archiveNode: s.archiveNode,
    addToToday: s.addToToday,
    removeFromToday: s.removeFromToday,
  })));

  const draggable = useDraggable({ id });
  const droppable = useDroppable({ id });

  const setRowRef = useCallback(
    (el: HTMLDivElement | null) => { droppable.setNodeRef(el); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const progress = useMemo(
    () => (node?.childIds.length ? getSubtreeCompletionRatio(nodes, id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, id]
  );

  if (!node) return null;

  const hasChildren = node.childIds.length > 0;
  const isToday = todayIds.has(id);
  const INDENT = 20;
  const showFocusRing = isFocused && !isEditing;

  function handleRowClick(e: React.MouseEvent) {
    e.stopPropagation();
    setFocused(id);
    setSelected(id);
  }

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(id);
  }

  function handleAddChild(e: React.MouseEvent) {
    e.stopPropagation();
    const newId = addNode(id);
    if (isCollapsed) toggleCollapsed(id);
    setFocused(newId);
    setEditing(newId);
  }

  function handleTodayToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (isToday) removeFromToday(id);
    else addToToday(id);
  }

  return (
    <div
      ref={setRowRef}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? !isCollapsed : undefined}
      onClick={handleRowClick}
      onDoubleClick={handleDoubleClick}
      style={{
        display: "flex",
        alignItems: "center",
        height: 40,
        gap: 0,
        cursor: "default",
        borderRadius: 8,
        margin: "0 4px",
        background: isSelected
          ? "var(--bg-node-selected)"
          : isDropInside
          ? "var(--accent-subtle)"
          : "transparent",
        outline: isDropInside
          ? "2px solid var(--accent)"
          : showFocusRing
          ? "2px solid var(--accent)"
          : "none",
        outlineOffset: -2,
        transition: "background 100ms",
        opacity: isDragging ? 0.3 : 1,
        position: "relative",
      }}
      className="tree-node-row"
    >
      {/* ── Left: indent + controls + title ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingLeft: depth * INDENT + 8,
          paddingRight: 4,
        }}
      >
        {/* Drag handle */}
        <div
          ref={draggable.setNodeRef}
          {...draggable.listeners}
          {...draggable.attributes}
          className="drag-handle"
          title="Drag to reorder"
          style={{
            flexShrink: 0,
            width: 12,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: draggable.isDragging ? "grabbing" : "grab",
            color: "var(--text-muted)",
            opacity: 0,
            transition: "opacity 100ms",
            marginLeft: -4,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={11} />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleCollapsed(id);
          }}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
          style={{
            flexShrink: 0,
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: hasChildren ? "pointer" : "default",
            color: hasChildren ? "var(--text-muted)" : "transparent",
            borderRadius: 4,
          }}
        >
          <ChevronRight
            size={12}
            style={{
              transform: hasChildren && !isCollapsed ? "rotate(90deg)" : "none",
              transition: "transform 150ms ease",
            }}
          />
        </button>

        {/* Icon */}
        <TreeNodeIcon id={id} icon={node.icon} depth={depth} type={node.type} />

        {/* Checkbox — areas don't have checkboxes */}
        {depth > 0 && (
          <TreeNodeCheckbox completed={node.completed} onToggle={() => toggleComplete(id)} />
        )}

        {/* Title */}
        <TreeNodeTitle id={id} title={node.title} completed={node.completed} isEditing={isEditing} depth={depth} />

        {/* Hover actions */}
        <div
          className="node-actions"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            opacity: 0,
            transition: "opacity 100ms",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleAddChild}
            title="Add child"
            aria-label="Add child node"
            style={actionBtnStyle}
          >
            <Plus size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); archiveNode(id); }}
            title="Archive"
            aria-label="Archive node"
            style={actionBtnStyle}
          >
            <Archive size={13} />
          </button>
        </div>
      </div>

      {/* ── Right: Progress column ── */}
      <div
        style={{
          flexShrink: 0,
          width: COL_PROGRESS,
          display: "flex",
          alignItems: "center",
          paddingRight: 8,
        }}
      >
        {progress !== null && (
          <div
            style={{
              flex: 1,
              height: 4,
              background: "var(--border)",
              borderRadius: 2,
              overflow: "hidden",
            }}
            title={`${Math.round(progress * 100)}% complete`}
          >
            <div
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                background: progress === 1 ? "var(--success)" : "var(--accent)",
                borderRadius: 2,
                transition: "width 300ms ease",
              }}
            />
          </div>
        )}
        {progress !== null && (
          <span
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              marginLeft: 5,
              flexShrink: 0,
              minWidth: 26,
              textAlign: "right",
            }}
          >
            {Math.round(progress * 100)}%
          </span>
        )}
      </div>

      {/* ── Right: Today column ── */}
      <div
        style={{
          flexShrink: 0,
          width: COL_TODAY,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button
          onClick={handleTodayToggle}
          aria-label={isToday ? "Remove from today" : "Add to today"}
          title={isToday ? "Remove from Today" : "Add to Today"}
          style={{
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            color: isToday ? "var(--warning)" : "var(--border)",
            padding: 0,
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => {
            if (!isToday) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
          }}
          onMouseLeave={(e) => {
            if (!isToday) (e.currentTarget as HTMLButtonElement).style.color = "var(--border)";
          }}
        >
          <Sun size={13} />
        </button>
      </div>

      {/* ── Right: Due date column ── */}
      <div
        style={{
          flexShrink: 0,
          width: COL_DUE,
          display: "flex",
          alignItems: "center",
          paddingRight: 8,
        }}
      >
        {node.dueDate && (
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {format(new Date(node.dueDate), "MMM d")}
          </span>
        )}
      </div>
    </div>
  );
});

const actionBtnStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  color: "var(--text-muted)",
  padding: 0,
};
