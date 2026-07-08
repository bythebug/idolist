"use client";

import { useStore } from "@/store";
import { NodeDetails } from "@/components/panels/NodeDetails";
import { TodayPanel } from "@/components/panels/TodayPanel";
import { LifeProgressPanel } from "@/components/panels/LifeProgressPanel";

export function ContextPanel() {
  const selectedId = useStore((s) => s.selectedId);

  return (
    <aside
      style={{
        background: "var(--bg-panel)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Always-visible: Today list + Life Progress */}
      <TodayPanel />
      <LifeProgressPanel />

      {/* NodeDetails slides in over the top when a node is selected */}
      {selectedId && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--bg-panel)",
            display: "flex",
            flexDirection: "column",
            zIndex: 10,
            borderLeft: "1px solid var(--border)",
          }}
        >
          <NodeDetails id={selectedId} />
        </div>
      )}
    </aside>
  );
}
