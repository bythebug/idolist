"use client";

import {
  Home,
  Sun,
  Clock,
  CheckCircle2,
  Archive,
  Settings,
  Search,
} from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { selectCompletionRatio, selectTodayCount, selectUpcomingCount } from "@/store/selectors";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { View } from "@/types";

const NAV_ITEMS: { id: View; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "life", label: "Life", icon: Home },
  { id: "today", label: "Today", icon: Sun },
  { id: "upcoming", label: "Upcoming", icon: Clock },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "archive", label: "Archive", icon: Archive },
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

  const ratio = selectCompletionRatio(nodes);
  const todayCount = selectTodayCount(todayIds);
  const upcomingCount = selectUpcomingCount(nodes);

  const totalNodes = Object.values(nodes).filter((n) => !n.archived).length;
  const completedNodes = Object.values(nodes).filter((n) => n.completed && !n.archived).length;

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
      {/* App title */}
      <div
        style={{
          padding: "20px 16px 12px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          LifeOS
        </h2>
      </div>

      {/* Search */}
      <div style={{ padding: "8px 12px", flexShrink: 0 }}>
        <button
          onClick={openCommandPalette}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            background: "var(--bg-app)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
            color: "var(--text-placeholder)",
            fontSize: 13,
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <Search size={13} />
          <span style={{ flex: 1 }}>Search...</span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              background: "var(--border)",
              padding: "1px 5px",
              borderRadius: 4,
            }}
          >
            ⌘K
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "4px 8px", overflow: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.id;
          const badge =
            item.id === "today"
              ? todayCount
              : item.id === "upcoming"
              ? upcomingCount
              : 0;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                background: isActive ? "var(--bg-node-selected)" : "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                fontSize: 14,
                fontFamily: "inherit",
                fontWeight: isActive ? 500 : 400,
                textAlign: "left",
                marginBottom: 2,
              }}
            >
              <Icon size={15} />
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

      {/* Bottom: progress + stats */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <ProgressRing value={ratio} size={36} strokeWidth={3} />
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {Math.round(ratio * 100)}% complete
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 1,
              }}
            >
              {completedNodes} of {totalNodes} tasks
            </div>
          </div>
        </div>

        <button
          onClick={openSettings}
          style={{
            marginTop: 10,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 8px",
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
