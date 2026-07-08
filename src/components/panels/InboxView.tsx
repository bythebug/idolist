"use client";

import { useState, useRef, useMemo } from "react";
import { format } from "date-fns";
import { Plus, Check, Trash2, ArrowRight, Calendar } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { INBOX_ID } from "@/types";
import type { LifeNode } from "@/types";
import { TreeNodeCheckbox } from "@/components/tree/TreeNodeCheckbox";
import { parseTask } from "@/lib/nlp";

export function InboxView() {
  const { nodes, rootIds, addToInbox, addToToday, updateNode, toggleComplete, deleteNode, moveNode, setSelected } =
    useStore(useShallow((s) => ({
      nodes: s.nodes,
      rootIds: s.rootIds,
      addToInbox: s.addToInbox,
      addToToday: s.addToToday,
      updateNode: s.updateNode,
      toggleComplete: s.toggleComplete,
      deleteNode: s.deleteNode,
      moveNode: s.moveNode,
      setSelected: s.setSelected,
    })));

  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Live NLP parse as user types
  const parsed = useMemo(() => parseTask(draft), [draft]);

  const inbox = nodes[INBOX_ID];
  const items = useMemo(
    () => (inbox?.childIds ?? []).map((id) => nodes[id]).filter((n): n is LifeNode => !!n && !n.archived),
    [inbox, nodes]
  );

  const areas = useMemo(
    () => rootIds.filter((id) => id !== INBOX_ID && nodes[id] && !nodes[id].archived)
      .map((id) => nodes[id]!),
    [rootIds, nodes]
  );

  // Match parsed area hint against real areas (exact → starts-with → contains)
  const matchedArea = useMemo<LifeNode | null>(() => {
    if (!parsed.areaHint) return null;
    const hint = parsed.areaHint.toLowerCase();
    return (
      areas.find((a) => a.title.toLowerCase() === hint) ??
      areas.find((a) => a.title.toLowerCase().startsWith(hint) || hint.startsWith(a.title.toLowerCase())) ??
      areas.find((a) => a.title.toLowerCase().includes(hint) || hint.includes(a.title.toLowerCase())) ??
      null
    );
  }, [parsed.areaHint, areas]);

  function submit() {
    if (!draft.trim()) return;
    const id = addToInbox(parsed.title);
    if (parsed.dueDate) updateNode(id, { dueDate: parsed.dueDate, dueTime: parsed.dueTime ?? null });
    if (parsed.reminder !== "none") updateNode(id, { reminder: parsed.reminder });
    if (parsed.isToday) addToToday(id);
    if (matchedArea) moveNode(id, matchedArea.id, matchedArea.childIds.length);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
    if (e.key === "Escape") { setDraft(""); inputRef.current?.blur(); }
  }

  function moveToArea(nodeId: string, areaId: string) {
    const area = nodes[areaId];
    if (!area) return;
    moveNode(nodeId, areaId, area.childIds.length);
  }

  const pending = items.filter((n) => !n.completed);
  const done = items.filter((n) => n.completed);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
            📥 Inbox
          </h1>
          {pending.length > 0 && (
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{pending.length} items</span>
          )}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
          Capture anything. Organise later.
        </p>
      </div>

      {/* Quick-add with NLP */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <Plus size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Call John tomorrow, Review doc by Friday…"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 14,
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
                borderRadius: 6,
                padding: "4px 10px",
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
        {draft.trim() && (parsed.dateLabel || matchedArea || parsed.areaHint) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, paddingLeft: 2, flexWrap: "wrap" }}>
            {parsed.dateLabel && (
              <div style={chipStyle("accent")}>
                <Calendar size={11} />
                {parsed.dateLabel}
              </div>
            )}
            {matchedArea && (
              <div style={chipStyle("success")}>
                {matchedArea.icon ? `${matchedArea.icon} ` : ""}
                {matchedArea.title}
              </div>
            )}
            {parsed.areaHint && !matchedArea && (
              <div style={chipStyle("muted")} title="No matching area found">
                ? {parsed.areaHint}
              </div>
            )}
            {parsed.title !== draft.trim() && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                → &ldquo;{parsed.title}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>

      {/* Items list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
        {items.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 8, color: "var(--text-muted)" }}>
            <Check size={32} strokeWidth={1.5} />
            <span style={{ fontSize: 14 }}>Inbox is empty</span>
          </div>
        ) : (
          <>
            {pending.map((node) => (
              <InboxItem
                key={node.id}
                node={node}
                areas={areas}
                onToggle={() => toggleComplete(node.id)}
                onDelete={() => deleteNode(node.id)}
                onOpen={() => setSelected(node.id)}
                onMoveTo={(areaId) => moveToArea(node.id, areaId)}
              />
            ))}

            {done.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "16px 0 6px" }}>
                  Completed
                </div>
                {done.map((node) => (
                  <InboxItem
                    key={node.id}
                    node={node}
                    areas={areas}
                    onToggle={() => toggleComplete(node.id)}
                    onDelete={() => deleteNode(node.id)}
                    onOpen={() => setSelected(node.id)}
                    onMoveTo={(areaId) => moveToArea(node.id, areaId)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InboxItem({
  node,
  areas,
  onToggle,
  onDelete,
  onOpen,
  onMoveTo,
}: {
  node: LifeNode;
  areas: LifeNode[];
  onToggle: () => void;
  onDelete: () => void;
  onOpen: () => void;
  onMoveTo: (areaId: string) => void;
}) {
  const [showMove, setShowMove] = useState(false);

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, marginBottom: 2, position: "relative" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-node-hover)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; setShowMove(false); }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <TreeNodeCheckbox completed={node.completed} onToggle={onToggle} />
      </div>

      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onOpen}>
        <div
          style={{
            fontSize: 14,
            color: node.completed ? "var(--text-completed)" : "var(--text-primary)",
            textDecoration: node.completed ? "line-through" : "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.title || "Untitled"}
        </div>
        {node.notes && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
            {node.notes}
          </div>
        )}
      </div>

      {/* Due date or creation date */}
      <span style={{ fontSize: 11, color: node.dueDate ? "var(--accent)" : "var(--text-muted)", flexShrink: 0, textAlign: "right" }}>
        {node.dueDate ? (
          <>
            {format(new Date(node.dueDate), "MMM d")}
            {node.dueTime && (
              <span style={{ opacity: 0.8 }}> · {format(new Date(`1970-01-01T${node.dueTime}`), "h:mma")}</span>
            )}
          </>
        ) : (
          format(new Date(node.createdAt), "MMM d")
        )}
      </span>

      {/* Hover actions */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        {areas.length > 0 && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowMove((v) => !v)} title="Move to area" style={iconBtnStyle}>
              <ArrowRight size={13} />
            </button>
            {showMove && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: 4,
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  zIndex: 100,
                  minWidth: 160,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "6px 10px 4px", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Move to area
                </div>
                {areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => { onMoveTo(area.id); setShowMove(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 12px", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-primary)", fontFamily: "inherit", textAlign: "left" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-node-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {area.icon && <span>{area.icon}</span>}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{area.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button onClick={onDelete} title="Delete" style={iconBtnStyle}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function chipStyle(tone: "accent" | "success" | "muted"): React.CSSProperties {
  const map = {
    accent: { color: "var(--accent)", background: "var(--accent-subtle)", border: "1px solid var(--accent)" },
    success: { color: "var(--success)", background: "var(--success-subtle)", border: "1px solid var(--success)" },
    muted:  { color: "var(--text-muted)", background: "var(--bg-node-hover)", border: "1px solid var(--border)" },
  };
  return {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 9px", borderRadius: 99, fontSize: 12, fontWeight: 500,
    ...map[tone],
  };
}

const iconBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
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
