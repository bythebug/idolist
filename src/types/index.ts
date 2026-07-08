export type NodeType = "area" | "project" | "task" | "subtask";

export type ReminderOption = "none" | "today" | "tomorrow" | "custom";

export type View = "life" | "today" | "upcoming" | "completed" | "archive";

export interface LifeNode {
  id: string;
  title: string;
  type: NodeType;
  parentId: string | null;
  childIds: string[];
  completed: boolean;
  collapsed: boolean;
  archived: boolean;
  reminder: ReminderOption;
  dueDate: string | null;
  notes: string;
  icon: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface VisibleNode {
  id: string;
  depth: number;
}

export interface SearchResult {
  id: string;
  title: string;
  path: string[];
}

export interface DragState {
  draggingId: string;
  overId: string | null;
  dropPosition: "before" | "after" | "inside" | null;
}

export interface Command {
  description: string;
  execute: () => void;
  undo: () => void;
}

export interface DropTarget {
  parentId: string | null;
  index: number;
}
