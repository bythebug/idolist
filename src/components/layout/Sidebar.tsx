"use client";

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
} from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectTodayCount, selectUpcomingCount } from "@/store/selectors";
import { LifeProgressPanel } from "@/components/panels/LifeProgressPanel";
import type { View } from "@/types";
import { INBOX_ID } from "@/types";

const NAV_ITEMS: { id: View | "graph" | "calendar" | "notes"; label: string; icon: React.ComponentType<{ size?: number }>; view?: View }[] = [
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
  const { view, nodes, todayIds, userName, userAvatar, setView, openCommandPalette, openSettings } = useStore(
    useShallow((s) => ({
      view: s.view,
      nodes: s.nodes,
      todayIds: s.todayIds,
      userName: s.userName,
      userAvatar: s.userAvatar,
      setView: s.setView,
      openCommandPalette: s.openCommandPalette,
      openSettings: s.openSettings,
    }))
  );

  const todayCount = selectTodayCount(nodes, todayIds);
  const upcomingCount = selectUpcomingCount(nodes);
  const inboxCount = (nodes[INBOX_ID]?.childIds ?? []).filter((id) => nodes[id] && !nodes[id].archived && !nodes[id].completed).length;

  return (
    <aside
      style={{
        background: "var(--bg-sidebar)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        userSelect: "none",
      }}
    >
      {/* User profile */}
      <button
        onClick={openSettings}
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--border-subtle)",
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
        {/* Avatar */}
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
        {/* Name */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName || "idolist"}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Your life, organized</div>
        </div>
      </button>

      {/* Navigation */}
      <nav style={{ padding: "6px 8px", flexShrink: 0 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.view ? view === item.view : false;
          const isAvailable = !!item.view;
          const badge = item.id === "today" ? todayCount : item.id === "upcoming" ? upcomingCount : item.id === "inbox" ? inboxCount : 0;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "search") { openCommandPalette(); return; }
                if (item.view) setView(item.view);
              }}
              title={!isAvailable && item.id !== "search" ? "Coming soon" : undefined}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                background: isActive ? "var(--bg-node-selected)" : "transparent",
                border: "none",
                borderRadius: 7,
                cursor: isAvailable || item.id === "search" ? "pointer" : "default",
                color: isActive
                  ? "var(--text-primary)"
                  : !isAvailable && item.id !== "search"
                  ? "var(--text-muted)"
                  : "var(--text-secondary)",
                fontSize: 13,
                fontFamily: "inherit",
                fontWeight: isActive ? 500 : 400,
                textAlign: "left",
                marginBottom: 1,
                opacity: !isAvailable && item.id !== "search" ? 0.5 : 1,
              }}
            >
              <Icon size={14} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                    padding: "1px 6px",
                    borderRadius: 99,
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
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
      <div
        style={{
          padding: "8px 8px",
          borderTop: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={openSettings}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            background: "transparent",
            border: "none",
            borderRadius: 7,
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 13,
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <Settings size={14} />
          Settings
        </button>
      </div>
    </aside>
  );
}
