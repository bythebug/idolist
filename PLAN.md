# LifeOS — Master Build Plan

## Context

LifeOS is a personal operating system — a single-page application built around a hierarchical life tree. The user wants a premium, keyboard-first productivity tool that feels like Linear/Notion rather than Jira/ClickUp. This document is the **single source of truth** for how we build it, phase by phase.

---

## Current Status — Updated 2026-07-08

```
✅ Phase 0  — Bootstrap + tooling
✅ Phase 1  — Types + pure tree utilities (37 tests passing)
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
✅ Phase 20 — QA & Performance (37 tests, 276KB gzipped, 0 TS errors)

⬜ Phase 21 — Node icons / emoji picker ← NEXT
⬜ Phase 22 — Multi-column tree (Progress, Today, Due date columns)
⬜ Phase 23 — Right panel redesign (Today list + Life Progress stats)
⬜ Phase 24 — Left sidebar redesign (new nav items, sparkline, area tags)
⬜ Phase 25 — Tree toolbar (breadcrumb header, search bar)
⬜ Phase 26 — Visual design pass (typography, spacing, colors to match mockup)
```

---

## Target Design (ui.png)

The mockup reveals a significantly different visual direction from what is built. Key differences:

### What the mockup shows that we don't have

**Multi-column tree layout** — the tree is a table, not just a list:
- Column 1: indented node title with icon
- Column 2: inline horizontal progress bar (for areas/projects)
- Column 3: Today toggle (sun icon checkbox)
- Column 4: due date label (e.g. "May 14")

**Node icons** — every node has a colored emoji/icon prefix:
- Areas: folder-style icons in muted colors (Career=blue, Health=green, Finance=purple, etc.)
- Projects/tasks: inherit or set custom emoji

**Right panel** — split into two stacked sections (not one node-detail panel):
1. **Today** — task list for the day with an "Add Task to Today" button
2. **Life Progress** — 18% stat, a sparkline trend graph, color-coded area list

**Left sidebar** — different nav items and footer:
- Nav: Life, Today, Inbox, Search, Graph, Calendar, Notes (not Upcoming/Completed/Archive)
- Footer: "Life Progress" section with a sparkline (not a ring), colored area tags

**Tree toolbar** — header above the tree with:
- Breadcrumb: "< Life" navigation
- Page title: "My Life" + subtitle "A map of everything that matters"
- "Share" button
- Search bar (inline in toolbar)

**"New Item" button** — at the bottom of the tree list, not an empty-state-only button

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

### PHASE 20 — Final QA & Performance ✅ DONE

- [x] TypeScript strict check: 0 errors
- [x] 37 tests passing (31 tree utilities + 6 performance stress)
- [x] 1110-node tree: getVisibleNodes ×100 <50ms, isDescendant ×1000 <20ms
- [x] Dark mode: UpcomingView danger/warning colors moved to CSS vars
- [x] Accessibility: aria-label on all icon-only buttons
- [x] Bundle: 276 KB gzipped (Framer Motion is the dominant cost)

---

### PHASE 21 — Node Icons / Emoji Picker ⬜ NEXT

Each node in the mockup has a colored icon prefix (emoji or small colored square).

- [ ] Add `icon: string | null` field to `LifeNode` (already in types — wire it up)
- [ ] `TreeNodeIcon.tsx` — renders the emoji or a default type-based icon (area=📁, project=◆, task=•)
- [ ] Click on icon in tree row opens inline emoji picker (or a small popover with common emojis)
- [ ] Area-level nodes get auto-assigned a muted color square on creation (Career=blue, Health=green, etc.)
- [ ] Icon shown in NodeDetails panel (editable from there too)
- [ ] Seed data updated with icons for the sample tree areas

---

### PHASE 22 — Multi-Column Tree ⬜

The tree becomes a table with four columns: title, progress, today, due date.

- [ ] `LifeTree.tsx` — add column header row (Progress / Today / Due) above the virtualizer
- [ ] `TreeNode.tsx` — add right-side columns to each row:
  - **Progress column** (120px): horizontal progress bar showing % of children completed; only visible on area/project nodes
  - **Today column** (48px): sun icon toggle — click adds/removes from todayIds; highlights if in today
  - **Due date column** (80px): shows `dueDate` as short date ("May 14"); click opens date picker inline or in NodeDetails
