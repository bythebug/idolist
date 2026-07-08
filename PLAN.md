# LifeOS — Master Build Plan

## Context

LifeOS is a personal operating system — a single-page application built around a hierarchical life tree. The user wants a premium, keyboard-first productivity tool that feels like Linear/Notion rather than Jira/ClickUp. This document is the **single source of truth** for how we build it, phase by phase.

---

## Current Status — Updated 2026-07-08

```
✅ Phase 0  — Bootstrap + tooling
✅ Phase 1  — Types + pure tree utilities (31 tests passing)
✅ Phase 2  — Zustand store (all node operations)
✅ Phase 3  — Persistence layer (localStorage + seed data)
✅ Phase 4  — App shell + layout grid
✅ Phase 5  — ProgressRing component
✅ Phase 6  — Tree rendering (virtualized, React.memo)
✅ Phase 7  — Keyboard navigation (arrow keys, Enter, Tab, Space, Cmd shortcuts)
✅ Phase 8  — Drag & drop (@dnd-kit, drop indicators, ghost overlay)
✅ Phase 9  — Inline editing (Enter/Tab/Shift+Tab/Backspace/Escape in TreeNodeTitle)
✅ Phase 10 — Command palette (Cmd+K, fuse.js fuzzy search)
✅ Phase 11 — Today system (Cmd+T, midnight reset, badge count)
✅ Phase 12 — Context panel / NodeDetails (breadcrumb, notes, due date, reminder)
✅ Phase 13 — Upcoming & Notifications view
✅ Phase 14 — Completed & Archive views
✅ Phase 15 — Undo / Redo (snapshot-based, 100-entry stack, toast)
✅ Phase 16 — Micro-interactions & Polish (Framer Motion)
✅ Phase 17 — Shortcuts modal (Cmd+/)
✅ Phase 18 — Settings panel (export, import, clear, dark mode toggle)
✅ Phase 19 — Dark mode (CSS vars, animated toggle, persisted)

⬜ Phase 20 — Final QA & Performance ← NEXT
```

---

## Implementation Notes (what diverged from the plan)

| Plan | What was built | Why |
|---|---|---|
| Next.js 15 | Next.js 16.2.10 | Latest available |
| Separate store slices | Combined store in `src/store/index.ts` | Simpler, fewer files |
| `useTreeNavigation.ts` + `useInlineEdit.ts` | Combined into `useKeyboard.ts` | Less indirection |
| Inline edit logic in hook | Lives in `TreeNodeTitle.tsx` | Closer to the input it controls |
| `StoreProvider` wrapper | `dynamic({ ssr: false })` in page.tsx | Prevents hydration mismatch |
| Command pattern for undo | Snapshot-based (before/after nodes+rootIds) | Simpler, handles batch mutations, no command objects needed |
| `historySlice` | `recordHistory()` local function inside store closure | No extra slice file |

### Bugs Fixed During Build
- `enableMapSet()` from Immer required for `Set<string>` mutations in producers
- `useShallow` required on all object selectors (Zustand v5 + `useSyncExternalStore`)
- Derived arrays (`selectVisibleNodes`, `selectBreadcrumb`) must be computed with `useMemo` outside selectors, not inside them
- `suppressBlurRef` in `TreeNodeTitle` prevents blur from deleting a node when Enter creates a sibling
- `storeRef` pattern in `useKeyboard` prevents listener re-registration on every state change
- `@dnd-kit/modifiers` required separate install (`npm install @dnd-kit/modifiers --legacy-peer-deps`)
- Immer frozen objects can be assigned back to draft state via structural sharing — undo/redo works without deep cloning

---

## Technology Stack

| Concern | Choice | Actual Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.10 |
| Language | TypeScript strict | 5.x |
| Styling | Tailwind CSS v4 + CSS custom properties | v4 |
| State | Zustand + Immer | Zustand 5, Immer 11 |
| Animations | Framer Motion | 12.x |
| Icons | Lucide React | 1.x |
| Fonts | Inter (next/font) | ✅ |
| Drag & Drop | @dnd-kit/core + @dnd-kit/modifiers | 6.x |
| Virtual Scroll | @tanstack/react-virtual | 3.x |
| Persistence | localStorage (debounced 300ms) | ✅ |
| Testing | Vitest + Testing Library | Vitest 4.x |

