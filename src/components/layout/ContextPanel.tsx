"use client";

import { useStore } from "@/store";
import { NodeDetails } from "@/components/panels/NodeDetails";

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
      }}
    >
      {selectedId ? (
        <NodeDetails id={selectedId} />
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: 13,
            padding: 24,
            textAlign: "center",
          }}
        >
          Select a node to see details
        </div>
      )}
    </aside>
  );
}
