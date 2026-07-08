import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";

// Immer requires this to support Set and Map mutations in producers
enableMapSet();
import type { LifeNode, View, DragState } from "@/types";
import { getSubtree } from "@/lib/tree";
import {
  loadState,
  saveState,
  todayStr,
  type PersistedState,
} from "@/lib/storage";

interface StoreState {
  nodes: Record<string, LifeNode>;
  rootIds: string[];
  collapsedIds: Set<string>;
  selectedId: string | null;
  focusedId: string | null;
  editingId: string | null;
  view: View;
  commandPaletteOpen: boolean;
  shortcutsOpen: boolean;
  todayIds: Set<string>;
  lastResetDate: string;
  dragState: DragState | null;
  darkMode: boolean;
}

interface StoreActions {
  // Node mutations
  addNode: (parentId: string | null, afterId?: string | null) => string;
  updateNode: (id: string, changes: Partial<LifeNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, newParentId: string | null, newIndex: number) => void;
  toggleComplete: (id: string) => void;
  toggleCollapsed: (id: string) => void;
  duplicateNode: (id: string) => string;
  indentNode: (id: string) => void;
  outdentNode: (id: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  archiveNode: (id: string) => void;

  // UI
  setSelected: (id: string | null) => void;
  setFocused: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  setView: (view: View) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;

  // Today
  addToToday: (id: string) => void;
  removeFromToday: (id: string) => void;
  checkTodayReset: () => void;

  // Drag
  setDragState: (state: DragState | null) => void;

  // Settings
  toggleDarkMode: () => void;

  // Persistence
  persist: () => void;
}

export type LifeOSStore = StoreState & StoreActions;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedSave(get: () => LifeOSStore) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = get();
    const persisted: PersistedState = {
      schemaVersion: 1,
      nodes: s.nodes,
      rootIds: s.rootIds,
      collapsedIds: Array.from(s.collapsedIds),
      todayIds: Array.from(s.todayIds),
      lastResetDate: s.lastResetDate,
      view: s.view,
      darkMode: s.darkMode,
    };
    saveState(persisted);
  }, 300);
}

function loadInitialState(): StoreState {
  if (typeof window === "undefined") {
    return emptyState();
  }

  const persisted = loadState();
  const today = todayStr();
  let todayIds = new Set(persisted.todayIds);

  // Reset completed today items if date changed
  if (persisted.lastResetDate !== today) {
    const completedTodayIds = Array.from(todayIds).filter(
      (id) => persisted.nodes[id]?.completed
    );
    completedTodayIds.forEach((id) => todayIds.delete(id));
  }

  return {
    nodes: persisted.nodes,
    rootIds: persisted.rootIds,
    collapsedIds: new Set(persisted.collapsedIds),
    todayIds,
    lastResetDate: today,
    selectedId: null,
    focusedId: null,
    editingId: null,
    view: persisted.view ?? "life",
    commandPaletteOpen: false,
    shortcutsOpen: false,
    dragState: null,
    darkMode: persisted.darkMode ?? false,
  };
}

function emptyState(): StoreState {
  return {
    nodes: {},
    rootIds: [],
    collapsedIds: new Set(),
    todayIds: new Set(),
    lastResetDate: todayStr(),
    selectedId: null,
    focusedId: null,
    editingId: null,
    view: "life",
    commandPaletteOpen: false,
    shortcutsOpen: false,
    dragState: null,
    darkMode: false,
  };
}