---

## Architectural Decisions

### Node Storage: Flat Map
```typescript
nodes: Record<string, LifeNode>  // O(1) lookup/move
rootIds: string[]                 // top-level order
// Each LifeNode has parentId: string | null, childIds: string[]
```

### Selector Pattern (Zustand v5)
```typescript
// ✅ CORRECT — primitives + useShallow, derived values with useMemo
const { nodes, rootIds } = useStore(useShallow((s) => ({ nodes: s.nodes, rootIds: s.rootIds })));
const visibleNodes = useMemo(() => selectVisibleNodes(nodes, rootIds, ..), [nodes, rootIds]);

// ❌ WRONG — derived array inside selector causes infinite loop
const { visibleNodes } = useStore(useShallow((s) => ({ visibleNodes: computeArray(s) })));
```

### Undo/Redo (snapshot-based)
```typescript
// Before each tracked mutation, capture snapshot:
const beforeNodes = get().nodes;
const beforeRootIds = get().rootIds;
set((state) => { /* mutation */ });
recordHistory("description", beforeNodes, beforeRootIds);
// recordHistory reads afterNodes/afterRootIds from get() and pushes HistoryEntry
```

### SSR Safety
```typescript
// page.tsx — ssr: false prevents hydration mismatch for localStorage-driven app
const AppShell = dynamic(() => import("@/components/layout/AppShell"), { ssr: false });
```

---

## Folder Structure (actual)

```
src/
├── app/
│   ├── layout.tsx          ✅ Inter font, html lang
│   ├── page.tsx            ✅ dynamic({ ssr: false })
│   └── globals.css         ✅ CSS design tokens (light + dark vars)
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx    ✅ 3-column grid, keyboard hook, dark mode
│   │   ├── Sidebar.tsx     ✅ Nav, search button, progress ring, stats, settings button
│   │   └── ContextPanel.tsx ✅ Right panel shell
│   ├── tree/
│   │   ├── LifeTree.tsx         ✅ Virtualized + DndContext, drop indicators, ghost overlay
│   │   ├── TreeNode.tsx         ✅ React.memo, useDraggable, useDroppable, archive button
│   │   ├── TreeDropIndicator.tsx ✅ Drop position line (before/after/inside)
│   │   ├── TreeNodeCheckbox.tsx ✅ Framer Motion SVG checkmark + whileHover/whileTap spring
│   │   └── TreeNodeTitle.tsx    ✅ Inline edit, Enter/Tab/Backspace/Escape
│   ├── panels/
│   │   ├── NodeDetails.tsx  ✅ Breadcrumb, title, notes, due date, reminder
│   │   ├── TodayView.tsx    ✅ Today filter, date header, empty state
│   │   ├── UpcomingView.tsx ✅ Groups: Overdue/Today/Tomorrow/This Week, visibilitychange
│   │   ├── CompletedView.tsx ✅ completed && !archived, undo-complete on hover
│   │   └── ArchiveView.tsx  ✅ archived nodes, restore on hover
│   ├── overlays/
│   │   ├── CommandPalette.tsx ✅ Cmd+K, fuse.js, keyboard nav, Framer Motion entrance
│   │   ├── ShortcutsModal.tsx ✅ Cmd+/, two-column grid, kbd styling, Framer Motion entrance
│   │   └── SettingsModal.tsx  ✅ Dark mode toggle, export, import, clear all, version
│   └── ui/
│       ├── ProgressRing.tsx ✅ SVG + Framer Motion, color tiers
│       └── Toast.tsx        ✅ AnimatePresence slide-up, auto-dismiss 2.5s, keyed by id
├── store/
│   ├── index.ts            ✅ Zustand + Immer, all actions, undo/redo, toast, debounced persist
│   └── selectors.ts        ✅ selectVisibleNodes, selectBreadcrumb, selectUpcomingNodes, etc.
├── hooks/
│   └── useKeyboard.ts      ✅ storeRef pattern, all shortcuts, Cmd+Z/Cmd+Shift+Z
├── lib/
│   ├── tree.ts             ✅ Pure utilities (31 unit tests)
│   ├── storage.ts          ✅ load/save/export, schema versioning
│   └── seed.ts             ✅ Career/Health/Finance/Learning sample tree
└── types/
    └── index.ts            ✅ LifeNode, View, Command, SearchResult, DragState, HistoryEntry
```

