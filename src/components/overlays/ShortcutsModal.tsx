"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useStore } from "@/store";

const SHORTCUTS = [
  {
    group: "Navigation",
    items: [
      { keys: ["↑", "↓"], desc: "Move up / down" },
      { keys: ["→"], desc: "Expand / go to child" },
      { keys: ["←"], desc: "Collapse / go to parent" },
      { keys: ["Esc"], desc: "Clear selection" },
    ],
  },
  {
    group: "Editing",
    items: [
      { keys: ["Enter"], desc: "Edit or create sibling" },
      { keys: ["Tab"], desc: "Indent node" },
      { keys: ["⇧Tab"], desc: "Outdent node" },
      { keys: ["Backspace"], desc: "Delete empty node" },
    ],
  },
  {
    group: "Actions",
    items: [
      { keys: ["Space"], desc: "Toggle complete" },
      { keys: ["⌘T"], desc: "Add to Today" },
      { keys: ["⌘D"], desc: "Duplicate" },
      { keys: ["⌘⌫"], desc: "Delete node" },
    ],
  },
  {
    group: "Global",
    items: [
      { keys: ["⌘K"], desc: "Search" },
      { keys: ["⌘/"], desc: "Show shortcuts" },
      { keys: ["⌘Z"], desc: "Undo" },
      { keys: ["⌘⇧Z"], desc: "Redo" },
    ],
  },
];

export function ShortcutsModal() {
  const closeShortcuts = useStore((s) => s.closeShortcuts);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={closeShortcuts}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          maxWidth: "calc(100vw - 32px)",
          background: "var(--bg-app)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-overlay)",
          zIndex: 101,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Keyboard Shortcuts
          </h3>
          <button
            onClick={closeShortcuts}
            aria-label="Close shortcuts"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
              borderRadius: 5,
              display: "flex",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Shortcut groups */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            maxHeight: 480,
            overflow: "auto",
          }}
        >
          {SHORTCUTS.map((group) => (
            <div
              key={group.group}
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border-subtle)",
                borderRight: "1px solid var(--border-subtle)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {group.group}
              </h4>
              {group.items.map((item) => (
                <div
                  key={item.desc}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {item.desc}
                  </span>
                  <div style={{ display: "flex", gap: 3 }}>
                    {item.keys.map((k) => (
                      <kbd
                        key={k}
                        style={{
                          fontSize: 11,
                          fontFamily: "inherit",
                          padding: "2px 6px",
                          background: "var(--bg-sidebar)",
                          border: "1px solid var(--border)",
                          borderRadius: 5,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
