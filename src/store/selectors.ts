import type { LifeNode, VisibleNode, SearchResult } from "@/types";
import { INBOX_ID } from "@/types";
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
  return getVisibleNodes(nodes, rootIds.filter((id) => id !== INBOX_ID), collapsedIds);
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
  const results: { node: LifeNode; daysUntil: number }[] = [];

  for (const n of Object.values(nodes)) {
    if (n.archived || n.completed) continue;

    let daysUntil: number | null = null;

    if (n.reminder === "today") {
      daysUntil = 0;
    } else if (n.reminder === "tomorrow") {
      daysUntil = 1;
    } else if (n.dueDate) {
      const due = startOfDay(new Date(n.dueDate));
      if (isAfter(due, cutoff)) continue;
      daysUntil = Math.round(
        (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    if (daysUntil !== null) {
      results.push({ node: n, daysUntil });
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
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

export function selectTodayCount(
  nodes: Record<string, LifeNode>,
  todayIds: Set<string>
): number {
  return Array.from(todayIds).filter(
    (id) => nodes[id] && !nodes[id].archived
  ).length;
}

export function selectUpcomingCount(
  nodes: Record<string, LifeNode>
): number {
  return selectUpcomingNodes(nodes).length;
}