---

## Detailed Phase-by-Phase TODO

### PHASE 0 — Project Bootstrap ✅ DONE
### PHASE 1 — Types & Data Model ✅ DONE
### PHASE 2 — Zustand Store ✅ DONE
### PHASE 3 — Persistence Layer ✅ DONE
### PHASE 4 — App Shell & Layout ✅ DONE
### PHASE 5 — ProgressRing Component ✅ DONE
### PHASE 6 — Tree Rendering ✅ DONE
### PHASE 7 — Keyboard Navigation ✅ DONE
### PHASE 9 — Inline Editing ✅ DONE (merged into Phase 7)
### PHASE 10 — Command Palette ✅ DONE
### PHASE 11 — Today System ✅ DONE
### PHASE 12 — Context Panel ✅ DONE
### PHASE 17 — Shortcuts Modal ✅ DONE

---

### PHASE 8 — Drag & Drop ✅ DONE

- [x] `DndContext` wrapping LifeTree with `PointerSensor` (8px activation threshold) + `restrictToWindowEdges`
- [x] `useDraggable` on drag handle (GripVertical icon), `useDroppable` on row
- [x] `dragInfo` local state: `{ draggingId, overId, dropPosition }`
- [x] Drop zones: top 30% = before, middle 40% = inside, bottom 30% = after
- [x] `computeDropTarget()`: rejects dropping on self or descendants; handles same-parent index shift
- [x] `DragOverlay` ghost with accent border
- [x] `TreeDropIndicator` — colored line with dot for before/after drops; accent outline for inside drops
- [x] Auto-expand collapsed nodes when dropping inside them
- [x] `@dnd-kit/modifiers` installed separately

---

### PHASE 13 — Upcoming & Notifications ✅ DONE

- [x] `UpcomingView.tsx` — grouped: Overdue / Today / Tomorrow / This Week
- [x] Shows parent breadcrumb for each item via `getParentChain`
- [x] Due date chip: red=overdue, amber=today/soon, gray=future
- [x] Overdue banner with `AlertTriangle`
- [x] `visibilitychange` listener recomputes dates on tab focus
- [x] Badge count on Upcoming sidebar item (includes reminder-based items)
- [x] `selectUpcomingNodes` extended to include `reminder === 'today'` and `reminder === 'tomorrow'`

---

### PHASE 14 — Completed & Archive Views ✅ DONE

- [x] `CompletedView.tsx` — `completed && !archived`, sorted by updatedAt desc, undo-complete button on hover
- [x] `ArchiveView.tsx` — `archived === true`, restore button on hover (calls `updateNode(id, { archived: false })`)
- [x] Archive button on TreeNode row (replaces MoreHorizontal), calls `archiveNode(id)`
- [x] `archiveNode()` recursively archives entire subtree

---

### PHASE 15 — Undo / Redo ✅ DONE

- [x] `HistoryEntry` interface: `{ description, beforeNodes, beforeRootIds, afterNodes, afterRootIds }`
- [x] `undoStack: HistoryEntry[]`, `redoStack: HistoryEntry[]` in store (capped at 100)
- [x] `recordHistory(description, beforeNodes, beforeRootIds)` — local function inside store closure (block-body Immer form)
- [x] All trackable mutations wrapped: addNode, updateNode, deleteNode, moveNode, toggleComplete, duplicateNode, indentNode, outdentNode, archiveNode
- [x] Undo/redo assigns frozen Immer snapshots back via structural sharing (no deep clone needed)
- [x] Cmd+Z → `undo()`, Cmd+Shift+Z → `redo()`
- [x] `Toast.tsx` — auto-dismiss 2.5s, each action shows "Undo: …" message

---

