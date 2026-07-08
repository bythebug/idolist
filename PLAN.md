# LifeOS — Master Build Plan

## Context

LifeOS is a personal operating system — a single-page application built around a hierarchical life tree. The user wants a premium, keyboard-first productivity tool that feels like Linear/Notion rather than Jira/ClickUp. This document is the **single source of truth** for how we build it, phase by phase.

The repository at `/Users/sverma/code/idolist` is a clean git repo with no code. We start from zero.

---

## Technology Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR optional later, great DX, React 18 |
| Language | TypeScript strict | Catch tree mutation bugs early |
| Styling | Tailwind CSS v4 | Utility-first, design system via CSS vars |
| State | Zustand + Immer | Lightweight, devtools, easy undo/redo |
| Animations | Framer Motion | Spring physics, layout animations |
| Icons | Lucide React | Clean, consistent |
| Fonts | Inter (next/font) | Designer choice from spec |
| Drag & Drop | @dnd-kit | Accessible, tree-aware, no legacy deps |
| Virtual Scroll | @tanstack/virtual | Performance at thousands of nodes |
| Persistence | localStorage (v1) | Abstraction layer ready for IndexedDB/cloud |
| Undo/Redo | Command pattern in Zustand | History stack, 100 step limit |
| Testing | Vitest + Testing Library | Unit + integration |

---

## Architectural Decisions (Phase 1)

### Node Storage: Flat Map, Not Nested Tree

```
// WRONG — nested is hard to mutate
{ id: "1", children: [{ id: "2", children: [...] }] }

// RIGHT — flat map with parent references
Map<string, Node> where each Node has parentId + childIds[]
```

Why: O(1) lookup, O(1) move, no deep cloning, easy serialization.

### Rendering Strategy

- Render visible tree nodes only via `@tanstack/virtual`
- Each node row is 36px fixed height
- Expand/collapse toggled in Zustand, re-renders only changed subtree
- `React.memo` on every TreeNode component

### Drag & Drop Strategy

- `@dnd-kit/sortable` with custom tree sensor
- Drag renders a ghost overlay (not moving DOM nodes)
- Drop indicators show insertion position
- On drop: update parentId + reorder childIds in store

### Keyboard Navigation Strategy

- Single event listener on tree container (event delegation)
- `focusedNodeId` in Zustand tracks keyboard cursor
- Arrow keys move focus, not DOM focus (avoids scroll jump)
- Enter/Tab/Backspace handled in editing mode separately

### State Shape

```typescript
interface LifeOSStore {
  nodes: Record<string, Node>      // flat map
  rootIds: string[]                 // top-level nodes
  expandedIds: Set<string>          // which nodes are open
  selectedId: string | null         // right panel context
  focusedId: string | null          // keyboard cursor
  editingId: string | null          // inline edit active
  todayIds: Set<string>             // "Today" view
  history: Command[]               // undo stack
  historyIndex: number
  searchQuery: string
  view: 'life' | 'today' | 'upcoming' | 'completed' | 'archive'
}
```

---

## Folder Structure

