import { describe, it, expect } from "vitest";
import {
  getNode,
  getChildren,
  getParentChain,
  getVisibleNodes,
  getSubtree,
  getCompletionRatio,
  isDescendant,
  reorderChildren,
  getPreviousVisibleId,
  getNextVisibleId,
  getNodeDepth,
} from "./tree";
import type { LifeNode } from "@/types";

function makeNode(partial: Partial<LifeNode> & { id: string }): LifeNode {
  return {
    title: "Node",
    type: "task",
    parentId: null,
    childIds: [],
    completed: false,
    collapsed: false,
    archived: false,
    reminder: "none",
    dueDate: null,
    notes: "",
    icon: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...partial,
  };
}

const nodes: Record<string, LifeNode> = {
  root1: makeNode({ id: "root1", title: "Career", childIds: ["child1", "child2"] }),
  child1: makeNode({ id: "child1", title: "Job Search", parentId: "root1", childIds: ["grandchild1"] }),
  child2: makeNode({ id: "child2", title: "Portfolio", parentId: "root1" }),
  grandchild1: makeNode({ id: "grandchild1", title: "Apply OpenAI", parentId: "child1" }),
  root2: makeNode({ id: "root2", title: "Health", childIds: ["child3"] }),
  child3: makeNode({ id: "child3", title: "Gym", parentId: "root2", completed: true }),
};

describe("getNode", () => {
  it("returns node by id", () => {
    expect(getNode(nodes, "root1")?.title).toBe("Career");
  });

  it("returns undefined for unknown id", () => {
    expect(getNode(nodes, "unknown")).toBeUndefined();
  });
});

describe("getChildren", () => {
  it("returns ordered children", () => {
    const children = getChildren(nodes, "root1");
    expect(children.map((n) => n.id)).toEqual(["child1", "child2"]);
  });

  it("returns empty for leaf node", () => {
    expect(getChildren(nodes, "grandchild1")).toEqual([]);
  });

  it("returns empty for unknown node", () => {
    expect(getChildren(nodes, "unknown")).toEqual([]);
  });
});

describe("getParentChain", () => {
  it("returns full chain from root to direct parent", () => {
    const chain = getParentChain(nodes, "grandchild1");
    expect(chain.map((n) => n.id)).toEqual(["root1", "child1"]);
  });

  it("returns empty for root node", () => {
    expect(getParentChain(nodes, "root1")).toEqual([]);
  });

  it("returns single parent for direct child", () => {
    const chain = getParentChain(nodes, "child1");
    expect(chain.map((n) => n.id)).toEqual(["root1"]);
  });
});

describe("getVisibleNodes", () => {
  it("returns all nodes when nothing is collapsed", () => {
    const visible = getVisibleNodes(nodes, ["root1", "root2"], new Set());
    expect(visible.map((n) => n.id)).toEqual([
      "root1", "child1", "grandchild1", "child2", "root2", "child3",
    ]);
  });

  it("hides children of collapsed node", () => {
    const visible = getVisibleNodes(nodes, ["root1", "root2"], new Set(["child1"]));
    expect(visible.map((n) => n.id)).not.toContain("grandchild1");
    expect(visible.map((n) => n.id)).toContain("child1");
  });

  it("hides entire subtree when parent is collapsed", () => {
    const visible = getVisibleNodes(nodes, ["root1", "root2"], new Set(["root1"]));
    expect(visible.map((n) => n.id)).toEqual(["root1", "root2", "child3"]);
  });

  it("assigns correct depths", () => {
    const visible = getVisibleNodes(nodes, ["root1"], new Set());
    const depths = Object.fromEntries(visible.map((n) => [n.id, n.depth]));
    expect(depths["root1"]).toBe(0);
    expect(depths["child1"]).toBe(1);
    expect(depths["grandchild1"]).toBe(2);
    expect(depths["child2"]).toBe(1);
  });
});

describe("getSubtree", () => {
  it("returns node and all descendants", () => {
    const subtree = getSubtree(nodes, "root1");
    expect(subtree.sort()).toEqual(["root1", "child1", "child2", "grandchild1"].sort());
  });

  it("returns just the id for leaf node", () => {
    expect(getSubtree(nodes, "grandchild1")).toEqual(["grandchild1"]);
  });
});

describe("getCompletionRatio", () => {
  it("counts completed leaf nodes", () => {
    const ratio = getCompletionRatio(nodes);
    // Leaf nodes: grandchild1(incomplete), child2(incomplete), child3(complete)
    expect(ratio).toBeCloseTo(1 / 3);
  });

  it("returns 0 when no nodes", () => {
    expect(getCompletionRatio({})).toBe(0);
  });

  it("returns 1 when all leaves complete", () => {
    const allDone: Record<string, LifeNode> = {
      a: makeNode({ id: "a", childIds: ["b"] }),
      b: makeNode({ id: "b", parentId: "a", completed: true }),
    };
    expect(getCompletionRatio(allDone)).toBe(1);
  });
});

describe("isDescendant", () => {
  it("returns true for direct child", () => {
    expect(isDescendant(nodes, "root1", "child1")).toBe(true);
  });

  it("returns true for grandchild", () => {
    expect(isDescendant(nodes, "root1", "grandchild1")).toBe(true);
  });

  it("returns false for unrelated node", () => {
    expect(isDescendant(nodes, "root1", "root2")).toBe(false);
  });

  it("returns false for the ancestor itself", () => {
    expect(isDescendant(nodes, "root1", "root1")).toBe(false);
  });
});

describe("reorderChildren", () => {
  it("moves item forward", () => {
    expect(reorderChildren(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moves item backward", () => {
    expect(reorderChildren(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("no-op when same index", () => {
    expect(reorderChildren(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });
});

describe("getPreviousVisibleId / getNextVisibleId", () => {
  const visible = [
    { id: "a", depth: 0 },
    { id: "b", depth: 1 },
    { id: "c", depth: 0 },
  ];

  it("returns previous id", () => {
    expect(getPreviousVisibleId(visible, "b")).toBe("a");
  });

  it("returns null for first item", () => {
    expect(getPreviousVisibleId(visible, "a")).toBeNull();
  });

  it("returns next id", () => {
    expect(getNextVisibleId(visible, "b")).toBe("c");
  });

  it("returns null for last item", () => {
    expect(getNextVisibleId(visible, "c")).toBeNull();
  });
});

describe("getNodeDepth", () => {
  it("returns 0 for root", () => {
    expect(getNodeDepth(nodes, "root1")).toBe(0);
  });

  it("returns 1 for direct child", () => {
    expect(getNodeDepth(nodes, "child1")).toBe(1);
  });

  it("returns 2 for grandchild", () => {
    expect(getNodeDepth(nodes, "grandchild1")).toBe(2);
  });
});
