import { describe, it, expect } from "vitest";
import { getVisibleNodes, getSubtree, isDescendant, getParentChain } from "./tree";
import type { LifeNode } from "@/types";

function makeNode(id: string, parentId: string | null, childIds: string[]): LifeNode {
  return {
    id, title: `Node ${id}`, type: "task", parentId, childIds,
    completed: false, archived: false, collapsed: false,
    reminder: "none", dueDate: null, notes: "", icon: null,
    createdAt: 0, updatedAt: 0,
  };
}

function buildTree() {
  const nodes: Record<string, LifeNode> = {};
  const rootIds: string[] = [];
  for (let r = 0; r < 10; r++) {
    const rootId = `r${r}`;
    const rootChildren: string[] = [];
    for (let c = 0; c < 10; c++) {
      const childId = `r${r}c${c}`;
      const gc: string[] = [];
      for (let g = 0; g < 10; g++) {
        const gcId = `r${r}c${c}g${g}`;
        nodes[gcId] = makeNode(gcId, childId, []);
        gc.push(gcId);
      }
      nodes[childId] = makeNode(childId, rootId, gc);
      rootChildren.push(childId);
    }
    nodes[rootId] = makeNode(rootId, null, rootChildren);
    rootIds.push(rootId);
  }
  return { nodes, rootIds };
}

describe("performance stress tests (1110 nodes)", () => {
  const { nodes, rootIds } = buildTree();

  it("has 1110 nodes", () => {
    expect(Object.keys(nodes).length).toBe(1110);
  });

  it("getVisibleNodes — 1110 visible when all expanded, <50ms for 100 calls", () => {
    const collapsed = new Set<string>();
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) getVisibleNodes(nodes, rootIds, collapsed);
    const elapsed = performance.now() - t0;
    expect(getVisibleNodes(nodes, rootIds, collapsed).length).toBe(1110);
    expect(elapsed).toBeLessThan(50);
  });

  it("getVisibleNodes — half-collapsed, <50ms for 100 calls", () => {
    const collapsed = new Set(rootIds.slice(0, 5));
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) getVisibleNodes(nodes, rootIds, collapsed);
    const elapsed = performance.now() - t0;
    const visible = getVisibleNodes(nodes, rootIds, collapsed);
    expect(visible.length).toBe(5 + 5 * 111); // 5 closed roots + 5 open subtrees
    expect(elapsed).toBeLessThan(50);
  });

  it("isDescendant — correct, <20ms for 1000 calls", () => {
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      isDescendant(nodes, "r0", "r0c5g7");
      isDescendant(nodes, "r0", "r1c5g7");
    }
    const elapsed = performance.now() - t0;
    expect(isDescendant(nodes, "r0", "r0c5g7")).toBe(true);
    expect(isDescendant(nodes, "r0", "r1c5g7")).toBe(false);
    expect(elapsed).toBeLessThan(20);
  });

  it("getSubtree — 111 nodes, <10ms for 100 calls", () => {
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) getSubtree(nodes, "r0");
    const elapsed = performance.now() - t0;
    expect(getSubtree(nodes, "r0").length).toBe(111);
    expect(elapsed).toBeLessThan(10);
  });

  it("getParentChain — returns ancestors only, <5ms for 1000 calls", () => {
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) getParentChain(nodes, "r5c3g7");
    const elapsed = performance.now() - t0;
    expect(getParentChain(nodes, "r5c3g7").map(n => n.id)).toEqual(["r5", "r5c3"]);
    expect(elapsed).toBeLessThan(5);
  });
});