export const useStore = create<LifeOSStore>()(
  immer((set, get) => ({
    ...loadInitialState(),

    addNode: (parentId, afterId) => {
      const id = nanoid();
      const now = Date.now();
      set((state) => {
        const newNode: LifeNode = {
          id,
          title: "",
          type: parentId === null ? "area" : "task",
          parentId,
          childIds: [],
          completed: false,
          collapsed: false,
          archived: false,
          reminder: "none",
          dueDate: null,
          notes: "",
          icon: null,
          createdAt: now,
          updatedAt: now,
        };
        state.nodes[id] = newNode;

        if (parentId) {
          const parent = state.nodes[parentId];
          if (parent) {
            if (afterId) {
              const idx = parent.childIds.indexOf(afterId);
              parent.childIds.splice(idx === -1 ? parent.childIds.length : idx + 1, 0, id);
            } else {
              parent.childIds.push(id);
            }
          }
        } else {
          if (afterId) {
            const idx = state.rootIds.indexOf(afterId);
            state.rootIds.splice(idx === -1 ? state.rootIds.length : idx + 1, 0, id);
          } else {
            state.rootIds.push(id);
          }
        }
      });
      debouncedSave(get);
      return id;
    },

    updateNode: (id, changes) => {
      set((state) => {
        const node = state.nodes[id];
        if (!node) return;
        Object.assign(node, changes, { updatedAt: Date.now() });
      });
      debouncedSave(get);
    },

    deleteNode: (id) => {
      set((state) => {
        const subtree = getSubtree(state.nodes as Record<string, LifeNode>, id);
        const node = state.nodes[id];
        if (!node) return;

        // Remove from parent or rootIds
        if (node.parentId) {
          const parent = state.nodes[node.parentId];
          if (parent) {
            parent.childIds = parent.childIds.filter((cid) => cid !== id);
          }
        } else {
          state.rootIds = state.rootIds.filter((rid) => rid !== id);
        }

        // Remove all nodes in subtree
        for (const sid of subtree) {
          delete state.nodes[sid];
          state.collapsedIds.delete(sid);
          state.todayIds.delete(sid);
        }

        // Clear UI references
        if (state.selectedId && subtree.includes(state.selectedId)) {
          state.selectedId = null;
        }
        if (state.focusedId && subtree.includes(state.focusedId)) {
          state.focusedId = null;
        }
        if (state.editingId && subtree.includes(state.editingId)) {
          state.editingId = null;
        }
      });
      debouncedSave(get);
    },

    moveNode: (id, newParentId, newIndex) => {
      set((state) => {
        const node = state.nodes[id];
        if (!node) return;

        // Remove from old location
        if (node.parentId) {
          const oldParent = state.nodes[node.parentId];
          if (oldParent) {
            oldParent.childIds = oldParent.childIds.filter((cid) => cid !== id);
          }
        } else {
          state.rootIds = state.rootIds.filter((rid) => rid !== id);
        }

        // Insert at new location
        node.parentId = newParentId;
        node.updatedAt = Date.now();

        if (newParentId) {
          const newParent = state.nodes[newParentId];
          if (newParent) {
            newParent.childIds.splice(newIndex, 0, id);
          }
        } else {
          state.rootIds.splice(newIndex, 0, id);
        }
      });
      debouncedSave(get);
    },

    toggleComplete: (id) => {
      set((state) => {
        const node = state.nodes[id];
        if (!node) return;
        node.completed = !node.completed;
        node.updatedAt = Date.now();
      });
      debouncedSave(get);
    },

    toggleCollapsed: (id) => {
      set((state) => {
        if (state.collapsedIds.has(id)) {
          state.collapsedIds.delete(id);
        } else {
          state.collapsedIds.add(id);
        }
      });
      debouncedSave(get);
    },

    duplicateNode: (id) => {
      const newId = nanoid();
      set((state) => {
        const node = state.nodes[id];
        if (!node) return;

        function deepCopy(srcId: string, parentId: string | null): string {
          const src = state.nodes[srcId];
          if (!src) return "";
          const cid = srcId === id ? newId : nanoid();
          const now = Date.now();
          const newChildIds: string[] = [];
          const copy: LifeNode = {
            ...src,
            id: cid,
            parentId,
            childIds: newChildIds,
            createdAt: now,
            updatedAt: now,
          };
          state.nodes[cid] = copy;
          for (const childId of src.childIds) {
            const copiedChildId = deepCopy(childId, cid);
            if (copiedChildId) newChildIds.push(copiedChildId);
          }
          return cid;
        }

        deepCopy(id, node.parentId);

        // Insert duplicate after original
        if (node.parentId) {
          const parent = state.nodes[node.parentId];
          if (parent) {
            const idx = parent.childIds.indexOf(id);
            parent.childIds.splice(idx + 1, 0, newId);
          }
        } else {
          const idx = state.rootIds.indexOf(id);
          state.rootIds.splice(idx + 1, 0, newId);
        }
      });
      debouncedSave(get);
      return newId;
    },

    indentNode: (id) => {
      set((state) => {
        const node = state.nodes[id];
        if (!node) return;

        const siblings = node.parentId
          ? state.nodes[node.parentId]?.childIds ?? []
          : state.rootIds;
        const idx = siblings.indexOf(id);
        if (idx <= 0) return; // no sibling above

        const newParentId = siblings[idx - 1];
        const newParent = state.nodes[newParentId];
        if (!newParent) return;

        // Remove from current location
        siblings.splice(idx, 1);

        // Append to new parent
        node.parentId = newParentId;
        node.updatedAt = Date.now();
        newParent.childIds.push(id);

        // Expand new parent
        state.collapsedIds.delete(newParentId);
      });
      debouncedSave(get);
    },

    outdentNode: (id) => {
      set((state) => {
        const node = state.nodes[id];
        if (!node || !node.parentId) return;

        const parent = state.nodes[node.parentId];
        if (!parent) return;

        const grandParentId = parent.parentId;
        const grandParentSiblings = grandParentId
          ? state.nodes[grandParentId]?.childIds
          : state.rootIds;
        if (!grandParentSiblings) return;

        // Remove from parent
        parent.childIds = parent.childIds.filter((cid) => cid !== id);

        // Insert after parent in grandparent
        const parentIdx = grandParentSiblings.indexOf(node.parentId);
        node.parentId = grandParentId ?? null;
        node.updatedAt = Date.now();
        grandParentSiblings.splice(parentIdx + 1, 0, id);
      });
      debouncedSave(get);
    },

    collapseAll: () => {
      set((state) => {
        for (const node of Object.values(state.nodes)) {
          if ((node as LifeNode).childIds.length > 0) {
            state.collapsedIds.add((node as LifeNode).id);
          }
        }
      });
      debouncedSave(get);
    },

    expandAll: () => {
      set((state) => {
        state.collapsedIds.clear();
      });
      debouncedSave(get);
    },

    archiveNode: (id) => {
      set((state) => {
        const subtree = getSubtree(state.nodes as Record<string, LifeNode>, id);
        for (const sid of subtree) {
          if (state.nodes[sid]) state.nodes[sid].archived = true;
        }
        if (state.selectedId && subtree.includes(state.selectedId)) {
          state.selectedId = null;
        }
        if (state.focusedId && subtree.includes(state.focusedId)) {
          state.focusedId = null;
        }
      });
      debouncedSave(get);
    },

    setSelected: (id) =>
      set((state) => {
        state.selectedId = id;
      }),

    setFocused: (id) =>
      set((state) => {
        state.focusedId = id;
      }),

    setEditing: (id) =>
      set((state) => {
        state.editingId = id;
      }),

    setView: (view) => {
      set((state) => {
        state.view = view;
        state.selectedId = null;
      });
      debouncedSave(get);
    },

    openCommandPalette: () =>
      set((state) => {
        state.commandPaletteOpen = true;
      }),

    closeCommandPalette: () =>
      set((state) => {
        state.commandPaletteOpen = false;
      }),

    openShortcuts: () =>
      set((state) => {
        state.shortcutsOpen = true;
      }),

    closeShortcuts: () =>
      set((state) => {
        state.shortcutsOpen = false;
      }),

    addToToday: (id) => {
      set((state) => {
        state.todayIds.add(id);
      });
      debouncedSave(get);
    },

    removeFromToday: (id) => {
      set((state) => {
        state.todayIds.delete(id);
      });
      debouncedSave(get);
    },

    checkTodayReset: () => {
      set((state) => {
        const today = todayStr();
        if (state.lastResetDate !== today) {
          const completedIds = Array.from(state.todayIds).filter(
            (id) => state.nodes[id]?.completed
          );
          completedIds.forEach((id) => state.todayIds.delete(id));
          state.lastResetDate = today;
        }
      });
      debouncedSave(get);
    },

    setDragState: (dragState) =>
      set((state) => {
        state.dragState = dragState;
      }),

    toggleDarkMode: () => {
      set((state) => {
        state.darkMode = !state.darkMode;
      });
      debouncedSave(get);
    },

    persist: () => {
      debouncedSave(get);
    },
  }))
);
