"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Download, Upload, Trash2, X } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { exportData, loadState, saveState } from "@/lib/storage";

const VERSION = "1.0.0";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { darkMode, nodes, rootIds, collapsedIds, todayIds, lastResetDate, view, toggleDarkMode } =
    useStore(useShallow((s) => ({
      darkMode: s.darkMode,
      nodes: s.nodes,
      rootIds: s.rootIds,
      collapsedIds: s.collapsedIds,
      todayIds: s.todayIds,
      lastResetDate: s.lastResetDate,
      view: s.view,
      toggleDarkMode: s.toggleDarkMode,
    })));

  function handleExport() {
    exportData({
      schemaVersion: 1,
      nodes,
      rootIds,
      collapsedIds: Array.from(collapsedIds),
      todayIds: Array.from(todayIds),
      lastResetDate,
      view,
      darkMode,
    });
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (json.schemaVersion !== 1 || !json.nodes || !json.rootIds) {
          alert("Invalid backup file — cannot import.");
          return;
        }
        saveState(json);
        window.location.reload();
      } catch {
        alert("Could not parse backup file.");
      }
    };
    reader.readAsText(file);
  }

  function handleClearAll() {
    if (!confirm("Delete ALL data and reset to sample tree? This cannot be undone.")) return;
    localStorage.clear();
    window.location.reload();
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      {/* Modal */}
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
          width: 380,
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
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            Settings
          </h3>
          <button
            onClick={onClose}
            aria-label="Close settings"
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

        {/* Body */}
        <div style={{ padding: "8px 0" }}>
          {/* Dark mode */}
          <SettingRow
            icon={darkMode ? <Moon size={15} /> : <Sun size={15} />}
            label={darkMode ? "Dark mode" : "Light mode"}
            description="Toggle appearance"
          >
            <button
              onClick={toggleDarkMode}
              aria-pressed={darkMode}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: darkMode ? "var(--accent)" : "var(--border)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background 200ms",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <motion.span
                animate={{ x: darkMode ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{
                  position: "absolute",
                  top: 3,
                  left: 0,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  display: "block",
                }}
              />
            </button>
          </SettingRow>

          <div
            style={{
              height: 1,
              background: "var(--border-subtle)",
              margin: "4px 16px",
            }}
          />

          {/* Export */}
          <SettingRow
            icon={<Download size={15} />}
            label="Export data"
            description="Download a JSON backup"
          >
            <button onClick={handleExport} style={actionBtnStyle}>
              Export
            </button>
          </SettingRow>

          {/* Import */}
          <SettingRow
            icon={<Upload size={15} />}
            label="Import data"
            description="Restore from JSON backup"
          >
            <button onClick={() => fileInputRef.current?.click()} style={actionBtnStyle}>
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: "none" }}
            />
          </SettingRow>

          <div
            style={{
              height: 1,
              background: "var(--border-subtle)",
              margin: "4px 16px",
            }}
          />

          {/* Clear all */}
          <SettingRow
            icon={<Trash2 size={15} />}
            label="Clear all data"
            description="Reset to sample tree"
            danger
          >
            <button
              onClick={handleClearAll}
              style={{ ...actionBtnStyle, color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}
            >
              Clear
            </button>
          </SettingRow>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--border-subtle)",
            fontSize: 11,
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          LifeOS v{VERSION}
        </div>
      </motion.div>
    </>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: "4px 12px",
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 12,
  color: "var(--text-secondary)",
  fontFamily: "inherit",
  fontWeight: 500,
  whiteSpace: "nowrap",
};

function SettingRow({
  icon,
  label,
  description,
  danger,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
      }}
    >
      <div style={{ color: danger ? "var(--danger)" : "var(--text-muted)", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: danger ? "var(--danger)" : "var(--text-primary)",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
          {description}
        </div>
      </div>
      {children}
    </div>
  );
}
