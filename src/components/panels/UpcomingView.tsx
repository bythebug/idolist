"use client";

import { useState, useEffect, useMemo } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectUpcomingNodes } from "@/store/selectors";
import { getParentChain } from "@/lib/tree";
import type { LifeNode } from "@/types";

interface ItemProps {
  node: LifeNode;
  daysUntil: number;
  nodes: Record<string, LifeNode>;
}

function UpcomingItem({ node, daysUntil, nodes }: ItemProps) {
  const { setSelected, setFocused, toggleComplete } = useStore(
    useShallow((s) => ({
      setSelected: s.setSelected,
      setFocused: s.setFocused,
      toggleComplete: s.toggleComplete,
    }))
  );

  const parentChain = useMemo(
    () => getParentChain(nodes, node.id),
    [nodes, node.id]
  );

  const isOverdue = daysUntil < 0;

  return (
    <div
      onClick={() => { setSelected(node.id); setFocused(node.id); }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 16px",
        cursor: "pointer",
        borderBottom: "1px solid var(--border-subtle)",
        transition: "background 100ms",
      }}
      className="upcoming-item"
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleComplete(node.id); }}
        aria-label={node.completed ? "Mark incomplete" : "Mark complete"}
        style={{
          flexShrink: 0,
          marginTop: 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: `2px solid ${isOverdue ? "var(--danger)" : "var(--border)"}`,
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            color: "var(--text-primary)",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.title || "Untitled"}
        </div>
        {parentChain.length > 0 && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {parentChain.map((p) => p.title).join(" › ")}
          </div>
        )}
      </div>

      {/* Due date chip */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 500,
          padding: "2px 7px",
          borderRadius: 6,
          background: isOverdue
            ? "var(--danger-subtle-2)"
            : daysUntil === 0
            ? "var(--warning-subtle)"
            : "var(--bg-sidebar)",
          color: isOverdue
            ? "var(--danger)"
            : daysUntil === 0
            ? "var(--warning)"
            : "var(--text-secondary)",
          border: `1px solid ${
            isOverdue
              ? "var(--danger-subtle-4)"
              : daysUntil === 0
              ? "var(--warning-subtle-2)"
              : "var(--border)"
          }`,
        }}
      >
        {isOverdue ? (
          <>
            <AlertTriangle size={10} />
            {Math.abs(daysUntil) === 1
              ? "Yesterday"
              : `${Math.abs(daysUntil)}d ago`}
          </>
        ) : daysUntil === 0 ? (
          <>
            <Clock size={10} />
            Today{node.dueTime && ` · ${format(new Date(`1970-01-01T${node.dueTime}`), "h:mma")}`}
          </>
        ) : daysUntil === 1 ? (
          <>
            <Calendar size={10} />
            Tomorrow{node.dueTime && ` · ${format(new Date(`1970-01-01T${node.dueTime}`), "h:mma")}`}
          </>
        ) : (
          <>
            <Calendar size={10} />
            {node.dueDate
              ? format(new Date(node.dueDate), "MMM d")
              : `In ${daysUntil}d`}
            {node.dueTime && ` · ${format(new Date(`1970-01-01T${node.dueTime}`), "h:mma")}`}
          </>
        )}
      </div>
    </div>
  );
}

interface Group {
  label: string;
  items: { node: LifeNode; daysUntil: number }[];
}

export function UpcomingView() {
  // Force re-render when app regains visibility (dates may have changed)
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        forceUpdate((n) => n + 1);
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const { nodes } = useStore(useShallow((s) => ({ nodes: s.nodes })));
  const upcomingItems = selectUpcomingNodes(nodes);

  const groups = useMemo<Group[]>(() => {
    const overdue = upcomingItems.filter((i) => i.daysUntil < 0);
    const today = upcomingItems.filter((i) => i.daysUntil === 0);
    const tomorrow = upcomingItems.filter((i) => i.daysUntil === 1);
    const thisWeek = upcomingItems.filter((i) => i.daysUntil >= 2);

    const result: Group[] = [];
    if (overdue.length) result.push({ label: "Overdue", items: overdue });
    if (today.length) result.push({ label: "Today", items: today });
    if (tomorrow.length) result.push({ label: "Tomorrow", items: tomorrow });
    if (thisWeek.length) result.push({ label: "This Week", items: thisWeek });
    return result;
  }, [upcomingItems]);

  const overdueCount = useMemo(
    () => upcomingItems.filter((i) => i.daysUntil < 0).length,
    [upcomingItems]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
          background: "var(--glass-toolbar-bg)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <h1 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>Upcoming</h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
          {format(new Date(), "EEEE, MMMM d")} · {upcomingItems.length} items
        </p>
      </div>

      {/* Overdue notification banner */}
      {overdueCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "var(--danger-subtle)",
            borderBottom: "1px solid var(--danger-subtle-3)",
            fontSize: 12,
            color: "var(--danger)",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={13} />
          <span>
            {overdueCount} overdue {overdueCount === 1 ? "item" : "items"} —
            review and reschedule or complete
          </span>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {upcomingItems.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 8,
              color: "var(--text-muted)",
            }}
          >
            <Calendar size={28} style={{ opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 13 }}>No upcoming items</p>
            <p style={{ margin: 0, fontSize: 12, textAlign: "center", maxWidth: 220 }}>
              Set a due date on any node in the details panel to see it here.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <div
                style={{
                  padding: "10px 16px 4px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: group.label === "Overdue" ? "var(--danger)" : "var(--text-muted)",
                }}
              >
                {group.label}
              </div>
              {group.items.map(({ node, daysUntil }) => (
                <UpcomingItem
                  key={node.id}
                  node={node}
                  daysUntil={daysUntil}
                  nodes={nodes}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <style>{`
        .upcoming-item:hover {
          background: var(--bg-node-hover);
        }
      `}</style>
    </div>
  );
}
