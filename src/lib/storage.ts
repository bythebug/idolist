import type { LifeNode, View } from "@/types";
import { createSeedData } from "./seed";

const STORAGE_KEY = "lifeos_v1";
const SCHEMA_VERSION = 1;

export interface PersistedState {
  schemaVersion: number;
  nodes: Record<string, LifeNode>;
  rootIds: string[];
  collapsedIds: string[];
  todayIds: string[];
  lastResetDate: string;
  view: View;
  darkMode: boolean;
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.schemaVersion !== SCHEMA_VERSION) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be full — silently fail
  }
}

function defaultState(): PersistedState {
  const seed = createSeedData();
  return {
    schemaVersion: SCHEMA_VERSION,
    nodes: seed.nodes,
    rootIds: seed.rootIds,
    collapsedIds: [],
    todayIds: [],
    lastResetDate: todayStr(),
    view: "life",
    darkMode: false,
  };
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportData(state: PersistedState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lifeos-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
