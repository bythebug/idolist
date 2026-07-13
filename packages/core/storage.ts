import type { LifeNode, View } from "./types";
import { createSeedData } from "./seed";

export const SCHEMA_VERSION = 1;

export interface PersistedState {
  schemaVersion: number;
  nodes: Record<string, LifeNode>;
  rootIds: string[];
  collapsedIds: string[];
  todayIds: string[];
  lastResetDate: string;
  view: View;
  darkMode: boolean;
  userName?: string;
  userAvatar?: string;
}

// Platform persistence is injected into the store as an adapter.
// Web: localStorage. Mobile: MMKV (local) + CloudKit (sync).
// Both localStorage and MMKV are synchronous, so the interface is sync;
// async backends (CloudKit) layer behind a sync local cache.
export interface StorageAdapter {
  load(): PersistedState | null;
  save(state: PersistedState): void;
}

// Patches nodes persisted before newer fields existed
export function normalizePersistedState(parsed: PersistedState): PersistedState {
  for (const node of Object.values(parsed.nodes)) {
    if (node.repeat === undefined) node.repeat = "none";
    if (node.lastCompletedAt === undefined) node.lastCompletedAt = null;
    if (node.dueTime === undefined) node.dueTime = null;
  }
  return parsed;
}

export function defaultPersistedState(): PersistedState {
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
