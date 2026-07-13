export type NodeType = "area" | "project" | "task" | "subtask";

export type ReminderOption = "none" | "today" | "tomorrow" | "custom";

export type RepeatOption = "none" | "daily" | "weekly" | "monthly";

export type View = "life" | "today" | "upcoming" | "inbox" | "completed" | "archive";

export const INBOX_ID = "__inbox__";

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
  repeat: RepeatOption;
  lastCompletedAt: number | null;
  dueDate: string | null;
  dueTime: string | null;        // "HH:mm" 24-hour, null if not set
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
