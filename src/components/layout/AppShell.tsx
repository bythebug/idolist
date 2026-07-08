"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { Sidebar } from "./Sidebar";
import { ContextPanel } from "./ContextPanel";
import { LifeTree } from "@/components/tree/LifeTree";
import { TodayView } from "@/components/panels/TodayView";
import { UpcomingView } from "@/components/panels/UpcomingView";
import { CompletedView } from "@/components/panels/CompletedView";
import { ArchiveView } from "@/components/panels/ArchiveView";
import { SettingsModal } from "@/components/overlays/SettingsModal";
import { CommandPalette } from "@/components/overlays/CommandPalette";
import { ShortcutsModal } from "@/components/overlays/ShortcutsModal";
import { useKeyboard } from "@/hooks/useKeyboard";
import { Toast } from "@/components/ui/Toast";

const SIDEBAR_MIN = 160;
const SIDEBAR_MAX = 400;
const PANEL_MIN = 200;
const PANEL_MAX = 500;
const SIDEBAR_DEFAULT = 210;
const PANEL_DEFAULT = 260;

function ResizeHandle({ onDragStart }: { onDragStart: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onDragStart}
      style={{ width: 6, flexShrink: 0, cursor: "col-resize", position: "relative", zIndex: 10 }}
      onMouseEnter={(e) => {
        ((e.currentTarget as HTMLElement).firstChild as HTMLElement).style.background = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        ((e.currentTarget as HTMLElement).firstChild as HTMLElement).style.background = "var(--border)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 2,
          width: 1,
          background: "var(--border)",
          transition: "background 120ms",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export function AppShell() {
  const { view, darkMode, commandPaletteOpen, shortcutsOpen, settingsOpen, checkTodayReset, checkRepeatingTasks, closeSettings } =
    useStore(useShallow((s) => ({
      view: s.view,
      darkMode: s.darkMode,
      commandPaletteOpen: s.commandPaletteOpen,
      shortcutsOpen: s.shortcutsOpen,
      settingsOpen: s.settingsOpen,
      checkTodayReset: s.checkTodayReset,
      checkRepeatingTasks: s.checkRepeatingTasks,
      closeSettings: s.closeSettings,
    })));

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT);

  useEffect(() => {
    const sw = parseInt(localStorage.getItem("idolist-sidebar-width") || String(SIDEBAR_DEFAULT), 10);
    const pw = parseInt(localStorage.getItem("idolist-panel-width") || String(PANEL_DEFAULT), 10);
    setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, sw)));
    setPanelWidth(Math.max(PANEL_MIN, Math.min(PANEL_MAX, pw)));
  }, []);

  useEffect(() => {
    checkTodayReset();
    checkRepeatingTasks();
  }, [checkTodayReset, checkRepeatingTasks]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useKeyboard();

  const startResize = useCallback((side: "left" | "right", e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = side === "left" ? sidebarWidth : panelWidth;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX;
      if (side === "left") {
        const w = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startWidth + delta));
        setSidebarWidth(w);
        localStorage.setItem("idolist-sidebar-width", String(w));
      } else {
        const w = Math.max(PANEL_MIN, Math.min(PANEL_MAX, startWidth - delta));
        setPanelWidth(w);
        localStorage.setItem("idolist-panel-width", String(w));
      }
    }

    function onUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    e.preventDefault();
  }, [sidebarWidth, panelWidth]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-app)",
      }}
    >
      <div style={{ width: sidebarWidth, flexShrink: 0, overflow: "hidden" }}>
        <Sidebar />
      </div>

      <ResizeHandle onDragStart={(e) => startResize("left", e)} />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-app)",
        }}
      >
        {view === "life" && <LifeTree />}
        {view === "today" && <TodayView />}
        {view === "upcoming" && <UpcomingView />}
        {view === "completed" && <CompletedView />}
        {view === "archive" && <ArchiveView />}
      </main>

      <ResizeHandle onDragStart={(e) => startResize("right", e)} />

      <div style={{ width: panelWidth, flexShrink: 0, overflow: "hidden" }}>
        <ContextPanel />
      </div>

      {commandPaletteOpen && <CommandPalette />}
      {shortcutsOpen && <ShortcutsModal />}
      {settingsOpen && <SettingsModal onClose={closeSettings} />}
      <Toast />
    </div>
  );
}
