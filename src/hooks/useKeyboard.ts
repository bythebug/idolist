"use client";

import { useEffect, useRef } from "react";
import { useStore, type LifeOSStore } from "@/store";
import { selectVisibleNodes } from "@/store/selectors";
import { getNextVisibleId, getPreviousVisibleId } from "@/lib/tree";

export function useKeyboard() {
  // Ref always holds the latest store snapshot — avoids stale closure and
  // prevents the effect from re-registering the listener on every render.
  const storeRef = useRef<LifeOSStore | null>(null);
  const store = useStore();
  storeRef.current = store;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const s = storeRef.current;
      if (!s) return;

      const meta = e.metaKey || e.ctrlKey;
      const { editingId, focusedId, view } = s;

      // Global shortcuts
      if (meta && e.key === "k") {
        e.preventDefault();
        s.openCommandPalette();
        return;
      }
      if (meta && e.key === "/") {
        e.preventDefault();
        s.shortcutsOpen ? s.closeShortcuts() : s.openShortcuts();
        return;
      }
      if (meta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        s.undo();
        return;
      }
      if (meta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        s.redo();
        return;
      }

      // Skip tree navigation while a title input is focused
      if (editingId) return;

      if (view !== "life" && view !== "today") return;

      const visible = selectVisibleNodes(s.nodes, s.rootIds, s.collapsedIds, "life");

      // Focus first node if nothing focused
      if (!focusedId && visible.length > 0 && e.key === "ArrowDown") {
        e.preventDefault();
        s.setFocused(visible[0].id);
        return;
      }

      if (!focusedId) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = getNextVisibleId(visible, focusedId);
          if (next) s.setFocused(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = getPreviousVisibleId(visible, focusedId);
          if (prev) s.setFocused(prev);
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          const node = s.nodes[focusedId];
          if (!node) break;
          if (node.childIds.length > 0 && s.collapsedIds.has(focusedId)) {
            s.toggleCollapsed(focusedId);
          } else if (node.childIds.length > 0) {
            s.setFocused(node.childIds[0]);
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          const node = s.nodes[focusedId];
          if (!node) break;
          if (node.childIds.length > 0 && !s.collapsedIds.has(focusedId)) {
            s.toggleCollapsed(focusedId);
          } else if (node.parentId) {
            s.setFocused(node.parentId);
          }
          break;
        }
        case "Enter": {
          e.preventDefault();
          s.setEditing(focusedId);
          break;
        }
        case " ": {
          // Only intercept Space when tree is focused, not inside inputs
          const active = document.activeElement;
          if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) break;
          e.preventDefault();
          s.toggleComplete(focusedId);
          break;
        }
        case "Backspace":
        case "Delete": {
          if (meta) {
            e.preventDefault();
            const prev = getPreviousVisibleId(visible, focusedId);
            s.deleteNode(focusedId);
            s.setFocused(prev ?? null);
          }
          break;
        }
        case "d": {
          if (meta) {
            e.preventDefault();
            s.duplicateNode(focusedId);
          }
          break;
        }
        case "t": {
          if (meta) {
            e.preventDefault();
            s.todayIds.has(focusedId)
              ? s.removeFromToday(focusedId)
              : s.addToToday(focusedId);
          }
          break;
        }
        case "e": {
          if (!meta) {
            e.preventDefault();
            // E opens NodeDetails panel for the focused node
            s.setSelected(s.selectedId === focusedId ? null : focusedId);
          }
          break;
        }
        case "Escape": {
          s.setFocused(null);
          s.setSelected(null);
          break;
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []); // Empty deps — storeRef.current is always current without re-registering
}
