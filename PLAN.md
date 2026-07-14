# idolist — Master Build Plan

## Context

idolist is a personal operating system — a single-page application built around a hierarchical life tree. The user wants a premium, keyboard-first productivity tool that feels like Linear/Notion rather than Jira/ClickUp. This document is the **single source of truth** for how we build it, phase by phase.

---

## Current Status — Updated 2026-07-13

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
✅ Phase 21 — Node icons / emoji picker (TreeNodeIcon, 7-group popover, seed icons)
✅ Phase 22 — Multi-column tree (Progress bar, Today sun toggle, Due date columns)
✅ Phase 23 — Right panel redesign (TodayPanel + LifeProgressPanel, NodeDetails overlay)
✅ Phase 24 — Left sidebar redesign (Life/Today/Inbox/Search/Graph/Calendar/Notes, Areas section)
✅ Phase 25 — Tree toolbar ("idolist" h1 + subtitle, "New Item" bottom button)
✅ Phase 26 — Visual design pass (40px rows, depth-0 bold, 210/260px panel widths)
✅ Phase 27 — Rebrand to idolist (title, metadata, favicon SVG, all copy updated)
✅ Phase 28 — Repeat tasks (daily/weekly/monthly, checkRepeatingTasks on mount, lastCompletedAt)
✅ Phase 29 — Upcoming as full page view (sidebar nav item, badge count, replaces panel widget)
✅ Phase 30 — Life Progress moved to sidebar (replaces Areas section, fills nav space)
✅ Phase 31 — Resizable panels (drag handles, sidebar 160–400px, right panel 200–500px, persisted)
✅ Phase 32 — Inbox view (working full page, __inbox__ hidden root, quick-capture, move to area)
✅ Phase 33 — NLP date parsing in Inbox (chrono-node, live preview chip, date stripped from title)
✅ Phase 34 — Time support (dueTime field, NLP extracts explicit hour, shown in Today/Upcoming/Inbox/tree)
✅ Phase 35 — Monorepo setup + shared core (@idolist/core via npm workspaces, StorageAdapter injection)
✅ Phase 36 — Expo app scaffold (apps/mobile, SDK 57 bare, Expo Router, reanimated/flash-list/mmkv, EAS profiles)
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
packages/
└── core/                   ✅ @idolist/core — shared web/mobile (npm workspace, raw TS)
    ├── index.ts            ✅ Public barrel — re-exports everything below
    ├── types.ts            ✅ LifeNode, View, INBOX_ID, SearchResult, DragState, …
    ├── tree.ts             ✅ Pure utilities (+ tree.test.ts, stress.test.ts)
    ├── nlp.ts              ✅ chrono-node date/time parsing
    ├── seed.ts             ✅ Sample tree
    ├── selectors.ts        ✅ selectVisibleNodes, selectUpcomingNodes, …
    ├── storage.ts          ✅ PersistedState, StorageAdapter, normalize/default helpers
    └── store.ts            ✅ createIdolistStore(adapter) — Zustand + Immer factory

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
│   └── index.ts            ✅ createIdolistStore(localStorageAdapter) — web store instance
├── hooks/
│   └── useKeyboard.ts      ✅ storeRef pattern, all shortcuts, Cmd+Z/Cmd+Shift+Z
└── lib/
    └── storage.ts          ✅ localStorageAdapter + exportData/import (web-only persistence)
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

### PHASE 21 — Node Icons / Emoji Picker ✅ DONE

- [x] `TreeNodeIcon.tsx` — renders emoji or default icon by depth/type (depth=0 → `◆`, type=project → `▸`, else `·`)
- [x] Click on icon opens inline emoji picker popover (7 groups × 10 emojis, positioned relative to icon)
- [x] Clear icon button appears when emoji is set
- [x] Closes on click-outside or Escape
- [x] Icon shown and editable in NodeDetails panel
- [x] Seed data updated: Career=`💼`, Health=`🏃`, Finance=`💰`, Learning=`📚`

---

### PHASE 22 — Multi-Column Tree ✅ DONE