```
/Users/sverma/code/idolist/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, font, theme
│   │   ├── page.tsx               # Single page app shell
│   │   └── globals.css            # Tailwind + CSS vars
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx       # 3-column grid container
│   │   │   ├── Sidebar.tsx        # Left nav
│   │   │   └── ContextPanel.tsx   # Right detail panel
│   │   ├── tree/
│   │   │   ├── LifeTree.tsx       # Virtualized tree container
│   │   │   ├── TreeNode.tsx       # Single row (memoized)
│   │   │   ├── TreeNodeCheckbox.tsx
│   │   │   ├── TreeNodeIcon.tsx
│   │   │   ├── TreeNodeTitle.tsx  # Inline edit input
│   │   │   └── TreeDropIndicator.tsx
│   │   ├── panels/
│   │   │   ├── NodeDetails.tsx    # Right panel content
│   │   │   ├── TodayView.tsx
│   │   │   └── SearchResults.tsx
│   │   ├── overlays/
│   │   │   ├── CommandPalette.tsx # Cmd+K search
│   │   │   ├── QuickAdd.tsx
│   │   │   └── ShortcutsModal.tsx # Cmd+/
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── ProgressRing.tsx
│   │       ├── Tooltip.tsx
│   │       ├── Breadcrumb.tsx
│   │       └── ReminderPicker.tsx
│   ├── store/
│   │   ├── index.ts               # Zustand store export
│   │   ├── slices/
│   │   │   ├── nodesSlice.ts      # CRUD operations
│   │   │   ├── uiSlice.ts         # View state, modals
│   │   │   ├── todaySlice.ts      # Today view logic
│   │   │   └── historySlice.ts    # Undo/redo commands
│   │   └── selectors.ts           # Derived state (memoized)
│   ├── hooks/
│   │   ├── useKeyboard.ts         # Global keyboard handler
│   │   ├── useTreeNavigation.ts   # Arrow key movement
│   │   ├── useInlineEdit.ts       # Enter/Tab/Backspace
│   │   ├── useDragDrop.ts         # dnd-kit integration
│   │   └── useSearch.ts           # Fuzzy search logic
│   ├── lib/
│   │   ├── tree.ts                # Pure tree utility functions
│   │   ├── commands.ts            # Undo/redo command objects
│   │   ├── storage.ts             # localStorage abstraction
│   │   ├── search.ts              # Search index + scoring
│   │   └── shortcuts.ts           # Shortcut definitions
│   └── types/
│       └── index.ts               # Node, View, Command types
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## Detailed Phase-by-Phase TODO

---

### PHASE 0 — Project Bootstrap

- [ ] `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"`
- [ ] Install dependencies:
  - `zustand immer`
  - `framer-motion`
  - `lucide-react`
  - `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
  - `@tanstack/react-virtual`
  - `fuse.js` (fuzzy search)
  - `nanoid` (node IDs)
  - `date-fns` (reminder dates)
- [ ] Install dev dependencies:
  - `vitest @testing-library/react @testing-library/user-event`
  - `@vitejs/plugin-react`
- [ ] Configure `tsconfig.json` for strict mode
- [ ] Set up `tailwind.config.ts` with Inter font, 8px spacing scale, custom colors
- [ ] Create `globals.css` with CSS custom properties for design tokens (light + dark mode vars)
- [ ] Delete Next.js boilerplate (default page content, logo images)
- [ ] Verify: `npm run dev` shows blank page, no errors

---

### PHASE 1 — Types & Data Model

- [ ] Create `src/types/index.ts`:
  - [ ] `NodeType = 'area' | 'project' | 'task' | 'subtask'`
  - [ ] `ReminderOption = 'none' | 'today' | 'tomorrow' | 'custom'`
  - [ ] `View = 'life' | 'today' | 'upcoming' | 'completed' | 'archive'`
  - [ ] `Node` interface with all fields: `id, title, type, parentId, childIds, completed, today, reminder, dueDate, notes, icon, depth, collapsed, createdAt, updatedAt`
  - [ ] `Command` interface for undo/redo: `execute(), undo(), description`
  - [ ] `DragState` interface for drag preview
  - [ ] `SearchResult` interface with path array
- [ ] Create `src/lib/tree.ts` — pure utility functions (no store imports):
  - [ ] `getNode(nodes, id)` — O(1) lookup
  - [ ] `getChildren(nodes, id)` — returns ordered child nodes
  - [ ] `getParentChain(nodes, id)` — returns breadcrumb array
  - [ ] `getVisibleNodes(nodes, rootIds, expandedIds)` — flattened visible list for virtualizer
  - [ ] `getSubtree(nodes, id)` — returns id + all descendants
  - [ ] `getCompletionRatio(nodes)` — for progress ring
  - [ ] `isDescendant(nodes, ancestorId, nodeId)` — drop validation
  - [ ] `reorderChildren(nodes, parentId, fromIndex, toIndex)` — for drag drop
  - [ ] Write unit tests for each function in `src/lib/tree.test.ts`

---

### PHASE 2 — Zustand Store

- [ ] Create `src/store/index.ts` — combined Zustand store with Immer middleware
- [ ] `src/store/slices/nodesSlice.ts`:
  - [ ] `addNode(parentId, afterId?)` — creates new node, returns id
  - [ ] `updateNode(id, changes)` — partial update
  - [ ] `deleteNode(id)` — removes node + all descendants
  - [ ] `moveNode(id, newParentId, newIndex)` — reparent
  - [ ] `toggleComplete(id)` — flip completed flag
  - [ ] `toggleCollapsed(id)` — flip collapsed flag
  - [ ] `duplicateNode(id)` — deep copy with new ids
  - [ ] `indentNode(id)` — make sibling of current parent's sibling above
  - [ ] `outdentNode(id)` — make next sibling of parent
  - [ ] `collapseAll()` / `expandAll()`
- [ ] `src/store/slices/uiSlice.ts`:
  - [ ] `selectedId`, `focusedId`, `editingId` state
  - [ ] `view` state (current sidebar selection)
  - [ ] `commandPaletteOpen`, `shortcutsOpen` booleans
  - [ ] `setSelected(id)`, `setFocused(id)`, `setEditing(id)`, `clearEditing()`
  - [ ] `openCommandPalette()`, `closeCommandPalette()`
- [ ] `src/store/slices/todaySlice.ts`:
  - [ ] `todayIds: Set<string>` persisted
  - [ ] `addToToday(id)`, `removeFromToday(id)`
  - [ ] `clearTodayCompleted()` — called at midnight
- [ ] `src/store/slices/historySlice.ts`:
  - [ ] History stack (max 100 entries)
  - [ ] `executeCommand(command)` — push + execute
  - [ ] `undo()` — pop + reverse
  - [ ] `redo()` — step forward
- [ ] `src/store/selectors.ts`:
  - [ ] `selectVisibleNodes` — memoized with `createSelector`
  - [ ] `selectBreadcrumb(id)` — path for right panel
  - [ ] `selectTodayNodes` — filter by todayIds
  - [ ] `selectCompletionRatio` — global progress
  - [ ] `selectUpcomingNodes` — reminder within 7 days
- [ ] Write store integration tests

---

### PHASE 3 — Persistence Layer

- [ ] Create `src/lib/storage.ts`:
  - [ ] `saveState(state)` — serialize to localStorage
  - [ ] `loadState()` — deserialize, validate schema, return or return default
  - [ ] `exportData()` — JSON download
  - [ ] `importData(json)` — validate + load
  - [ ] Schema version field for future migrations
  - [ ] Debounce saves (300ms) to avoid thrashing on every keystroke
- [ ] Wire persistence into Zustand via `subscribe` (not middleware) to avoid render-time side effects
- [ ] Seed store with sample data when localStorage is empty (Career, Health, Finance, Learning example tree)

---

### PHASE 4 — App Shell & Layout

- [ ] Update `src/app/layout.tsx`:
  - [ ] Load Inter font via `next/font/google`
  - [ ] Apply `antialiased` class, set HTML lang
  - [ ] Wrap with `<StoreProvider>` if needed
- [ ] Update `src/app/page.tsx` to render `<AppShell />`
- [ ] Create `src/components/layout/AppShell.tsx`:
  - [ ] CSS Grid: `240px auto 320px` columns
  - [ ] Full viewport height, no scroll on outer container
  - [ ] Sidebar | Tree | ContextPanel regions
  - [ ] Context panel collapses when nothing selected
- [ ] Create `src/components/layout/Sidebar.tsx`:
  - [ ] Navigation items: Life, Today, Upcoming, Completed, Archive
  - [ ] Search input at top
  - [ ] Active item highlight
  - [ ] Bottom section: ProgressRing + statistics
  - [ ] Each nav item updates `view` in store
- [ ] Verify: Layout renders, three columns visible, no content yet

---

### PHASE 5 — ProgressRing Component

- [ ] Create `src/components/ui/ProgressRing.tsx`:
  - [ ] SVG circle with `stroke-dasharray` / `stroke-dashoffset` animation
  - [ ] Framer Motion `animate` on value change
  - [ ] Shows percentage complete (completed nodes / total leaf nodes)
  - [ ] Color: green at high %, yellow at mid, subtle at 0
- [ ] Wire to `selectCompletionRatio` selector
- [ ] Place in sidebar bottom section

---

### PHASE 6 — Tree Rendering (Core)

- [ ] Create `src/components/tree/LifeTree.tsx`:
  - [ ] Use `@tanstack/react-virtual` with `useVirtualizer`
  - [ ] Fixed item size: 36px per row
  - [ ] Estimated total count from `selectVisibleNodes`
  - [ ] Render only visible window of nodes
  - [ ] Pass each `virtualItem.index` to `TreeNode`
  - [ ] Handle empty state (show "Add your first area" prompt)
- [ ] Create `src/components/tree/TreeNode.tsx` (React.memo):
  - [ ] Row structure: `[indent] [collapse-toggle] [checkbox] [icon] [title] [actions]`
  - [ ] Indent: `depth * 20px` left padding
  - [ ] Collapse toggle: chevron icon, only shows if has children
  - [ ] Hover state reveals action buttons (add child, more options)
  - [ ] Selected state: subtle background
  - [ ] Focused state (keyboard): ring border
  - [ ] Completed state: strikethrough title, muted color
- [ ] Create `src/components/tree/TreeNodeCheckbox.tsx`:
  - [ ] Animated checkbox (Framer Motion spring checkmark SVG)
  - [ ] Click toggles `completed` in store
  - [ ] Space key also triggers when node is focused
- [ ] Create `src/components/tree/TreeNodeTitle.tsx`:
  - [ ] Renders as `<span>` normally
  - [ ] Switches to `<input>` when `editingId === node.id`
  - [ ] Auto-focus + select all on enter edit mode
  - [ ] `onBlur` and `Enter` save title
  - [ ] `Escape` cancels edit (reverts to previous title)
  - [ ] Empty title on blur → delete node
- [ ] Verify: Sample tree renders, expand/collapse works, titles visible

---

### PHASE 7 — Keyboard Navigation

- [ ] Create `src/hooks/useKeyboard.ts`:
  - [ ] Attach single `keydown` listener to `document`
  - [ ] Route events based on `editingId` (editing vs navigation mode)
  - [ ] Handle global shortcuts first (Cmd+K, Cmd+T, Cmd+/, Cmd+Z, Cmd+Shift+Z)
  - [ ] Pass remaining to `useTreeNavigation`
- [ ] Create `src/hooks/useTreeNavigation.ts`:
  - [ ] `ArrowDown` — move `focusedId` to next visible node
  - [ ] `ArrowUp` — move `focusedId` to previous visible node
  - [ ] `ArrowRight` — expand node if collapsed, else move to first child
  - [ ] `ArrowLeft` — collapse node if expanded, else move to parent
  - [ ] `Enter` — enter edit mode OR create sibling below
  - [ ] `Space` — toggle complete
  - [ ] `Delete` — delete focused node
  - [ ] `Cmd+D` — duplicate node
  - [ ] `Cmd+T` — add focused node to Today
  - [ ] Scroll virtualized list to keep focused node in view
- [ ] Create `src/hooks/useInlineEdit.ts`:
  - [ ] `Enter` in edit mode — save + create new sibling below, start editing it
  - [ ] `Tab` in edit mode — indent node
  - [ ] `Shift+Tab` in edit mode — outdent node
  - [ ] `Backspace` on empty title — delete node, focus previous
  - [ ] `Escape` — cancel edit
- [ ] Wire hooks into LifeTree container
- [ ] Verify: Full keyboard navigation works without mouse

---

### PHASE 8 — Drag & Drop

- [ ] Create `src/hooks/useDragDrop.ts`:
  - [ ] Wrap `@dnd-kit/core` `DndContext` around LifeTree
  - [ ] Custom pointer sensor with 8px drag threshold
  - [ ] Drag start: set `draggingId` in store, show ghost
  - [ ] Drag over: calculate drop target (between, inside, cannot drop on descendant)
  - [ ] Drop: call `moveNode(id, newParentId, newIndex)`
  - [ ] Cancel: clear drag state
- [ ] Create `src/components/tree/TreeDropIndicator.tsx`:
  - [ ] Horizontal line with indent that shows drop position
  - [ ] Animated in with Framer Motion layout
- [ ] Verify: Drag nodes to reorder, drag into parent works, no dropping on own descendants

---

### PHASE 9 — Inline Editing Experience (Full)

- [ ] Double-click on title enters edit mode
- [ ] Single click selects node (opens right panel) without entering edit mode
- [ ] Tab key behavior: if at end of editing → indent; Tab in nav mode → indent (same)
- [ ] Multi-node editing flow: Enter creates sibling, cursor moves to new node in edit mode
- [ ] Node creation: new node appears immediately with edit mode active
- [ ] Auto-scroll: virtual list scrolls to keep new node visible
- [ ] Title truncation with ellipsis when not editing (single line)
- [ ] Verify: Notion-like editing flow — Enter, Tab, Shift+Tab, Backspace on empty

---

### PHASE 10 — Command Palette (Cmd+K)

- [ ] Create `src/components/overlays/CommandPalette.tsx`:
  - [ ] Modal overlay with blur backdrop
  - [ ] Search input auto-focused on open
  - [ ] `Escape` closes
  - [ ] Results show node title + full path (`Career › Job Search › Direct Apply`)
  - [ ] Keyboard: `ArrowUp/Down` to navigate results, `Enter` to jump
  - [ ] On select: close palette, expand parents of selected node, scroll to + focus node
- [ ] Create `src/lib/search.ts`:
  - [ ] Build flat search index from all nodes (id, title, path)
  - [ ] Use `fuse.js` for fuzzy search with path weighting
  - [ ] Recent nodes shown when query is empty
  - [ ] Debounce index rebuild on store changes (500ms)
- [ ] Create `src/hooks/useSearch.ts`:
  - [ ] Wraps search lib, returns results as `SearchResult[]`
  - [ ] Memoized per query string
- [ ] Verify: Cmd+K opens palette, typing searches, Enter jumps to node

---

### PHASE 11 — Today System

- [ ] Create `src/components/panels/TodayView.tsx`:
  - [ ] Filtered view showing only nodes where `todayIds.has(id)`
  - [ ] Same TreeNode component, just different data source
  - [ ] Header shows date and task count
  - [ ] Completing a task in Today also completes it in main tree (same node object)
- [ ] `Cmd+T` on focused node: toggles `today` flag, updates `todayIds` in store
- [ ] Midnight reset: check `lastResetDate` in storage; if different from today, clear todayIds of completed nodes
- [ ] Today badge on sidebar nav item showing count
- [ ] Verify: Add to Today, complete in Today, verify main tree updates

---

### PHASE 12 — Context Panel (Right)

- [ ] Create `src/components/panels/NodeDetails.tsx`:
  - [ ] Shows when `selectedId` is set
  - [ ] Breadcrumb at top: `Career › Job Search › Direct Apply`
  - [ ] Inline title edit (larger, heading style)
  - [ ] Notes textarea (expandable, auto-save on blur)
  - [ ] Due date picker (simple date input, styled)
  - [ ] Reminder picker: None / Today / Tomorrow / Custom
  - [ ] "Add to Today" toggle button
  - [ ] Completion status
  - [ ] Created/Updated timestamps at bottom
- [ ] Create `src/components/ui/Breadcrumb.tsx`:
  - [ ] Clickable path segments — each focuses that node in tree
  - [ ] Overflow: ellipsis for deep paths
- [ ] Create `src/components/ui/ReminderPicker.tsx`:
  - [ ] Pill buttons: None, Today, Tomorrow, Custom
  - [ ] Custom shows native date+time input
- [ ] Verify: Select a node, right panel populates, edit notes, set reminder

---

### PHASE 13 — Upcoming & Notifications

- [ ] Create `src/components/panels/UpcomingView.tsx`:
  - [ ] Nodes with reminder or dueDate within next 7 days
  - [ ] Grouped by date: Today, Tomorrow, This Week
  - [ ] Each item shows parent path
- [ ] Notification system:
  - [ ] Check overdue/due reminders on app focus (`visibilitychange`)
  - [ ] Show notification banner at top of screen (not browser notifications yet)
  - [ ] Count badge on "Upcoming" sidebar item
- [ ] Verify: Set a reminder for tomorrow, check Upcoming view shows it

---

### PHASE 14 — Completed & Archive Views

- [ ] Completed view: filter `nodes` where `completed === true`
- [ ] Archive view: nodes with `archived === true` flag (add to Node type)
- [ ] "Archive" action in node context menu (right-click or "..." button)
- [ ] Archive removes from main tree view but preserves data

---

### PHASE 15 — Undo / Redo

- [ ] Create `src/lib/commands.ts` — Command pattern objects:
  - [ ] `AddNodeCommand` — creates node, undo deletes it
  - [ ] `DeleteNodeCommand` — saves snapshot of node + descendants, undo restores
  - [ ] `MoveNodeCommand` — saves old position, undo moves back
  - [ ] `UpdateTitleCommand` — saves old title, undo reverts
  - [ ] `ToggleCompleteCommand` — saves old state
  - [ ] `IndentCommand` / `OutdentCommand`
- [ ] Wrap all store mutations to go through `executeCommand`
- [ ] `Cmd+Z` → `undo()`, `Cmd+Shift+Z` → `redo()`
- [ ] Show brief toast ("Undo: Deleted node") for clarity
- [ ] Cap history at 100 commands (drop oldest)
- [ ] Verify: Add nodes, delete, Cmd+Z restores

---

### PHASE 16 — Micro-interactions & Polish

- [ ] TreeNode mount animation: slide in from left, fade in (Framer Motion)
- [ ] Checkbox animation: spring-physics SVG checkmark draw
- [ ] Expand/collapse: height animation via `AnimatePresence`
- [ ] Progress ring: animated value change
- [ ] Command palette: scale + fade in
- [ ] Node deletion: fade out before removal
- [ ] Drag ghost: semi-transparent, follows cursor with slight scale
- [ ] Hover actions fade in on node hover
- [ ] Selection highlight: smooth background transition
- [ ] Completion: title strikethrough animates from left to right

---

### PHASE 17 — Shortcuts Modal (Cmd+/)

- [ ] Create `src/components/overlays/ShortcutsModal.tsx`:
  - [ ] Full keyboard shortcut reference
  - [ ] Grouped: Navigation, Editing, Tree, Views, Global
  - [ ] Beautiful two-column grid with `kbd` styled keys
  - [ ] Dismiss with Escape or Cmd+/
- [ ] Create `src/lib/shortcuts.ts`:
  - [ ] Single source of truth for all shortcut definitions
  - [ ] Each shortcut: `{ keys, description, group }`

---

### PHASE 18 — Settings

- [ ] Settings accessible from sidebar bottom
- [ ] Settings items (MVP):
  - [ ] Dark mode toggle (CSS var swap)
  - [ ] Export data (JSON download)
  - [ ] Import data (file picker)
  - [ ] Clear all data (with confirmation)
  - [ ] App version

---

### PHASE 19 — Dark Mode

- [ ] CSS custom properties approach (already architected in globals.css)
- [ ] Toggle via `data-theme="dark"` on `<html>`
- [ ] All color values from CSS vars — no hardcoded Tailwind colors in components
- [ ] Persist preference in localStorage
- [ ] Respect `prefers-color-scheme` as default

---

### PHASE 20 — Final QA & Performance

- [ ] Lighthouse audit: target 95+ performance score
- [ ] Test with 1000+ node tree: virtualization holds
- [ ] Test all keyboard shortcuts end-to-end
- [ ] Test persistence: refresh preserves all state
- [ ] Test undo/redo: 20 operations, undo all, redo all
- [ ] Test Today flow: add, complete, next day reset
- [ ] Test drag & drop: reorder, reparent, deep nesting
- [ ] Test search: fuzzy match, path display, keyboard nav in results
- [ ] Cross-browser: Chrome, Safari, Firefox
- [ ] Accessibility: keyboard only usage, focus management, ARIA labels on interactive elements
- [ ] Bundle size audit: ensure < 200KB gzipped

---

## Build Order Summary

```
Phase 0  → Bootstrap + tooling
Phase 1  → Types + pure tree utilities
Phase 2  → Zustand store (all slices)
Phase 3  → Persistence layer
Phase 4  → App shell + layout grid
Phase 5  → ProgressRing component
Phase 6  → Tree rendering (static, no interaction)
Phase 7  → Keyboard navigation
Phase 8  → Drag and drop
Phase 9  → Full inline editing
Phase 10 → Command palette + search
Phase 11 → Today system
Phase 12 → Context panel (right)
Phase 13 → Upcoming + notifications
Phase 14 → Completed + archive views
Phase 15 → Undo / redo
Phase 16 → Micro-interactions + polish
Phase 17 → Shortcuts modal
Phase 18 → Settings
Phase 19 → Dark mode
Phase 20 → QA + performance
```

---

## Critical Rules

1. **No code before this plan is approved.** Each phase reviewed before starting next.
2. **Tree utility functions are pure** — no store imports in `src/lib/tree.ts`.
3. **Components never import from store directly** — use hooks (`useStore(selector)`).
4. **Flat node map is sacred** — never nest nodes in component state.
5. **Every interaction has a keyboard path** — no mouse-only features.
6. **Animations use Framer Motion** — no CSS transitions for interactive elements.
7. **localStorage writes are debounced** — never write on every keystroke.
8. **Virtual list is always on** — even for small trees (simpler than toggling).

---

## First Deliverable

When user approves this plan, the **first task** is:

1. Run `npx create-next-app@latest` with the config above
2. Install all dependencies
3. Create the folder structure (empty files with correct exports)
4. Write all types in `src/types/index.ts`
5. Write all pure tree utilities in `src/lib/tree.ts` with tests
6. Get a blank app running at `localhost:3000`

Only then do we touch any UI component.