### PHASE 16 — Micro-interactions & Polish ✅ DONE

- [x] `CommandPalette.tsx` — `motion.div` scale(0.96→1) + fade + slide-up entrance, `AnimatePresence` exit
- [x] `ShortcutsModal.tsx` — same entrance/exit treatment
- [x] `Toast.tsx` — `AnimatePresence` slide-up + scale + fade, keyed by `toast.id`
- [x] `TreeNodeCheckbox.tsx` — `whileHover` scale(1.1), `whileTap` scale(0.85) spring bounce, SVG pathLength checkmark
- [x] `ProgressRing.tsx` — Framer Motion `strokeDashoffset` animation on value change

---

### PHASE 18 — Settings ✅ DONE

- [x] `SettingsModal.tsx` — animated entrance (matches other modals)
- [x] Dark mode toggle: animated spring pill, `toggleDarkMode()` action
- [x] Export JSON: `exportData()` from `storage.ts`
- [x] Import JSON: file input → validate schemaVersion → `saveState()` → reload
- [x] Clear all: `confirm()` → `localStorage.clear()` → reload
- [x] `settingsOpen` state + `openSettings`/`closeSettings` actions
- [x] Settings button in Sidebar footer wired up
- [x] App version in modal footer

---

### PHASE 19 — Dark Mode ✅ DONE

- [x] Architecture: `data-theme="dark"` on `<html>`, all colors via CSS vars in `globals.css`
- [x] `toggleDarkMode()` action in store, persisted to localStorage
- [x] `AppShell` applies `data-theme` via `useEffect` on `darkMode` change
- [x] Animated pill toggle in Settings modal
- [x] No hardcoded colors in components — all via CSS vars

---

### PHASE 20 — Final QA & Performance ⬜ NEXT

- [ ] Lighthouse audit: target 95+ performance score
- [ ] Test with 1000+ node tree: virtualization holds, no lag
- [ ] All keyboard shortcuts end-to-end
- [ ] Persistence: refresh preserves all state
- [ ] Undo/redo: 20 operations, undo all, redo all
- [ ] Today flow: add → complete → next day reset
- [ ] Drag & drop: reorder, reparent, deep nesting
- [ ] Search: fuzzy match, path display, keyboard nav in results
- [ ] Dark mode: all views look correct
- [ ] Settings: export → import roundtrip works
- [ ] Cross-browser: Chrome, Safari, Firefox
- [ ] Accessibility: keyboard-only usage, ARIA labels, focus management
- [ ] Bundle size: target < 250KB gzipped

---

## Build Order Summary

```
✅ Phase 0  → Bootstrap + tooling
✅ Phase 1  → Types + pure tree utilities
✅ Phase 2  → Zustand store
✅ Phase 3  → Persistence layer
✅ Phase 4  → App shell + layout grid
✅ Phase 5  → ProgressRing component
✅ Phase 6  → Tree rendering (virtualized)
✅ Phase 7  → Keyboard navigation
✅ Phase 8  → Drag and drop
✅ Phase 9  → Inline editing
✅ Phase 10 → Command palette + search
✅ Phase 11 → Today system
✅ Phase 12 → Context panel (right)
✅ Phase 13 → Upcoming + notifications
✅ Phase 14 → Completed + archive views
✅ Phase 15 → Undo / redo
✅ Phase 16 → Micro-interactions + polish
✅ Phase 17 → Shortcuts modal
✅ Phase 18 → Settings
✅ Phase 19 → Dark mode

⬜ Phase 20 → QA + performance  ← NEXT
```

---

## Critical Rules

1. **Tree utility functions are pure** — no store imports in `src/lib/tree.ts`.
2. **Flat node map is sacred** — never nest nodes in component state.
3. **useShallow on all object selectors** — never return `{}` or `[]` directly from a selector.
4. **Derived arrays go in useMemo** — not inside useStore selectors.
5. **Every interaction has a keyboard path** — no mouse-only features.
6. **localStorage writes are debounced** — never write on every keystroke.
7. **Virtual list is always on** — even for small trees.
8. **storeRef pattern in event handlers** — never subscribe to full store in a hook that registers global listeners.
