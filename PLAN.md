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
✅ Phase 9  — Inline editing (Enter/Tab/Shift+Tab/Backspace/Escape in TreeNodeTitle)
✅ Phase 10 — Command palette (Cmd+K, fuse.js fuzzy search)
✅ Phase 11 — Today system (Cmd+T, midnight reset, badge count)
✅ Phase 12 — Context panel / NodeDetails (breadcrumb, notes, due date, reminder)
✅ Phase 17 — Shortcuts modal (Cmd+/)

⬜ Phase 8  — Drag & drop (@dnd-kit) ← NEXT
⬜ Phase 13 — Upcoming & Notifications view
⬜ Phase 14 — Completed & Archive views
⬜ Phase 15 — Undo / Redo (command pattern)
⬜ Phase 16 — Micro-interactions & Polish (Framer Motion)
⬜ Phase 18 — Settings panel
⬜ Phase 19 — Dark mode toggle
⬜ Phase 20 — Final QA & Performance
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

### Bugs Fixed During Build
- `enableMapSet()` from Immer required for `Set<string>` mutations in producers
- `useShallow` required on all object selectors (Zustand v5 + `useSyncExternalStore`)
- Derived arrays (`selectVisibleNodes`, `selectBreadcrumb`) must be computed with `useMemo` outside selectors, not inside them
- `suppressBlurRef` in `TreeNodeTitle` prevents blur from deleting a node when Enter creates a sibling
- `storeRef` pattern in `useKeyboard` prevents listener re-registration on every state change

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
| Drag & Drop | @dnd-kit | 6.x (installed, not wired) |
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
const visibleNodes = useMemo(() => selectVisibleNodes(nodes, rootIds, ...), [nodes, rootIds]);

// ❌ WRONG — derived array inside selector causes infinite loop
const { visibleNodes } = useStore(useShallow((s) => ({ visibleNodes: computeArray(s) })));
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
│   │   ├── Sidebar.tsx     ✅ Nav, search button, progress ring, stats
│   │   └── ContextPanel.tsx ✅ Right panel shell
│   ├── tree/
│   │   ├── LifeTree.tsx    ✅ Virtualized (@tanstack/virtual, 36px rows)
│   │   ├── TreeNode.tsx    ✅ React.memo, focus ring, hover actions
│   │   ├── TreeNodeCheckbox.tsx ✅ Framer Motion SVG checkmark
│   │   └── TreeNodeTitle.tsx    ✅ Inline edit, Enter/Tab/Backspace/Escape
│   ├── panels/
│   │   ├── NodeDetails.tsx ✅ Breadcrumb, title, notes, due date, reminder
│   │   └── TodayView.tsx   ✅ Today filter, date header, empty state
│   ├── overlays/
│   │   ├── CommandPalette.tsx ✅ Cmd+K, fuse.js, keyboard nav, path display
│   │   └── ShortcutsModal.tsx ✅ Cmd+/, two-column grid, kbd styling
│   └── ui/
│       └── ProgressRing.tsx   ✅ SVG + Framer Motion, color tiers
├── store/
│   ├── index.ts            ✅ Zustand + Immer, all actions, debounced persist
│   └── selectors.ts        ✅ selectVisibleNodes, selectBreadcrumb, etc.
├── hooks/
│   └── useKeyboard.ts      ✅ storeRef pattern, all shortcuts
├── lib/
│   ├── tree.ts             ✅ Pure utilities (31 unit tests)
│   ├── storage.ts          ✅ load/save/export, schema versioning
│   └── seed.ts             ✅ Career/Health/Finance/Learning sample tree
└── types/
    └── index.ts            ✅ LifeNode, View, Command, SearchResult, DragState
