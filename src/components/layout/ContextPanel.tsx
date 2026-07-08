"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store";
import { NodeDetails } from "@/components/panels/NodeDetails";
import { TodayPanel } from "@/components/panels/TodayPanel";

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
      {/* Always-visible: Today list */}
      <TodayPanel fillHeight />

      {/* NodeDetails slides in when a node is selected */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            key={selectedId}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