- [ ] Column headers are sticky (stay visible while scrolling the tree)
- [ ] Clicking column header sorts (future stretch) — for now just labels
- [ ] Keyboard: Tab still navigates columns for the focused row
- [ ] `selectSubtreeCompletionRatio(nodes, id)` selector — counts completed vs total descendants (leaf nodes only)
- [ ] Progress bar uses CSS `--accent` color, width from ratio, only shown when node has children

---

### PHASE 23 — Right Panel Redesign ⬜

Replace the single NodeDetails panel with a two-section right panel.

- [ ] **Top section — Today list**:
  - Header: "Today" + current date
  - List of tasks in todayIds, each with checkbox + title
  - Completing a task here also completes it in the tree
  - "Add Task to Today" button at the bottom (opens command palette filtered to tree nodes)
  - Empty state: "Nothing planned for today"
- [ ] **Bottom section — Life Progress**:
  - "Life Progress" header
  - Big percentage number (overall completion ratio)
  - Sparkline trend chart: last 7 days completion % (store daily snapshot in localStorage)
  - Color-coded area tags list (area name + colored dot + its own % complete)
- [ ] NodeDetails (editing notes, due date, reminder) becomes a slide-in panel or modal — triggered by clicking a node's detail icon or pressing E
- [ ] Right panel is always visible; NodeDetails overlays on demand

---

### PHASE 24 — Left Sidebar Redesign ⬜

Align sidebar nav with the mockup.

- [ ] Nav items: Life, Today, Inbox (placeholder), Search, Graph (placeholder), Calendar (placeholder), Notes (placeholder)
  - Active items: Life and Today work now; others show "coming soon" empty state
- [ ] Remove: Upcoming, Completed, Archive from primary nav (move to secondary or accessible via keyboard/command palette)
- [ ] Footer: replace ProgressRing + stats with a compact "Life Progress" section:
  - Small sparkline graph (reuse from Phase 23)
  - "18% · 23 of 128 tasks" stat line
  - Color-coded area tags as small squares with labels
- [ ] Area tags: auto-derive from root-level nodes, color-coded (assign stable color per root node)
- [ ] Profile/avatar chip at the very top: "My Life" with a muted avatar circle

---

### PHASE 25 — Tree Toolbar ⬜

Add the header bar above the tree that the mockup shows.

- [ ] Toolbar above tree (48px height):
  - Back chevron `<` for breadcrumb navigation (when viewing a subtree)
  - Current view title: "Life" (or node title if drilled in)
  - Subtitle: "My Life — A map of everything that matters." (editable, stored as app meta)
  - "Share" button (future — for now copy link / export)
  - Search input (inline, opens CommandPalette on focus)
- [ ] "New Item" button pinned at the bottom of the tree list (always visible, not just in empty state)
- [ ] Tree can "drill into" a node — clicking an area title navigates into it and shows only that subtree with a back button

---

### PHASE 26 — Visual Design Pass ⬜

Final polish to match the mockup's aesthetic.

- [ ] **Typography**: tree node titles slightly larger (14px), area nodes bold, task nodes regular weight
- [ ] **Row height**: increase from 36px to 40px to give columns room to breathe
- [ ] **Column grid**: use CSS grid on tree rows (`title 1fr / progress 120px / today 48px / due 80px`)
- [ ] **Area color system**: each root-level area gets a stable color (Career=blue, Health=green, Finance=purple, Learning=orange, Personal=pink) stored in node `icon` field or a separate color map
- [ ] **Sidebar width**: increase from 240px to 220px (or match mockup proportions: narrower sidebar, wider tree, narrower right panel)
- [ ] **Right panel width**: 280px (currently 320px — mockup shows it narrower)
- [ ] **Node row hover**: show column values more prominently on hover
- [ ] **Completed nodes**: dimmer strikethrough text, still shows in tree (not hidden)
- [ ] **Font**: verify Inter is rendering correctly at all weights used in mockup

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
✅ Phase 20 → QA + performance

⬜ Phase 21 → Node icons / emoji picker      ← NEXT
⬜ Phase 22 → Multi-column tree (Progress, Today, Due)
⬜ Phase 23 → Right panel redesign (Today list + Life Progress)
⬜ Phase 24 → Left sidebar redesign (new nav, sparkline, area tags)
⬜ Phase 25 → Tree toolbar (breadcrumb, subtitle, search, drill-in)
⬜ Phase 26 → Visual design pass (match mockup proportions + typography)
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
