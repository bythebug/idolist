"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { useStore } from "@/store";

interface Props {
  id: string;
  title: string;
  completed: boolean;
  isEditing: boolean;
}

export function TreeNodeTitle({ id, title, completed, isEditing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateNode, deleteNode, addNode, indentNode, outdentNode, setEditing, setFocused, nodes } =
    useStore((s) => ({
      updateNode: s.updateNode,
      deleteNode: s.deleteNode,
      addNode: s.addNode,
      indentNode: s.indentNode,
      outdentNode: s.outdentNode,
      setEditing: s.setEditing,
      setFocused: s.setFocused,
      nodes: s.nodes,
    }));

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function save(value: string) {
    const trimmed = value.trim();
    updateNode(id, { title: trimmed });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = inputRef.current?.value ?? "";
      save(value);

      const node = nodes[id];
      const newId = addNode(node?.parentId ?? null, id);
      setEditing(newId);
      setFocused(newId);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const value = inputRef.current?.value ?? "";
      save(value);

      if (e.shiftKey) {
        outdentNode(id);
      } else {
        indentNode(id);
      }
      // Keep editing
      setTimeout(() => setEditing(id), 0);
      return;
    }

    if (e.key === "Backspace" && inputRef.current?.value === "") {
      e.preventDefault();
      const node = nodes[id];
      // Move focus to sibling above or parent
      const parent = node?.parentId ? nodes[node.parentId] : null;
      const siblings = parent ? parent.childIds : useStore.getState().rootIds;
      const idx = siblings.indexOf(id);
      const prevId = idx > 0 ? siblings[idx - 1] : node?.parentId ?? null;

      deleteNode(id);
      if (prevId) {
        setFocused(prevId);
        setEditing(prevId);
      } else {
        setEditing(null);
        setFocused(null);
      }
      return;
    }

    if (e.key === "Escape") {
      setEditing(null);
      return;
    }
  }

  function handleBlur() {
    const value = inputRef.current?.value ?? "";
    if (value.trim() === "" && title === "") {
      deleteNode(id);
    } else {
      save(value);
    }
    setEditing(null);
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        defaultValue={title}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-primary)",
          fontSize: 14,
          fontFamily: "inherit",
          lineHeight: "1.4",
          padding: 0,
          minWidth: 0,
        }}
        placeholder="Node title..."
      />
    );
  }

  return (
    <span
      style={{
        flex: 1,
        fontSize: 14,
        lineHeight: "1.4",
        color: completed ? "var(--text-completed)" : "var(--text-primary)",
        textDecoration: completed ? "line-through" : "none",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "default",
        userSelect: "none",
      }}
    >
      {title || (
        <span style={{ color: "var(--text-placeholder)" }}>Untitled</span>
      )}
    </span>
  );
}
