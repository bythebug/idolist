"use client";

import { useEffect } from "react";
import { useStore } from "@/store";
import { selectVisibleNodes } from "@/store/selectors";
import { getNextVisibleId, getPreviousVisibleId } from "@/lib/tree";

export function useKeyboard() {
  const store = useStore();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const { editingId, focusedId, view } = store;

      // Global shortcuts — always active
      if (meta && e.key === "k") {
        e.preventDefault();
        store.openCommandPalette();
        return;
      }
      if (meta && e.key === "/") {
        e.preventDefault();
        if (store.shortcutsOpen) {
          store.closeShortcuts();
        } else {
          store.openShortcuts();
        }
        return;
      }
      if (meta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        // undo — placeholder for Phase 15
        return;
      }
      if (meta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        // redo — placeholder for Phase 15
        return;
      }

      // Skip tree navigation while editing
      if (editingId) return;

      // Tree navigation
      if (view !== "life" && view !== "today") return;

      const { nodes, rootIds, collapsedIds } = store;
      const visible = selectVisibleNodes(nodes, rootIds, collapsedIds, "life");

      if (!focusedId && visible.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          store.setFocused(visible[0].id);
          return;
        }
      }

      if (!focusedId) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = getNextVisibleId(visible, focusedId);
          if (next) store.setFocused(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = getPreviousVisibleId(visible, focusedId);
          if (prev) store.setFocused(prev);
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          const node = nodes[focusedId];
          if (!node) break;
          if (node.childIds.length > 0 && collapsedIds.has(focusedId)) {
            store.toggleCollapsed(focusedId);
          } else if (node.childIds.length > 0) {
            store.setFocused(node.childIds[0]);
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          const node = nodes[focusedId];
          if (!node) break;
          if (node.childIds.length > 0 && !collapsedIds.has(focusedId)) {
            store.toggleCollapsed(focusedId);
          } else if (node.parentId) {
            store.setFocused(node.parentId);
          }
          break;
        }
        case "Enter": {
          e.preventDefault();
          store.setEditing(focusedId);
          break;
        }
        case " ": {
          e.preventDefault();
          store.toggleComplete(focusedId);
          break;
        }
        case "Backspace":
        case "Delete": {
          if (meta) {
            e.preventDefault();
            const node = nodes[focusedId];
            const prevId = getPreviousVisibleId(visible, focusedId);
            store.deleteNode(focusedId);
            if (prevId) store.setFocused(prevId);
            else store.setFocused(null);
          }
          break;
        }
        case "d": {
          if (meta) {
            e.preventDefault();
            store.duplicateNode(focusedId);
          }
          break;
        }
        case "t": {
          if (meta) {
            e.preventDefault();
            if (store.todayIds.has(focusedId)) {
              store.removeFromToday(focusedId);
            } else {
              store.addToToday(focusedId);
            }
          }
          break;
        }
        case "Escape": {
          store.setFocused(null);
          store.setSelected(null);
          break;
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [store]);
}
