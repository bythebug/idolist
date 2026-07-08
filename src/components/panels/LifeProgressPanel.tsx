"use client";

import { useMemo } from "react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { getSubtreeCompletionRatio } from "@/lib/tree";

// Stable colors for root areas (cycles if more than 8)
const AREA_COLORS = [
  "#5B8CF5", // blue
  "#10B981", // green
  "#8B5CF6", // purple
  "#F59E0B", // amber
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#EF4444", // red
  "#84CC16", // lime
];

export function LifeProgressPanel() {
  const { nodes, rootIds } = useStore(
    useShallow((s) => ({ nodes: s.nodes, rootIds: s.rootIds }))
  );

  const overallRatio = useMemo(() => {
    const allNodes = Object.values(nodes).filter((n) => !n.archived);
    const leaves = allNodes.filter((n) => n.childIds.length === 0);
    if (leaves.length === 0) return 0;
    return leaves.filter((n) => n.completed).length / leaves.length;
  }, [nodes]);

  const areas = useMemo(
    () =>
      rootIds
        .map((id, i) => {
          const node = nodes[id];
          if (!node || node.archived) return null;
          const ratio = getSubtreeCompletionRatio(nodes, id);
          return { id, title: node.title, icon: node.icon, ratio, color: AREA_COLORS[i % AREA_COLORS.length] };
        })
        .filter(Boolean) as { id: string; title: string; icon: string | null; ratio: number; color: string }[],
    [nodes, rootIds]
  );

  const pct = Math.round(overallRatio * 100);
  const totalLeaves = useMemo(
    () => Object.values(nodes).filter((n) => !n.archived && n.childIds.length === 0).length,
    [nodes]
  );
  const completedLeaves = useMemo(
    () =>
      Object.values(nodes).filter(
        (n) => !n.archived && n.childIds.length === 0 && n.completed
      ).length,
    [nodes]
  );

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "14px" }}>
      {/* Header */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 12,
        }}
      >
        Life Progress
      </div>

      {/* Big percentage */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
        <span
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {pct}%
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Overall Progress</span>
      </div>

      {/* Overall progress bar */}
      <div
        style={{
          height: 6,
          background: "var(--border)",
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: pct === 100 ? "var(--success)" : "var(--accent)",
            borderRadius: 3,
            transition: "width 400ms ease",
          }}
        />
      </div>

      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
        {completedLeaves} of {totalLeaves} tasks
      </div>

      {/* Area breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {areas.map((area) => (
          <div key={area.id}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                {area.icon ? (
                  <span style={{ fontSize: 12 }}>{area.icon}</span>
                ) : (
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
                )}
                {area.title}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {Math.round(area.ratio * 100)}%
              </span>
            </div>
            <div
              style={{
                height: 3,
                background: "var(--border)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${area.ratio * 100}%`,
                  background: area.color,
                  borderRadius: 2,
                  transition: "width 400ms ease",
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