- [x] `LifeTree.tsx` — 28px column header row (Progress / Today / Due) above virtualizer; always visible
- [x] `TreeNode.tsx` column constants exported: `COL_PROGRESS=96`, `COL_TODAY=40`, `COL_DUE=72`
- [x] **Progress column**: `getSubtreeCompletionRatio` bar + `n%` text; only shown when node has children
- [x] **Today column**: sun icon toggle, amber when in todayIds; hover darkens border color
- [x] **Due date column**: `format(dueDate, "MMM d")` when set
- [x] `getSubtreeCompletionRatio(nodes, id)` — leaf-only ratio in `src/lib/tree.ts`
- [x] Drag ghost overlay shows node emoji icon when set

---

### PHASE 23 — Right Panel Redesign ✅ DONE

- [x] `TodayPanel.tsx` — date header with day/date, completed/total badge, task list with checkboxes, remove-on-hover ×, "Add task to Today" dashed-border CTA
- [x] `LifeProgressPanel.tsx` — 32px overall %, 6px progress bar, "N of M tasks" subtitle, per-area breakdown with color bars
- [x] `ContextPanel.tsx` — always shows TodayPanel (top) + LifeProgressPanel (flex 1)
- [x] NodeDetails overlays with Framer Motion spring slide-in (`x: 100% → 0`) via `AnimatePresence`
- [x] `X` button in NodeDetails header calls `setSelected(null)` to dismiss overlay
- [x] Escape key also dismisses (via `useKeyboard`)
- [x] `E` key opens/toggles NodeDetails for focused node

---

### PHASE 24 — Left Sidebar Redesign ✅ DONE

- [x] 🌿 My Life identity chip at top with "Personal OS" subtitle
- [x] Nav: Life (active), Today (active + badge), Inbox, Search, Graph, Calendar, Notes
- [x] Inbox / Graph / Calendar / Notes: dimmed (opacity 0.5), no-op click, "Coming soon" tooltip
- [x] Search nav item → `openCommandPalette()`
- [x] Today badge shows `todayIds.size` count
- [x] **Areas section** at bottom: 8-color stable palette, color square, emoji + title, `n%` per root area
- [x] Settings button in footer

---

### PHASE 25 — Tree Toolbar ✅ DONE

- [x] Toolbar above tree: "My Life" h1 (18px, 700, letter-spacing -0.02em) + subtitle paragraph
- [x] "Add area" button in toolbar top-right
- [x] "New Item" button pinned at bottom of tree list (hover reveals, always present when nodes exist)
- [x] Row height bumped from 36px to 40px (`estimateSize: () => 40`)

---

### PHASE 26 — Visual Design Pass ✅ DONE

- [x] Tree node titles: 14px, area nodes (depth=0) at `fontWeight: 600`, tasks at 400
- [x] Row height: 36px → 40px
- [x] Sidebar: 240px → 210px
- [x] Right panel: 320px → 260px
- [x] `getDefaultIcon` depth mapping: depth=0 → `◆`, project → `▸`, else `·`
- [x] Area colors: 8-color stable palette cycling across `AREA_COLORS` constant shared by Sidebar + LifeProgressPanel

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

