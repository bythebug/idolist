"use client";

import { useMemo } from "react";
import {
  Home,
  Sun,
  Inbox,
  Search,
  GitBranch,
  Calendar,
  StickyNote,
  Settings,
} from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectTodayCount } from "@/store/selectors";
import { getSubtreeCompletionRatio } from "@/lib/tree";
import type { View } from "@/types";

// Stable area colors — must match LifeProgressPanel
const AREA_COLORS = [
  "#5B8CF5", "#10B981", "#8B5CF6", "#F59E0B",
  "#EC4899", "#06B6D4", "#EF4444", "#84CC16",
];

const NAV_ITEMS: { id: View | "inbox" | "graph" | "calendar" | "notes"; label: string; icon: React.ComponentType<{ size?: number }>; view?: View }[] = [
  { id: "life",     label: "Life",     icon: Home,       view: "life" },
  { id: "today",    label: "Today",    icon: Sun,        view: "today" },
  { id: "inbox",    label: "Inbox",    icon: Inbox },
  { id: "search",   label: "Search",   icon: Search },
  { id: "graph",    label: "Graph",    icon: GitBranch },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "notes",    label: "Notes",    icon: StickyNote },
];

export function Sidebar() {
  const { view, nodes, rootIds, todayIds, setView, openCommandPalette, openSettings } = useStore(
    useShallow((s) => ({
      view: s.view,
      nodes: s.nodes,
      rootIds: s.rootIds,
      todayIds: s.todayIds,
      setView: s.setView,
      openCommandPalette: s.openCommandPalette,
      openSettings: s.openSettings,
    }))
  );

  const todayCount = selectTodayCount(todayIds);

  const areas = useMemo(
    () =>
      rootIds
        .map((id, i) => {
          const node = nodes[id];
          if (!node || node.archived) return null;
          return {
            id,
            title: node.title,
            icon: node.icon,
            color: AREA_COLORS[i % AREA_COLORS.length],
            ratio: getSubtreeCompletionRatio(nodes, id),
          };
        })
        .filter(Boolean) as { id: string; title: string; icon: string | null; color: string; ratio: number }[],
    [nodes, rootIds]
  );

  return (
    <aside
      style={{
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        userSelect: "none",
      }}
    >
      {/* App identity */}
      <div
        style={{
          padding: "16px 14px 10px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            🌿
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              My Life
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Personal OS</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "6px 8px", overflow: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.view ? view === item.view : false;
          const isAvailable = !!item.view;
          const badge = item.id === "today" ? todayCount : 0;

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

      {/* Life areas */}
      {areas.length > 0 && (
        <div
          style={{
            padding: "10px 14px",
            borderTop: "1px solid var(--border-subtle)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Areas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {areas.map((area) => (
              <div
                key={area.id}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => setView("life")}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: area.color,
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  {area.icon ? `${area.icon} ` : ""}{area.title}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                  {Math.round(area.ratio * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
