import type { LifeNode, VisibleNode, SearchResult } from "@/types";
import {
  getVisibleNodes,
  getParentChain,
  getCompletionRatio,
} from "@/lib/tree";
import { addDays, isAfter, isBefore, startOfDay } from "date-fns";

export function selectVisibleNodes(
  nodes: Record<string, LifeNode>,
  rootIds: string[],
  collapsedIds: Set<string>,
  view: string
): VisibleNode[] {
  if (view !== "life") return [];
  return getVisibleNodes(nodes, rootIds, collapsedIds);
}

export function selectBreadcrumb(
  nodes: Record<string, LifeNode>,
  id: string | null
): LifeNode[] {
  if (!id) return [];
  return getParentChain(nodes, id);
}

export function selectCompletionRatio(
  nodes: Record<string, LifeNode>
): number {
  return getCompletionRatio(nodes);
}

export function selectTodayNodes(
  nodes: Record<string, LifeNode>,
  todayIds: Set<string>
): LifeNode[] {
  return Array.from(todayIds)
    .map((id) => nodes[id])
    .filter((n): n is LifeNode => n !== undefined && !n.archived);
}

export function selectCompletedNodes(
  nodes: Record<string, LifeNode>
): LifeNode[] {
  return Object.values(nodes).filter((n) => n.completed && !n.archived);
}

export function selectUpcomingNodes(
  nodes: Record<string, LifeNode>
): { node: LifeNode; daysUntil: number }[] {
  const now = startOfDay(new Date());
  const cutoff = addDays(now, 7);
  return Object.values(nodes)
    .filter((n) => {
      if (n.archived || n.completed) return false;
      if (!n.dueDate) return false;
      const due = startOfDay(new Date(n.dueDate));
      return !isAfter(due, cutoff);
    })
    .map((n) => {
      const due = startOfDay(new Date(n.dueDate!));
      const diff = Math.round(
        (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { node: n, daysUntil: diff };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function selectSearchIndex(
  nodes: Record<string, LifeNode>
): SearchResult[] {
  return Object.values(nodes)
    .filter((n) => !n.archived)
    .map((n) => {
      const chain = getParentChain(nodes, n.id);
      return {
        id: n.id,
        title: n.title,
        path: [...chain.map((p) => p.title), n.title],
      };
    });
}

export function selectTodayCount(todayIds: Set<string>): number {
  return todayIds.size;
}

export function selectUpcomingCount(
  nodes: Record<string, LifeNode>
): number {
  return selectUpcomingNodes(nodes).length;
}