✅ Phase 21 → Node icons / emoji picker
✅ Phase 22 → Multi-column tree (Progress, Today, Due)
✅ Phase 23 → Right panel redesign (Today list + Life Progress)
✅ Phase 24 → Left sidebar redesign (new nav, sparkline, area tags)
✅ Phase 25 → Tree toolbar (subtitle, New Item button)
✅ Phase 26 → Visual design pass (match mockup proportions + typography)
✅ Phase 27 → Rebrand to idolist
✅ Phase 28 → Repeat tasks (daily / weekly / monthly)
✅ Phase 29 → Upcoming as full page nav view
✅ Phase 30 → Life Progress consolidated to sidebar
✅ Phase 31 → Resizable panels (drag handles, localStorage)
✅ Phase 32 → Inbox view (capture, move to area, badge)
✅ Phase 33 → NLP date parsing (chrono-node, live chip)
✅ Phase 34 → Time support (dueTime field, NLP + manual picker)
```

---

### PHASE 27 — Rebrand to idolist ✅ DONE

- [x] All "LifeOS" / "My Life" copy → "idolist"
- [x] `layout.tsx` title + description updated
- [x] `LifeOSStore` type → `IdolistStore`
- [x] `src/app/icon.svg` — blue rounded square + 🌿 emoji, replaces Next.js boilerplate favicon
- [x] README, AGENTS.md, PLAN.md rewritten to reflect idolist brand

---

### PHASE 28 — Repeat Tasks ✅ DONE

- [x] `RepeatOption = "none" | "daily" | "weekly" | "monthly"` added to types
- [x] `repeat` and `lastCompletedAt: number | null` fields on `LifeNode`
- [x] `toggleComplete` stamps `lastCompletedAt = Date.now()` on completion
- [x] `checkRepeatingTasks()` store action — resets `completed: false` when period has rolled over
- [x] Called alongside `checkTodayReset()` in `AppShell` on mount
- [x] Repeat picker in `NodeDetails` (pill buttons, hidden for areas)
- [x] Due column shows `↺` symbol when repeat is set and no dueDate
- [x] `loadState` patches existing nodes: `repeat: "none"`, `lastCompletedAt: null`

---

### PHASE 29 — Upcoming as Full Page View ✅ DONE

- [x] `"upcoming"` added to `View` type
- [x] Upcoming nav item added to Sidebar (Clock icon, between Today and Inbox)
- [x] Badge count wired to `selectUpcomingCount(nodes)`
- [x] Removed earlier UpcomingPanel widget from right panel

---

### PHASE 30 — Life Progress Consolidated to Sidebar ✅ DONE

- [x] `LifeProgressPanel` moved into Sidebar, fills space between nav and Settings button
- [x] Removed redundant Areas section + `AREA_COLORS` from `Sidebar.tsx`
- [x] `LifeProgressPanel` removed from `ContextPanel`
- [x] `TodayPanel` now takes `fillHeight` prop — expands to fill right panel when no Life Progress below it

---

### PHASE 31 — Resizable Panels ✅ DONE

- [x] Layout changed from CSS Grid to Flexbox in `AppShell`
- [x] `ResizeHandle` component (6px wide, 1px visual line, `col-resize` cursor)
- [x] Left handle resizes sidebar: 160px min → 400px max
- [x] Right handle resizes context panel: 200px min → 500px max
- [x] Widths persisted to `localStorage` (`idolist-sidebar-width`, `idolist-panel-width`)
- [x] Restored on next load with clamping to min/max bounds
- [x] `document.body.userSelect = "none"` during drag to prevent text selection

---

### PHASE 32 — Inbox View ✅ DONE

- [x] `"inbox"` added to `View` type; `INBOX_ID = "__inbox__"` constant exported from types
- [x] Hidden `__inbox__` root area node initialized in store on startup (not shown in LifeTree or LifeProgressPanel)
- [x] `addToInbox(title)` store action — creates task as child of `__inbox__`
- [x] `InboxView.tsx` — quick-capture input (Enter to add, Escape to clear), pending + completed sections
- [x] Hover actions per item: checkbox, move-to-area dropdown, delete
- [x] Inbox nav item wired up in Sidebar (was previously dimmed no-op)
- [x] Badge count shows pending (uncompleted, non-archived) inbox items

---

### PHASE 33 — NLP Date Parsing ✅ DONE

- [x] `chrono-node` installed for natural language date parsing
- [x] `src/lib/nlp.ts` — `parseTask(input)` strips date phrase from title, returns `dueDate`, `isToday`, `reminder`, `dateLabel`
- [x] Live preview chip in Inbox input (Calendar icon + human label e.g. "Tomorrow", "Fri, Dec 5")
- [x] On submit: `dueDate`, `reminder`, and `todayIds` set automatically from parsed result
- [x] Falls back gracefully when no date is detected

---

### PHASE 34 — Time Support ✅ DONE

- [x] `dueTime: string | null` field added to `LifeNode` ("HH:mm" 24-hour)
- [x] `loadState` patches existing nodes with `dueTime: null`
- [x] NLP: uses `result.start.isCertain("hour")` — time only extracted when explicitly mentioned
- [x] NLP preview chip extended: "Tomorrow at 2:00 PM", "Fri, Dec 5 at 9:30 AM"
- [x] `NodeDetails` — due date + time inputs side by side; time disabled until date is set
- [x] Tree row due column: shows "Dec 5 2:00pm" when time set (`COL_DUE` widened 72→100px)
- [x] Today panel sidebar: time shown in muted text after title
- [x] Upcoming view date chips: "Today · 2:00pm", "Tomorrow · 9:30am"
- [x] Inbox item list: date chip shows "Dec 5 · 2:00pm" when time set

---

---

## React Native — iPhone / iPad / Mac

### Goal

A native-feeling idolist app on all Apple devices, sharing the same business logic as the web app, with persistent storage and real-time iCloud sync across devices.

---

### Architecture Decision: Monorepo

```
idolist/                        ← existing Next.js web app
packages/
  core/                         ← shared: types, store, tree.ts, nlp.ts, seed.ts
