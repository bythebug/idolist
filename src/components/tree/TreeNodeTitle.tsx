"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";

interface Props {
  id: string;
  title: string;
  completed: boolean;
  isEditing: boolean;
}

export function TreeNodeTitle({ id, title, completed, isEditing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Suppresses blur handler when Enter/Tab already handled the action
  const suppressBlurRef = useRef(false);

  // Only subscribe to actions (stable references), not node data
  const { updateNode, deleteNode, addNode, indentNode, outdentNode, setEditing, setFocused } =
    useStore(useShallow((s) => ({
      updateNode: s.updateNode,
      deleteNode: s.deleteNode,
      addNode: s.addNode,
      indentNode: s.indentNode,
      outdentNode: s.outdentNode,
      setEditing: s.setEditing,
      setFocused: s.setFocused,
    })));

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end (not select-all) so user can continue typing
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  function save(value: string) {
    updateNode(id, { title: value.trim() });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      suppressBlurRef.current = true;
      save(inputRef.current?.value ?? "");

      // Create sibling below and start editing it
      const node = useStore.getState().nodes[id];
      const newId = addNode(node?.parentId ?? null, id);
      setEditing(newId);
      setFocused(newId);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      suppressBlurRef.current = true;
      save(inputRef.current?.value ?? "");

      if (e.shiftKey) {
        outdentNode(id);
      } else {
        indentNode(id);
      }
      // Keep editing this node after indent/outdent
      setTimeout(() => {
        suppressBlurRef.current = false;
        setEditing(id);
      }, 0);
      return;
    }

    if (e.key === "Backspace" && inputRef.current?.value === "") {
      e.preventDefault();
      suppressBlurRef.current = true;

      // Focus sibling above or parent before deleting
      const state = useStore.getState();
      const node = state.nodes[id];
      const parent = node?.parentId ? state.nodes[node.parentId] : null;
      const siblings = parent ? parent.childIds : state.rootIds;
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
      suppressBlurRef.current = true;
      setEditing(null);
      return;
    }
  }

  function handleBlur() {
    if (suppressBlurRef.current) {
      suppressBlurRef.current = false;
      return;
    }
    const value = inputRef.current?.value ?? "";
    if (value.trim() === "" && title === "") {
      // New node with no content — clean it up
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
