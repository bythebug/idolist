"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectTodayNodes } from "@/store/selectors";
import { TreeNode } from "@/components/tree/TreeNode";
import { parseTask } from "@/lib/nlp";

export function TodayView() {
  const { nodes, todayIds, addToInbox, addToToday, updateNode } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      todayIds: s.todayIds,
      addToInbox: s.addToInbox,
      addToToday: s.addToToday,
      updateNode: s.updateNode,
    }))
  );

  const todayNodes = selectTodayNodes(nodes, todayIds);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => parseTask(draft), [draft]);

  // Listen for Space key trigger from useKeyboard when no node is focused
  useEffect(() => {
    function onQuickAdd() {
      inputRef.current?.focus();
    }
    window.addEventListener("today:quickadd", onQuickAdd);
    return () => window.removeEventListener("today:quickadd", onQuickAdd);
  }, []);

  function submit() {
    if (!draft.trim()) return;
    const id = addToInbox(parsed.title);
    if (parsed.dueDate) updateNode(id, { dueDate: parsed.dueDate, dueTime: parsed.dueTime ?? null });
    addToToday(id);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
    if (e.key === "Escape") { setDraft(""); inputRef.current?.blur(); }
  }

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
          Today
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
          {format(new Date(), "EEEE, MMMM d")} · {todayNodes.length} tasks
        </p>
      </div>

      {/* Quick-add row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <Plus size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add task to today… (Space)"
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: 13,
            color: "var(--text-primary)",
            fontFamily: "inherit",
          }}
        />
        {parsed.dateLabel && draft.trim() && (
          <span style={{ fontSize: 11, color: "var(--accent)", flexShrink: 0 }}>
            {parsed.dateLabel}
          </span>
        )}
        {draft.trim() && (
          <button
            onClick={submit}
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: 5,
              padding: "3px 9px",
              fontSize: 12,
              color: "#fff",
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            Add
          </button>
        )}
      </div>

      {/* Tasks */}
      <div style={{ flex: 1, overflow: "auto", paddingTop: 4, paddingBottom: 40 }}>
        {todayNodes.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            No tasks for today. Press Space to add one.
          </div>
        ) : (
          todayNodes.map((node) => (
            <TreeNode key={node.id} id={node.id} depth={0} />
          ))
        )}
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
