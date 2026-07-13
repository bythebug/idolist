import {
  SCHEMA_VERSION,
  normalizePersistedState,
  todayStr,
  type PersistedState,
  type StorageAdapter,
} from "@idolist/core";

const STORAGE_KEY = "lifeos_v1";

export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.schemaVersion !== SCHEMA_VERSION) return null;
    return normalizePersistedState(parsed);
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be full — silently fail
  }
}

export const localStorageAdapter: StorageAdapter = {
  load: loadState,
  save: saveState,
};

export function exportData(state: PersistedState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `idolist-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
