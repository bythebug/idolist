"use client";

import { useState, useRef, useCallback } from "react";
import { LifeProgressPanel } from "@/components/panels/LifeProgressPanel";
import {
  Home,
  Sun,
  Clock,
  Inbox,
  Search,
  GitBranch,
  Calendar,
  StickyNote,
  Settings,
  Plus,
} from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectTodayCount, selectUpcomingCount } from "@idolist/core";
import type { View } from "@idolist/core";
import { INBOX_ID } from "@idolist/core";
import { parseTask } from "@idolist/core";

const NAV_ITEMS: { id: View | "search" | "graph" | "calendar" | "notes"; label: string; icon: React.ComponentType<{ size?: number }>; view?: View }[] = [
  { id: "life",     label: "Life",     icon: Home,       view: "life" },
  { id: "today",    label: "Today",    icon: Sun,        view: "today" },
  { id: "upcoming", label: "Upcoming", icon: Clock,      view: "upcoming" },
  { id: "inbox",    label: "Inbox",    icon: Inbox,      view: "inbox" },
  { id: "search",   label: "Search",   icon: Search },
  { id: "graph",    label: "Graph",    icon: GitBranch },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "notes",    label: "Notes",    icon: StickyNote },
];

export function Sidebar() {
  const {
    view, nodes, todayIds, userName, userAvatar,
    setView, openCommandPalette, openSettings,
    addToInbox, addToToday, updateNode,
  } = useStore(
    useShallow((s) => ({
      view: s.view,
      nodes: s.nodes,
      todayIds: s.todayIds,
      userName: s.userName,
      userAvatar: s.userAvatar,
      setView: s.setView,
      openCommandPalette: s.openCommandPalette,
      openSettings: s.openSettings,
      addToInbox: s.addToInbox,
      addToToday: s.addToToday,
      updateNode: s.updateNode,
    }))
  );

  const todayCount = selectTodayCount(nodes, todayIds);
  const upcomingCount = selectUpcomingCount(nodes);
  const inboxCount = (nodes[INBOX_ID]?.childIds ?? []).filter(
    (id) => nodes[id] && !nodes[id].archived && !nodes[id].completed
  ).length;

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const openQuickAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickAddOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  function submitQuickAdd() {
    if (!draft.trim()) { setQuickAddOpen(false); return; }
    const parsed = parseTask(draft);
    const id = addToInbox(parsed.title);
    if (parsed.dueDate) updateNode(id, { dueDate: parsed.dueDate, dueTime: parsed.dueTime ?? null });
    addToToday(id);
    setDraft("");
    setQuickAddOpen(false);
  }

  function handleQuickAddKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); submitQuickAdd(); }
    if (e.key === "Escape") { setDraft(""); setQuickAddOpen(false); }
  }

  return (
    <aside
      style={{
        background: "var(--bg-sidebar)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        userSelect: "none",
        position: "relative",
        borderRadius: 22,
        overflow: "hidden",
      }}
    >
      {/* User profile */}
      <button
        onClick={openSettings}
        style={{
          padding: "14px 14px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "transparent",
          border: "none",
          borderBottom: "1px solid var(--border-subtle)",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: userAvatar && userAvatar.length > 1 ? 16 : 13,
            fontWeight: 600,
            color: "#fff",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {userAvatar || (userName ? userName[0].toUpperCase() : "🌿")}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName || "idolist"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Your life, organized</div>
        </div>
      </button>

      {/* Navigation */}
      <nav style={{ padding: "6px 8px", flexShrink: 0 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.view ? view === item.view : false;
          const isAvailable = !!item.view;
          const badge =
            item.id === "today" ? todayCount :
            item.id === "upcoming" ? upcomingCount :
            item.id === "inbox" ? inboxCount : 0;
          const isToday = item.id === "today";

          return (
            <div key={item.id}>
              {/* Today row: split into nav button + separate + button to avoid nesting */}
              {isToday ? (
                <div
                  className="sidebar-nav-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 12,
                    marginBottom: 2,
                    background: isActive ? "var(--bg-node-selected)" : "transparent",
                    boxShadow: isActive ? "inset 0 1px 0 rgba(255,255,255,0.80), 0 1px 3px rgba(217,119,6,0.14)" : "none",
                    transition: "background 150ms, box-shadow 150ms",
                  }}
                >
                  <button
                    onClick={() => setView("today")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 4px 7px 10px",
                      background: "transparent",
                      border: "none",
                      borderRadius: 12,
                      cursor: "pointer",
                      color: isActive ? "var(--accent)" : "var(--text-secondary)",
                      fontSize: 13,
                      fontFamily: "inherit",
                      fontWeight: isActive ? 600 : 400,
                      textAlign: "left",
                    }}
                  >
                    <Icon size={14} />
                    <span style={{ flex: 1 }}>Today</span>
                    {badge > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, background: "var(--accent-subtle)", color: "var(--accent)", padding: "1px 6px", borderRadius: 99, minWidth: 18, textAlign: "center" }}>
                        {badge}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={openQuickAdd}
                    className="today-add-btn"
                    title="Quick add to Today"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                      marginRight: 6,
                      background: "transparent",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      opacity: 0,
                      transition: "opacity 120ms",
                      flexShrink: 0,
                      padding: 0,
                    }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              ) : (
              <button
                onClick={() => {
                  if (item.id === "search") { openCommandPalette(); return; }
                  if (item.view) setView(item.view);
                }}
                title={!isAvailable && item.id !== "search" ? "Coming soon" : undefined}
                className="sidebar-nav-item"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  background: isActive ? "var(--bg-node-selected)" : "transparent",
                  border: "none",
                  borderRadius: 12,
                  cursor: isAvailable || item.id === "search" ? "pointer" : "default",
                  color: isActive ? "var(--accent)" : !isAvailable && item.id !== "search" ? "var(--text-muted)" : "var(--text-secondary)",
                  fontSize: 13,
                  fontFamily: "inherit",
                  fontWeight: isActive ? 600 : 400,
                  textAlign: "left",
                  marginBottom: 2,
                  opacity: !isAvailable && item.id !== "search" ? 0.45 : 1,
                  boxShadow: isActive ? "inset 0 1px 0 rgba(255,255,255,0.80), 0 1px 3px rgba(217,119,6,0.14)" : "none",
                  transition: "background 150ms, color 150ms, box-shadow 150ms",
                }}
              >
                <Icon size={14} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {badge > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, background: "var(--accent-subtle)", color: "var(--accent)", padding: "1px 6px", borderRadius: 99, minWidth: 18, textAlign: "center" }}>
                    {badge}
                  </span>
                )}
              </button>
              )}

              {/* Inline quick-add — only for Today */}
              {isToday && quickAddOpen && (
                <div
                  style={{
                    margin: "2px 4px 4px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 8px",
                    background: "var(--bg-node-hover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                >
                  <Sun size={11} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleQuickAddKey}
                    onBlur={() => { if (!draft.trim()) setQuickAddOpen(false); }}
                    placeholder="Add to today…"
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: 12,
                      color: "var(--text-primary)",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Life Progress — fills remaining space */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <LifeProgressPanel />
      </div>

      {/* Settings */}
      <div style={{ padding: "8px 8px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <button
          onClick={openSettings}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            background: "transparent",
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 13,
            fontFamily: "inherit",
            textAlign: "left",
            transition: "color 150ms",
          }}
        >
          <Settings size={14} />
          Settings
        </button>
      </div>

      <style>{`
        .sidebar-nav-item:hover { background: var(--bg-node-hover) !important; }
        .sidebar-nav-item:hover .today-add-btn { opacity: 1 !important; }
      `}</style>
    </aside>
  );
}
