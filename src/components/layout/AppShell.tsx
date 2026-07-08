"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    checkTodayReset();
    checkRepeatingTasks();
  }, [checkTodayReset, checkRepeatingTasks]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useKeyboard();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "var(--sidebar-width) 1fr var(--panel-width)",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-app)",
      }}
    >
      <Sidebar />

      <main
        style={{
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

      <ContextPanel />

      {commandPaletteOpen && <CommandPalette />}
      {shortcutsOpen && <ShortcutsModal />}
      {settingsOpen && <SettingsModal onClose={closeSettings} />}
      <Toast />
    </div>
  );
}
