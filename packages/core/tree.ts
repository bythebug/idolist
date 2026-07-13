import type { LifeNode, VisibleNode } from "./types";

export function getNode(
  nodes: Record<string, LifeNode>,
  id: string
): LifeNode | undefined {
  return nodes[id];
}

export function getChildren(
  nodes: Record<string, LifeNode>,
  id: string
): LifeNode[] {
  const node = nodes[id];
  if (!node) return [];
  return node.childIds
    .map((childId) => nodes[childId])
    .filter((n): n is LifeNode => n !== undefined);
}

export function getParentChain(
  nodes: Record<string, LifeNode>,
  id: string
): LifeNode[] {
  const chain: LifeNode[] = [];
  let current = nodes[id];
  while (current?.parentId) {
    const parent = nodes[current.parentId];
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export function getVisibleNodes(
  nodes: Record<string, LifeNode>,
  rootIds: string[],
  collapsedIds: Set<string>
): VisibleNode[] {
  const result: VisibleNode[] = [];

  function walk(id: string, depth: number) {
    const node = nodes[id];
    if (!node || node.archived) return;
    result.push({ id, depth });
    if (!collapsedIds.has(id) && node.childIds.length > 0) {
      for (const childId of node.childIds) {
        walk(childId, depth + 1);
      }
    }
  }

  for (const id of rootIds) {
    walk(id, 0);
  }

  return result;
}

export function getSubtree(
  nodes: Record<string, LifeNode>,
  id: string
): string[] {
  const result: string[] = [id];
  const node = nodes[id];
  if (!node) return result;
  for (const childId of node.childIds) {
    result.push(...getSubtree(nodes, childId));
  }
  return result;
}

export function getCompletionRatio(nodes: Record<string, LifeNode>): number {
  const allNodes = Object.values(nodes).filter((n) => !n.archived);
  const leaves = allNodes.filter((n) => n.childIds.length === 0);
  if (leaves.length === 0) return 0;
  const completed = leaves.filter((n) => n.completed).length;
  return completed / leaves.length;
}

export function getSubtreeCompletionRatio(
  nodes: Record<string, LifeNode>,
  id: string
): number {
  const subtreeIds = getSubtree(nodes, id);
  const leaves = subtreeIds.filter((sid) => {
    const n = nodes[sid];
    return n && n.childIds.length === 0 && !n.archived;
  });
  if (leaves.length === 0) return 0;
  const completed = leaves.filter((sid) => nodes[sid]?.completed).length;
  return completed / leaves.length;
}

export function isDescendant(
  nodes: Record<string, LifeNode>,
  ancestorId: string,
  nodeId: string
): boolean {
  let current = nodes[nodeId];
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = nodes[current.parentId];
  }
  return false;
}

export function reorderChildren(
  childIds: string[],
  fromIndex: number,
  toIndex: number
): string[] {
  const next = [...childIds];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function getPreviousVisibleId(
  visibleNodes: VisibleNode[],
  id: string
): string | null {
  const idx = visibleNodes.findIndex((n) => n.id === id);
  if (idx <= 0) return null;
  return visibleNodes[idx - 1].id;
}

export function getNextVisibleId(
  visibleNodes: VisibleNode[],
  id: string
): string | null {
  const idx = visibleNodes.findIndex((n) => n.id === id);
  if (idx === -1 || idx >= visibleNodes.length - 1) return null;
  return visibleNodes[idx + 1].id;
}

export function getNodeDepth(
  nodes: Record<string, LifeNode>,
  id: string
): number {
  let depth = 0;
  let current = nodes[id];
  while (current?.parentId) {
    depth++;
    current = nodes[current.parentId];
  }
  return depth;
}
