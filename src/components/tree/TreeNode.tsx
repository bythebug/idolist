"use client";

import { memo } from "react";
import { ChevronRight, Plus, MoreHorizontal } from "lucide-react";
import { useStore } from "@/store";
import { TreeNodeCheckbox } from "./TreeNodeCheckbox";
import { TreeNodeTitle } from "./TreeNodeTitle";

interface Props {
  id: string;
  depth: number;
}

export const TreeNode = memo(function TreeNode({ id, depth }: Props) {
  const {
    node,
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
  } = useStore((s) => ({
    node: s.nodes[id],
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
  }));

  if (!node) return null;

  const hasChildren = node.childIds.length > 0;
  const INDENT = 20;

  function handleRowClick(e: React.MouseEvent) {
    e.stopPropagation();
    setFocused(id);
    setSelected(id);
    if (isEditing) return;
    if (isSelected) {
      // second click could open editing — handled by double click
    }
  }

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(id);
  }

  function handleAddChild(e: React.MouseEvent) {
    e.stopPropagation();
    const newId = addNode(id);
    // Expand parent if collapsed
    if (isCollapsed) toggleCollapsed(id);
    setFocused(newId);
    setEditing(newId);
  }

  const showFocusRing = isFocused && !isEditing;

  return (
    <div
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? !isCollapsed : undefined}
      onClick={handleRowClick}
      onDoubleClick={handleDoubleClick}
      style={{
        display: "flex",
        alignItems: "center",
        height: 36,
        paddingLeft: depth * INDENT + 8,
        paddingRight: 8,
        gap: 4,
        cursor: "default",
        borderRadius: 8,
        margin: "0 4px",
        background: isSelected
          ? "var(--bg-node-selected)"
          : "transparent",
        outline: showFocusRing
          ? "2px solid var(--accent)"
          : "none",
        outlineOffset: -2,
        transition: "background 100ms",
        position: "relative",
      }}
      className="tree-node-row"
    >
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
          transition: "color 100ms",
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

      {/* Checkbox */}
      <TreeNodeCheckbox
        completed={node.completed}
        onToggle={() => toggleComplete(id)}
      />

      {/* Title */}
      <TreeNodeTitle
        id={id}
        title={node.title}
        completed={node.completed}
        isEditing={isEditing}
      />

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
            color: "var(--text-muted)",
            padding: 0,
          }}
        >
          <Plus size={13} />
        </button>
        <button
          title="More options"
          aria-label="More options"
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
            color: "var(--text-muted)",
            padding: 0,
          }}
        >
          <MoreHorizontal size={13} />
        </button>
      </div>
    </div>
  );
});