apps/
  mobile/                       ← Expo React Native app
```

The web app and mobile app share `packages/core`. Zero duplication of business logic. The UI layer is rebuilt per platform but the entire store, selectors, utilities, and NLP are identical.

---

### Technology Stack — Mobile

| Concern | Choice | Notes |
|---|---|---|
| Framework | Expo SDK 52+ (Bare workflow) | Bare needed for native CloudKit module |
| Language | TypeScript strict | Same tsconfig as web |
| Navigation | Expo Router (file-based) | Same mental model as Next.js App Router |
| State | Zustand + Immer | Identical to web — no changes |
| Local storage | MMKV + zustand-mmkv-storage | 10× faster than AsyncStorage |
| Sync | CloudKit (custom Expo module) | Native Apple sync, zero backend cost |
| Virtualization | FlashList (Shopify) | Replaces @tanstack/react-virtual |
| Animations | React Native Reanimated 3 | Replaces Framer Motion |
| Gestures | React Native Gesture Handler | Drag-and-drop + swipe |
| Glass effect | @react-native-community/blur | BlurView replaces backdrop-filter |
| Icons | Lucide React Native | Same icon set |
| Notifications | expo-notifications | Local only, no server |
| Date parsing | chrono-node | Same NLP lib, works in RN |

---

### iCloud Sync Strategy

**CloudKit** is the right choice — native Apple infrastructure, zero server cost, works offline with automatic delta sync when connectivity returns.

**How it works:**
- Each `LifeNode` becomes a `CKRecord` in a private CloudKit database
- `rootIds` stored as a separate `CKRecord` (ordered array)
- `collapsedIds`, `todayIds` stored as record fields
- CloudKit subscriptions push real-time change notifications to all signed-in devices
- Conflict resolution: `updatedAt` timestamp — last write wins (sufficient for personal use)
- Offline writes queue locally in MMKV, sync on reconnect automatically

**Implementation:** Custom Expo native module wrapping `CKContainer`, `CKDatabase`, and `CKQuerySubscription`. The store's `persist` middleware is replaced by a CloudKit adapter that writes on every mutation and subscribes to remote changes.

---

### Layout Strategy Per Device

**iPhone**
- Tab bar at bottom: Life · Today · Inbox · Upcoming
- Tapping a node opens NodeDetails as a pushed screen
- Tree is single-column (progress + today + due columns collapse to swipe actions)
- Quick-add via floating action button

**iPad**
- `UISplitViewController` equivalent via Expo Router groups
- Left column: Sidebar (210px, persistent)
- Center: Tree (flex 1)
- Right column: Context panel (260px, persistent)
- Matches web layout exactly — same three-column glass card design
- Keyboard shortcuts via `UIKeyCommand`

**Mac (Catalyst via Expo)**
- Same as iPad layout
- Toolbar integrates with macOS title bar
- `Cmd+K`, `Cmd+Z`, all keyboard shortcuts work natively
- Window resizing supported

---

### Phase Plan

```
✅ Phase 35 — Monorepo setup + shared core package
✅ Phase 36 — Expo app scaffold (Bare workflow, TypeScript, Expo Router)
⬜ Phase 37 — Shared store wired to MMKV (local persistence, all platforms)
⬜ Phase 38 — Layout shell (iPhone tabs / iPad+Mac split view)
⬜ Phase 39 — Design system (JS theme tokens, BlurView glass, warm palette)
⬜ Phase 40 — Tree rendering (FlashList, TreeNode in RN, column layout)
⬜ Phase 41 — Inline editing + keyboard (TextInput, KeyboardAvoidingView, hardware kbd)
⬜ Phase 42 — Gestures + drag-and-drop (Reanimated 3 + Gesture Handler)
⬜ Phase 43 — iCloud sync (CloudKit native module, CKRecord per node, subscriptions)
⬜ Phase 44 — Push notifications + reminders (expo-notifications, local scheduling)
⬜ Phase 45 — App Store submission (icons, splash, TestFlight, review)
```

---

### PHASE 35 — Monorepo Setup + Shared Core ✅ DONE

**Goal:** Extract all platform-agnostic code so both web and mobile import from the same package.

- [x] Add `packages/core` with its own `package.json` + `tsconfig.json`
- [x] Move `src/types/index.ts` → `packages/core/types.ts`
- [x] Move `src/lib/tree.ts` → `packages/core/tree.ts` (tests moved alongside: `tree.test.ts`, `stress.test.ts`)
- [x] Move `src/lib/nlp.ts` → `packages/core/nlp.ts`
- [x] Move `src/lib/seed.ts` → `packages/core/seed.ts`
- [x] Store extracted to `packages/core/store.ts` as `createIdolistStore(adapter)` factory — no localStorage calls in core
- [x] Move `src/store/selectors.ts` → `packages/core/selectors.ts`
- [x] `packages/core/storage.ts` — `PersistedState`, `StorageAdapter`, `normalizePersistedState`, `defaultPersistedState`, `todayStr`
- [x] Update web app imports to `@idolist/core`
- [x] Set up npm workspaces (not Turborepo/pnpm — repo already used npm; root `workspaces: ["packages/*"]`)

**Key decision:** The store's persistence is injected as an adapter interface:
```typescript
interface StorageAdapter {
  load(): PersistedState | null;
  save(state: PersistedState): void;
}
// Web: localStorageAdapter (src/lib/storage.ts)
// Mobile: mmkvAdapter (local) + cloudKitAdapter (sync)
```

**Divergence from original sketch:** the adapter is synchronous, not Promise-based —
localStorage and MMKV are both sync APIs, and the store initializes synchronously at
creation. CloudKit (Phase 43) layers async sync behind the sync MMKV cache; its adapter
`save` can fire-and-forget the network push.

**Web-side remainder:**
- `src/store/index.ts` — thin shim: `createIdolistStore(localStorageAdapter)`, re-exports `IdolistStore`
- `src/lib/storage.ts` — `localStorageAdapter` + `exportData` (browser download) + `loadState`/`saveState` used by Settings import/export
- Next.js needs no `transpilePackages` entry — Turbopack transpiles npm workspace packages automatically (verified in `node_modules/next/dist/docs`)
- Core ships raw TS (`main`/`exports` → `index.ts`); no build step

---

### PHASE 36 — Expo App Scaffold ✅ DONE

- [x] `npx create-expo-app apps/mobile --template bare-minimum` (Expo SDK 57, RN 0.86)
- [x] TypeScript strict config (extends `expo/tsconfig.base`, `strict: true`, 0 errors)
- [x] Expo Router installed and configured (`main: "expo-router/entry"`, `app/_layout.tsx` Stack + `app/index.tsx`, typed routes enabled)
- [x] Expo SDK 52+ (Bare workflow — `ios/` + `android/` checked in for the Phase 43 CloudKit module)
- [x] `react-native-gesture-handler` + `react-native-reanimated` installed (Reanimated 4 + `react-native-worklets`; `GestureHandlerRootView` at root)
- [x] `@shopify/flash-list` installed (v2)
- [x] `react-native-mmkv` installed (v4)
- [x] EAS Build configured for iOS simulator and device (`eas.json`: `development`, `development-simulator`, `preview`, `production` profiles)

**Divergences / notes:**
- SDK 57 shipped since the plan was written — Expo Router is now versioned with the SDK (`~57.0.4`), and `bare-minimum` scaffolds `ios/`+`android/` directly.
- No `babel.config.js` needed: `babel-preset-expo` auto-adds `react-native-worklets/plugin` when the package is installed.
- `react` pinned to `19.2.4` (matching web) so npm hoists a single copy — two React instances across hoisted/nested node_modules would break hooks in `@idolist/core`'s zustand store. Verified deduped via `npm ls react`.
- Root `workspaces` extended to `["packages/*", "apps/*"]`; Metro resolves `@idolist/core` from the workspace automatically (verified via `npx expo export --platform ios` — bundles clean).
- Native projects regenerated via `npx expo prebuild --clean` after renaming to `idolist` / `com.idolist.app` in `app.json`.
- `app/index.tsx` is a Phase 36 smoke-test screen (imports `createSeedData` from `@idolist/core`) — replaced by the real store + tree in Phases 37–40.
- Remaining manual step before first cloud build: `eas init` (requires Expo account login) to attach a `projectId`.

---

### PHASE 37 — Shared Store + MMKV Persistence

- [ ] `zustand` + `immer` work in RN unchanged — install and verify
- [ ] `mmkvAdapter` implementing `StorageAdapter` interface
- [ ] Store loads from MMKV on app start (replaces `loadState` from localStorage)
- [ ] Debounced save to MMKV on every mutation (replaces `debounce(saveState, 300)`)
- [ ] All existing selectors work unchanged
- [ ] Seed data inserted on first launch (MMKV key not present)

---

### PHASE 38 — Layout Shell

**iPhone:**
- [ ] Bottom tab bar: Life / Today / Inbox / Upcoming
- [ ] Stack navigator inside each tab
- [ ] `_layout.tsx` at root with `Tabs` component from Expo Router

**iPad + Mac:**
- [ ] Detect `Platform.isPad` / `Platform.OS === 'macos'`
- [ ] Three-column layout using `View` flexbox (sidebar + tree + panel)
- [ ] Sidebar persistent (not in a drawer)
- [ ] Sidebar collapses to icon-only at narrow widths

---

### PHASE 39 — Design System

- [ ] `theme.ts` — all CSS vars translated to JS constants (warm white palette)
- [ ] `BlurView` from `@react-native-community/blur` for glass panels
- [ ] Warm cream background via `LinearGradient` (`expo-linear-gradient`)
- [ ] Border radius, shadow, spacing constants matching web
- [ ] Dark mode via `Appearance.getColorScheme()` + React context
- [ ] All components consume theme object — no hardcoded colors

---

### PHASE 40 — Tree Rendering

- [ ] `FlashList` replaces `@tanstack/react-virtual` — same `estimateItemSize: 40`
- [ ] `TreeNode` component adapted: `View`/`Text`/`TouchableOpacity` replacing `div`/`span`/`button`
- [ ] Progress bar: `View` with percentage width
- [ ] Today toggle: `Pressable` with sun icon
- [ ] Due date: `Text` with formatted date
- [ ] Collapse toggle: `Pressable` with `ChevronRight` (Reanimated rotation)
- [ ] On iPhone: Progress/Today/Due collapse — swipe-left reveals actions instead

---

### PHASE 41 — Inline Editing + Keyboard

- [ ] `TextInput` for node title editing (autoFocus on `editingId` set)
- [ ] `KeyboardAvoidingView` wrapping tree (iPhone software keyboard)
- [ ] `returnKeyType="next"` → Tab behavior (create sibling)
- [ ] Hardware keyboard on iPad/Mac: arrow keys, Enter, Escape, Cmd+Z via `UIKeyCommand`
- [ ] Command palette: `Modal` + `TextInput` + `FlashList` (Cmd+K on iPad/Mac, search FAB on iPhone)

---

### PHASE 42 — Gestures + Drag-and-Drop

- [ ] `react-native-gesture-handler` `LongPressGesture` activates drag (500ms threshold)
- [ ] `react-native-reanimated` `useAnimatedStyle` for ghost overlay position
- [ ] `GestureDetector` + `Animated.View` ghost follows finger
- [ ] Drop indicators (line above/below/inside) using `useSharedValue` for opacity
- [ ] `computeDropTarget` logic reused unchanged from web
- [ ] Haptic feedback on drag start and valid drop (`expo-haptics`)

---

### PHASE 43 — iCloud Sync

This is the most complex phase. Requires a custom Expo native module.

**Native module (Swift):**
- [ ] `CloudKitModule.swift` wrapping `CKContainer.default()`
- [ ] `saveRecord(node: LifeNode)` — upsert a `CKRecord` with all node fields
- [ ] `deleteRecord(id: String)` — delete by record ID
- [ ] `fetchAllRecords()` — initial fetch on launch
- [ ] `subscribeToChanges()` — `CKQuerySubscription` fires on remote changes
- [ ] `applyRemoteChanges(records: [CKRecord])` — merges into Zustand store

**Store integration:**
- [ ] CloudKit adapter implements `StorageAdapter` interface
- [ ] On mutation: write to MMKV immediately (optimistic), then push to CloudKit async
- [ ] On app foreground: fetch delta changes since last sync token (`CKServerChangeToken`)
- [ ] Conflict resolution: compare `updatedAt` — higher timestamp wins
- [ ] Sync status indicator in sidebar (syncing / synced / offline)

**CloudKit schema:**
```
Record Type: Node
  id: String (record name)
  title: String
  type: String
  parentId: String?
  childIds: [String]
  completed: Int (0/1)
  archived: Int (0/1)
  icon: String?
  notes: String
  dueDate: String?
  dueTime: String?
  reminder: String
  repeat: String
  createdAt: Double
  updatedAt: Double

