# idolist

A personal operating system built around a hierarchical life tree. Keyboard-first, premium feel, zero cloud dependency.

## What it is

idolist is not a todo app. It's a tree-structured map of everything that matters — areas of your life (Career, Health, Finance, Learning…) broken down into projects and tasks, all in one view. Think Notion's structure with Linear's keyboard speed.

## Features

- **Hierarchical tree** — unlimited depth, drag-and-drop reordering, collapse/expand
- **Multi-column layout** — inline progress bars, Today toggle, due date per row
- **Keyboard-first** — full navigation without a mouse (arrow keys, Enter, Tab, Cmd+K, E, etc.)
- **Today system** — mark any task for today (Cmd+T), dedicated today list in right panel
- **Life Progress** — overall completion % and per-area breakdowns always visible
- **Node icons** — emoji picker on every node, auto-icons by depth/type
- **Command palette** — Cmd+K fuzzy search across all nodes with path display
- **Undo/redo** — snapshot-based, 100-step history (Cmd+Z / Cmd+Shift+Z)
- **Dark mode** — animated toggle, CSS custom property system, no hardcoded colors
- **Persistence** — localStorage with debounced saves, export/import JSON, schema versioned
- **No signup, no cloud** — everything stays in your browser

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, SSR disabled for localStorage app) |
| Language | TypeScript strict |
| State | Zustand 5 + Immer 11 |
| Animations | Framer Motion 12 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/modifiers |
| Virtual Scroll | @tanstack/react-virtual |
| Search | fuse.js |
| Icons | Lucide React |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Testing | Vitest |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app seeds sample data (Career, Health, Finance, Learning) on first load.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `↑ ↓` | Navigate tree |
| `→ ←` | Expand / collapse |
| `Enter` | Edit node title |
| `Space` | Toggle complete |
| `E` | Open node details panel |
| `Tab` | Indent node |
| `Shift+Tab` | Outdent node |
| `Cmd+T` | Toggle Today |
| `Cmd+K` | Command palette / search |
| `Cmd+Z` | Undo |
| `Cmd+Shift+Z` | Redo |
| `Cmd+D` | Duplicate node |
| `Cmd+Delete` | Delete node |
| `Cmd+/` | Shortcuts reference |
| `Escape` | Close panel / cancel edit |

## Architecture

**Flat node map** — all nodes live in `Record<string, LifeNode>` with `parentId + childIds[]`. O(1) lookup and move, no deep cloning.

**SSR disabled** — `dynamic({ ssr: false })` on the app shell prevents hydration mismatch for a localStorage-driven app.

**Zustand + Immer** — Zustand v5 with `useShallow` on all object selectors. Derived arrays computed with `useMemo` outside selectors to avoid infinite loops.

**Snapshot undo/redo** — each tracked mutation captures `beforeNodes + beforeRootIds` before writing, then stores a before/after `HistoryEntry`. No command objects needed.

**Virtual list always on** — @tanstack/react-virtual at 40px row height, overscan 10. Handles thousands of nodes without toggling.

## Project structure

```
src/
├── app/               # Next.js App Router (layout, page, globals.css)
├── components/
│   ├── layout/        # AppShell, Sidebar, ContextPanel
│   ├── tree/          # LifeTree, TreeNode, TreeNodeCheckbox, TreeNodeIcon, TreeNodeTitle
│   ├── panels/        # NodeDetails, TodayPanel, LifeProgressPanel, TodayView, UpcomingView, ...
│   ├── overlays/      # CommandPalette, ShortcutsModal, SettingsModal
│   └── ui/            # ProgressRing, Toast
├── store/             # Zustand store + selectors
├── hooks/             # useKeyboard
├── lib/               # tree.ts (pure utils), storage.ts, seed.ts, search.ts
└── types/             # LifeNode, View, HistoryEntry, etc.
```

## Testing

```bash
npm test
```

37 tests: 31 pure tree utility tests + 6 performance stress tests (1110-node tree, sub-50ms operations).

## Data

All data lives in `localStorage` under the key `idolist`. Use **Settings → Export** to download a JSON backup. Import and Clear are also available there.
