"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectTodayNodes } from "@/store/selectors";
import { TreeNode } from "@/components/tree/TreeNode";
import { parseTask } from "@/lib/nlp";
import { INBOX_ID } from "@/types";
import type { LifeNode } from "@/types";

export function TodayView() {
  const { nodes, rootIds, todayIds, addToInbox, addToToday, updateNode, moveNode } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      rootIds: s.rootIds,
      todayIds: s.todayIds,
      addToInbox: s.addToInbox,
      addToToday: s.addToToday,
      updateNode: s.updateNode,
      moveNode: s.moveNode,
    }))
  );

  const todayNodes = selectTodayNodes(nodes, todayIds);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => parseTask(draft), [draft]);

  // Flat list of non-archived areas the user can route tasks into
  const areas = useMemo<LifeNode[]>(
    () =>
      rootIds
        .filter((id) => id !== INBOX_ID && nodes[id] && !nodes[id].archived)
        .map((id) => nodes[id]!),
    [rootIds, nodes]
  );

  // Case-insensitive best match for the parsed area hint
  const matchedArea = useMemo<LifeNode | null>(() => {
    if (!parsed.areaHint) return null;
    const hint = parsed.areaHint.toLowerCase();
    // Prefer exact match, then starts-with, then contains
    return (
      areas.find((a) => a.title.toLowerCase() === hint) ??
      areas.find((a) => a.title.toLowerCase().startsWith(hint) || hint.startsWith(a.title.toLowerCase())) ??
      areas.find((a) => a.title.toLowerCase().includes(hint) || hint.includes(a.title.toLowerCase())) ??
      null
    );
  }, [parsed.areaHint, areas]);

  // Listen for Space key trigger from useKeyboard when no node is focused
  useEffect(() => {
    function onQuickAdd() { inputRef.current?.focus(); }
    window.addEventListener("today:quickadd", onQuickAdd);
    return () => window.removeEventListener("today:quickadd", onQuickAdd);
  }, []);

  function submit() {
    if (!draft.trim()) return;
    const id = addToInbox(parsed.title);
    if (parsed.dueDate) updateNode(id, { dueDate: parsed.dueDate, dueTime: parsed.dueTime ?? null });
    if (parsed.reminder !== "none") updateNode(id, { reminder: parsed.reminder });
    addToToday(id);
    // If a real area was detected, move the task out of Inbox into that area
    if (matchedArea) {
      moveNode(id, matchedArea.id, matchedArea.childIds.length);
    }
    setDraft("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
    if (e.key === "Escape") { setDraft(""); inputRef.current?.blur(); }
  }

  const hasChips = (parsed.dateLabel && draft.trim()) || matchedArea;

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
          padding: "6px 12px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add task… try 'Call John tomorrow in Work at 3pm'"
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

        {/* NLP preview chips */}
        {hasChips && (
          <div style={{ display: "flex", gap: 5, marginTop: 5, paddingLeft: 21 }}>
            {parsed.dateLabel && draft.trim() && (
              <span style={chipStyle("accent")}>📅 {parsed.dateLabel}</span>
            )}
            {matchedArea && (
              <span style={chipStyle("success")}>
                {matchedArea.icon ? `${matchedArea.icon} ` : ""}
                {matchedArea.title}
              </span>
            )}
            {parsed.areaHint && !matchedArea && (
              <span style={chipStyle("muted")} title="No matching area found">
                ? {parsed.areaHint}
              </span>
            )}
          </div>
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
        .tree-node-row:hover .node-actions { opacity: 1 !important; }
        .tree-node-row:hover { background: var(--bg-node-hover) !important; }
      `}</style>
    </div>
  );
}

function chipStyle(tone: "accent" | "success" | "muted"): React.CSSProperties {
  const map = {
    accent: { color: "var(--accent)", background: "var(--accent-subtle)", border: "1px solid var(--accent)" },
    success: { color: "var(--success)", background: "var(--success-subtle)", border: "1px solid var(--success)" },
    muted: { color: "var(--text-muted)", background: "var(--bg-node-hover)", border: "1px solid var(--border)" },
  };
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 7px",
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 500,
    ...map[tone],
  };
}
