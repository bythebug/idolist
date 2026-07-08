# Agent Instructions — idolist

## Framework version

This project uses **Next.js 16.2.10** with the App Router. APIs and conventions differ from what most models have in training data. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## Critical patterns — read before touching any code

### Zustand v5 + Immer v11

```typescript
// Store creation — double invocation required
const useStore = create<StoreType>()(immer((set, get) => ({ ... })));

// enableMapSet() must be called at module level for Set<string> mutations
import { enableMapSet } from "immer";
enableMapSet();

// useShallow required on ALL object/array selectors — omitting it causes infinite loops
const { nodes, rootIds } = useStore(useShallow((s) => ({ nodes: s.nodes, rootIds: s.rootIds })));

// Derived arrays go in useMemo OUTSIDE the selector
const visible = useMemo(() => selectVisibleNodes(nodes, rootIds, collapsedIds, view), [nodes, rootIds, collapsedIds, view]);
// NEVER compute derived arrays inside useStore() — causes infinite re-renders
```

### SSR safety

```typescript
// page.tsx — always dynamic with ssr: false (app is localStorage-driven)
const AppShell = dynamic(() => import("@/components/layout/AppShell"), { ssr: false });
```

### Undo/redo pattern

```typescript
// Capture snapshot BEFORE mutation, then call recordHistory AFTER
const beforeNodes = get().nodes;
const beforeRootIds = get().rootIds;
set((state) => { /* mutation via Immer */ });
recordHistory("description", beforeNodes, beforeRootIds);
// recordHistory reads afterNodes/afterRootIds from get() — don't pass them
```

### Store event listeners

```typescript
// storeRef pattern — prevents re-registering listener on every render
const storeRef = useRef<IdolistStore | null>(null);
const store = useStore();
storeRef.current = store;
useEffect(() => {
  function handler(e: KeyboardEvent) {
    const s = storeRef.current; // always current state, no stale closure
    // ...
  }
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, []); // empty deps — intentional
```

## Data model

```typescript
interface LifeNode {
  id: string;
  title: string;
  type: "area" | "project" | "task" | "subtask";
  parentId: string | null;
  childIds: string[];
  completed: boolean;
  archived: boolean;
  icon: string | null;       // emoji or null
  notes: string;
  dueDate: string | null;    // ISO date string
  reminder: ReminderOption;
  createdAt: number;         // Date.now()
  updatedAt: number;
}

// Store shape
{
  nodes: Record<string, LifeNode>;  // flat map — never nest
  rootIds: string[];                 // top-level order
  collapsedIds: Set<string>;         // collapsed node ids
  todayIds: Set<string>;             // nodes marked for today
  selectedId: string | null;         // opens NodeDetails overlay
  focusedId: string | null;          // keyboard cursor
  editingId: string | null;          // inline edit active
  view: "life" | "today" | "upcoming" | "completed" | "archive";
  darkMode: boolean;
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  // ...UI flags: commandPaletteOpen, shortcutsOpen, settingsOpen, toasts
}
```

## Layout

Three-column CSS grid: `var(--sidebar-width) 1fr var(--panel-width)`

- **Sidebar** (210px): `Sidebar.tsx` — nav, area tags, settings
- **Tree** (flex 1): `LifeTree.tsx` — virtualized at 40px rows, multi-column (title / progress / today / due)
- **Right panel** (260px): `ContextPanel.tsx` — always shows TodayPanel + LifeProgressPanel; NodeDetails slides in as overlay when selectedId is set

## Tree rendering

- `@tanstack/react-virtual` with `estimateSize: () => 40`
- `selectVisibleNodes` flattens the tree respecting `collapsedIds`
- `TreeNode` is `React.memo` — only re-renders when its own node data changes
- Column widths exported as constants from `TreeNode.tsx`: `COL_PROGRESS=96`, `COL_TODAY=40`, `COL_DUE=72`
- Import these in `LifeTree.tsx` for column header alignment

## Pure utility functions

`src/lib/tree.ts` — no store imports. All functions are pure:
- `getVisibleNodes(nodes, rootIds, collapsedIds, view)` — flattened list for virtualizer
- `getSubtree(nodes, id)` — id + all descendants
- `getSubtreeCompletionRatio(nodes, id)` — leaf-based ratio
- `getParentChain(nodes, id)` — ancestor ids (NOT including id itself)
- `isDescendant(nodes, ancestorId, nodeId)` — drop validation

## CSS conventions

All colors via CSS custom properties — no hardcoded hex or rgba in components:

```css
var(--text-primary)      var(--text-secondary)    var(--text-muted)
var(--text-completed)    var(--text-placeholder)
var(--bg-app)            var(--bg-panel)          var(--bg-sidebar)
var(--bg-node-hover)     var(--bg-node-selected)
var(--border)            var(--border-subtle)
var(--accent)            var(--accent-subtle)
var(--success)           var(--warning)
var(--danger-subtle)     var(--danger-subtle-2)   ...
```

Dark mode via `data-theme="dark"` on `<html>` — all vars redeclared in `[data-theme="dark"]` block.

## What NOT to do

- Do not import store directly in `src/lib/tree.ts` — pure functions only
- Do not return `{}` or `[]` literals from `useStore()` selectors — always `useShallow`
- Do not compute derived arrays inside `useStore()` — use `useMemo` outside
- Do not hardcode colors — use CSS vars
- Do not add `ssr: true` to any dynamic imports that touch localStorage or store
- Do not skip `enableMapSet()` when adding Set mutations to Immer producers