```

---

## Detailed Phase-by-Phase TODO

---

### PHASE 0 — Project Bootstrap ✅ DONE

- [x] Bootstrap with `npx create-next-app@latest` (Next.js 16, TypeScript, Tailwind v4, App Router)
- [x] Install all production dependencies
- [x] Install Vitest + Testing Library
- [x] TypeScript strict mode (already on by default)
- [x] Design token CSS custom properties in `globals.css`
- [x] Delete Next.js boilerplate
- [x] `npm run dev` runs clean at localhost:3001

---

### PHASE 1 — Types & Data Model ✅ DONE

- [x] `src/types/index.ts` — LifeNode, NodeType, ReminderOption, View, Command, VisibleNode, SearchResult, DragState, DropTarget
- [x] `src/lib/tree.ts` — getNode, getChildren, getParentChain, getVisibleNodes, getSubtree, getCompletionRatio, isDescendant, reorderChildren, getPreviousVisibleId, getNextVisibleId, getNodeDepth
- [x] `src/lib/tree.test.ts` — 31 unit tests, all passing

---

### PHASE 2 — Zustand Store ✅ DONE

- [x] `src/store/index.ts` — combined store (not slices), Zustand v5 + Immer v11
- [x] `enableMapSet()` called at module load (required for Set mutation)
- [x] Node actions: addNode, updateNode, deleteNode, moveNode, toggleComplete, toggleCollapsed, duplicateNode, indentNode, outdentNode, collapseAll, expandAll
- [x] UI actions: setSelected, setFocused, setEditing, setView, openCommandPalette, closeCommandPalette, openShortcuts, closeShortcuts
- [x] Today actions: addToToday, removeFromToday, checkTodayReset
- [x] Drag state: setDragState
- [x] Settings: toggleDarkMode
- [x] `src/store/selectors.ts` — selectVisibleNodes, selectBreadcrumb, selectCompletionRatio, selectTodayNodes, selectCompletedNodes, selectUpcomingNodes, selectSearchIndex

---

### PHASE 3 — Persistence Layer ✅ DONE

- [x] `src/lib/storage.ts` — loadState, saveState (debounced 300ms), exportData
- [x] `src/lib/seed.ts` — Career / Health / Finance / Learning sample tree
- [x] Schema version field (`schemaVersion: 1`)
- [x] Midnight reset for today's completed tasks
- [x] `typeof window === "undefined"` guard for SSR safety

---

### PHASE 4 — App Shell & Layout ✅ DONE

- [x] `layout.tsx` — Inter font, `h-full` on html/body
- [x] `page.tsx` — `dynamic({ ssr: false })` prevents hydration mismatch
- [x] `AppShell.tsx` — CSS grid `240px 1fr 320px`, 100vh, dark mode data-theme toggle
- [x] `Sidebar.tsx` — nav items, search button, progress ring, task count stats
- [x] `ContextPanel.tsx` — shows NodeDetails when selectedId is set

---

### PHASE 5 — ProgressRing Component ✅ DONE

- [x] SVG circle with stroke-dasharray/dashoffset
- [x] Framer Motion animated value changes
- [x] Color tiers: green ≥80%, yellow ≥40%, gray below
- [x] Wired to selectCompletionRatio in Sidebar

---

### PHASE 6 — Tree Rendering ✅ DONE

- [x] `LifeTree.tsx` — useVirtualizer, 36px rows, overscan 10, empty state
- [x] Scroll to focused node via scrollToIndex
- [x] `TreeNode.tsx` — React.memo, chevron collapse toggle, indent by depth×20px, hover actions
- [x] `TreeNodeCheckbox.tsx` — Framer Motion SVG checkmark spring animation
- [x] `TreeNodeTitle.tsx` — span → input toggle on isEditing, suppressBlurRef fix

---

### PHASE 7 — Keyboard Navigation ✅ DONE

- [x] `useKeyboard.ts` — storeRef pattern (single listener, no re-registration)
- [x] ArrowUp/Down — move focusedId through visible nodes
- [x] ArrowLeft/Right — collapse/expand or move to parent/child
- [x] Enter — enter edit mode on focused node
- [x] Space — toggle complete (skips if input focused)
- [x] Cmd+⌫ — delete focused node
- [x] Cmd+D — duplicate
- [x] Cmd+T — toggle today
- [x] Cmd+K — open command palette
- [x] Cmd+/ — toggle shortcuts modal
- [x] Escape — clear focus and selection

---

### PHASE 9 — Inline Editing ✅ DONE (merged into Phase 7)

- [x] Double-click enters edit mode
- [x] Enter — save + create sibling below + start editing it
- [x] Tab — save + indentNode + keep editing
- [x] Shift+Tab — save + outdentNode + keep editing
- [x] Backspace on empty — delete node, focus+edit previous
- [x] Escape — cancel edit (no save)
- [x] Blur — save if has content, delete if empty new node
- [x] suppressBlurRef prevents double-action when Enter/Tab/Esc handled the event

---

### PHASE 10 — Command Palette ✅ DONE

- [x] `CommandPalette.tsx` — blur backdrop, auto-focus input
- [x] fuse.js fuzzy search on title + path
- [x] Recent nodes shown when query empty
- [x] Arrow key navigation in results
- [x] Enter selects → expandAll + setFocused + setSelected + close
- [x] Path display: `Career › Job Search › Direct Apply`

---

### PHASE 11 — Today System ✅ DONE

- [x] `TodayView.tsx` — renders todayIds filtered nodes with date header
- [x] Cmd+T toggles node in/out of todayIds
- [x] Badge count on "Today" sidebar nav item
- [x] Midnight reset: clears completed todayIds when date changes
- [x] Completing a task in Today updates the original node (same object)

---

### PHASE 12 — Context Panel ✅ DONE

- [x] `NodeDetails.tsx` — breadcrumb (useMemo), title input, today toggle, due date, reminder pills, notes textarea, timestamps
- [x] Breadcrumb computed with useMemo(selectBreadcrumb, [nodes, id])
- [x] Auto-save on blur for title and notes
- [x] Close button clears selectedId

---

### PHASE 17 — Shortcuts Modal ✅ DONE

- [x] `ShortcutsModal.tsx` — 2-column grid, grouped by Navigation/Editing/Actions/Global
- [x] `<kbd>` styled keys
- [x] Dismiss with Escape or Cmd+/

---

### PHASE 8 — Drag & Drop ⬜ NEXT

- [ ] Wrap `LifeTree` in `DndContext` from `@dnd-kit/core`
- [ ] Custom pointer sensor with 8px activation distance
- [ ] `SortableContext` with tree item ids
- [ ] `useSortable` on each `TreeNode`
- [ ] Drag overlay: ghost copy of dragged node (semi-transparent)
- [ ] `TreeDropIndicator.tsx` — horizontal line with depth indent
- [ ] `onDragOver`: compute drop target (before/after/inside) — reject if target is descendant
- [ ] `onDragEnd`: call `moveNode(id, newParentId, newIndex)`, clear drag state
- [ ] Keyboard drag: support drag via keyboard (dnd-kit built-in)
- [ ] Verify: reorder siblings, reparent nodes, cannot drop onto own descendants

---

### PHASE 13 — Upcoming & Notifications ⬜

- [ ] `UpcomingView.tsx`: filter nodes with dueDate within 7 days
- [ ] Group by: Overdue / Today / Tomorrow / This Week
- [ ] Show parent path for each item
- [ ] Badge count on "Upcoming" sidebar item (already in selectors)
- [ ] On `visibilitychange`: re-check overdue items, show inline banner

---

### PHASE 14 — Completed & Archive Views ⬜

- [ ] `CompletedView.tsx`: filter `node.completed === true`, sorted by updatedAt
- [ ] `ArchiveView.tsx`: filter `node.archived === true`
- [ ] "Archive" action in node "..." menu (sets `archived: true`, removes from main tree)
- [ ] "Unarchive" action in Archive view

---

### PHASE 15 — Undo / Redo ⬜

- [ ] `src/lib/commands.ts`: AddNodeCommand, DeleteNodeCommand, MoveNodeCommand, UpdateTitleCommand, ToggleCompleteCommand, IndentCommand, OutdentCommand
- [ ] Each command: `{ description, execute(), undo() }` — execute captured in closure
- [ ] `historySlice` in store: push on executeCommand, pop on undo, step forward on redo
- [ ] Cap at 100 entries (shift oldest)
- [ ] Wire all store mutations through executeCommand
- [ ] Cmd+Z → undo, Cmd+Shift+Z → redo
- [ ] Toast notification: "Undo: Deleted 'Apply OpenAI'"

---

### PHASE 16 — Micro-interactions & Polish ⬜

- [ ] TreeNode appear: fade + slide-up on mount (AnimatePresence)
- [ ] TreeNode delete: fade-out before removal
- [ ] Checkbox: spring SVG pathLength animation (already done ✅)
- [ ] Expand/collapse: height AnimatePresence on children container
- [ ] Command palette: scale(0.95)→scale(1) + fade on mount
- [ ] Hover actions: opacity 0→1 transition (currently CSS, migrate to Framer)
- [ ] Selection background: layout animation
- [ ] Completed strikethrough: pathLength animation on a line element
- [ ] Drag ghost: scale(1.02) + opacity(0.8)
- [ ] Smooth scroll: already handled by virtualizer scrollToIndex

---

### PHASE 18 — Settings ⬜

- [ ] Settings panel (slide in from sidebar or modal)
- [ ] Dark mode toggle → calls `toggleDarkMode()` (already in store)
- [ ] Export JSON → calls `exportData()` (already in storage.ts)
- [ ] Import JSON → file input → validate → load
- [ ] Clear all data → confirm → reset to seed data
- [ ] App version display

---

### PHASE 19 — Dark Mode ⬜

- [ ] Architecture already done: `data-theme="dark"` on `<html>`, all colors via CSS vars
- [ ] Wire toggle button in Settings to `toggleDarkMode()` action
- [ ] Test all components in dark mode — verify no hardcoded colors
- [ ] `prefers-color-scheme` media query as initial default (if no localStorage pref)

---

### PHASE 20 — Final QA & Performance ⬜

- [ ] Lighthouse audit: target 95+ performance score
- [ ] Test with 1000+ node tree: virtualization holds, no lag
- [ ] All keyboard shortcuts end-to-end
- [ ] Persistence: refresh preserves all state
- [ ] Today flow: add → complete → next day reset
- [ ] Drag & drop: reorder, reparent, deep nesting, keyboard drag
- [ ] Search: fuzzy match, path display, keyboard nav in results
- [ ] Cross-browser: Chrome, Safari, Firefox
- [ ] Accessibility audit: keyboard-only usage, ARIA, focus management
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
✅ Phase 9  → Inline editing (merged into phase 7)
✅ Phase 10 → Command palette + search
✅ Phase 11 → Today system
✅ Phase 12 → Context panel (right)
✅ Phase 17 → Shortcuts modal

⬜ Phase 8  → Drag and drop         ← NEXT
⬜ Phase 13 → Upcoming + notifications
⬜ Phase 14 → Completed + archive views
⬜ Phase 15 → Undo / redo
⬜ Phase 16 → Micro-interactions + polish
⬜ Phase 18 → Settings
⬜ Phase 19 → Dark mode
⬜ Phase 20 → QA + performance
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