Record Type: AppState
  rootIds: [String]
  todayIds: [String]
  collapsedIds: [String]
```

---

### PHASE 44 — Notifications + Reminders

- [ ] `expo-notifications` installed and permissions requested on first launch
- [ ] When `reminder` set on a node: schedule local notification for due date/time
- [ ] When reminder cleared or node completed: cancel scheduled notification
- [ ] Background task (`expo-background-fetch`) to refresh repeating task state
- [ ] Notification tap → deep link to node via Expo Router

---

### PHASE 45 — App Store Submission

- [ ] App icon (1024×1024, warm amber gradient + idolist mark)
- [ ] Splash screen (`expo-splash-screen`, warm cream background)
- [ ] Privacy policy URL (required for iCloud entitlement)
- [ ] `iCloud` entitlement + `CloudKit` capability in `app.json`
- [ ] EAS Build: `eas build --platform ios --profile production`
- [ ] TestFlight internal testing
- [ ] App Store Connect listing + screenshots
- [ ] App Store review submission

---

## Critical Rules

1. **Tree utility functions are pure** — no store imports in `packages/core/tree.ts`.
2. **Flat node map is sacred** — never nest nodes in component state.
3. **useShallow on all object selectors** — never return `{}` or `[]` directly from a selector.
4. **Derived arrays go in useMemo** — not inside useStore selectors.
5. **Every interaction has a keyboard path** — no mouse-only features.
6. **localStorage writes are debounced** — never write on every keystroke.
7. **Virtual list is always on** — even for small trees.
8. **storeRef pattern in event handlers** — never subscribe to full store in a hook that registers global listeners.
