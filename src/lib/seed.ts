import { nanoid } from "nanoid";
import type { LifeNode } from "@/types";

interface SeedResult {
  nodes: Record<string, LifeNode>;
  rootIds: string[];
}

function makeNode(
  id: string,
  title: string,
  parentId: string | null,
  childIds: string[] = [],
  icon: string | null = null
): LifeNode {
  const now = Date.now();
  return {
    id,
    title,
    type: parentId === null ? "area" : childIds.length > 0 ? "project" : "task",
    parentId,
    childIds,
    completed: false,
    collapsed: false,
    archived: false,
    reminder: "none",
    repeat: "none",
    lastCompletedAt: null,
    dueDate: null,
    dueTime: null,
    notes: "",
    icon,
    createdAt: now,
    updatedAt: now,
  };
}

export function createSeedData(): SeedResult {
  const ids = {
    career: nanoid(),
    jobSearch: nanoid(),
    applyOpenAI: nanoid(),
    applyAnthropic: nanoid(),
    updateResume: nanoid(),
    health: nanoid(),
    fitness: nanoid(),
    gym: nanoid(),
    nutrition: nanoid(),
    finance: nanoid(),
    savings: nanoid(),
    invest: nanoid(),
    learning: nanoid(),
    ai: nanoid(),
    readPaper: nanoid(),
    buildProject: nanoid(),
  };

  const nodes: Record<string, LifeNode> = {
    [ids.career]: makeNode(ids.career, "Career", null, [ids.jobSearch], "💼"),
    [ids.jobSearch]: makeNode(ids.jobSearch, "Job Search", ids.career, [
      ids.applyOpenAI,
      ids.applyAnthropic,
      ids.updateResume,
    ]),
    [ids.applyOpenAI]: makeNode(ids.applyOpenAI, "Apply to OpenAI", ids.jobSearch),
    [ids.applyAnthropic]: makeNode(ids.applyAnthropic, "Apply to Anthropic", ids.jobSearch),
    [ids.updateResume]: makeNode(ids.updateResume, "Update resume", ids.jobSearch),

    [ids.health]: makeNode(ids.health, "Health", null, [ids.fitness], "🏃"),
    [ids.fitness]: makeNode(ids.fitness, "Fitness", ids.health, [ids.gym, ids.nutrition]),
    [ids.gym]: makeNode(ids.gym, "Go to the gym 3x/week", ids.fitness),
    [ids.nutrition]: makeNode(ids.nutrition, "Meal prep on Sundays", ids.fitness),

    [ids.finance]: makeNode(ids.finance, "Finance", null, [ids.savings, ids.invest], "💰"),
    [ids.savings]: makeNode(ids.savings, "Build 6-month emergency fund", ids.finance),
    [ids.invest]: makeNode(ids.invest, "Max out Roth IRA", ids.finance),

    [ids.learning]: makeNode(ids.learning, "Learning", null, [ids.ai], "📚"),
    [ids.ai]: makeNode(ids.ai, "AI & ML", ids.learning, [ids.readPaper, ids.buildProject]),
    [ids.readPaper]: makeNode(ids.readPaper, "Read attention paper", ids.ai),
    [ids.buildProject]: makeNode(ids.buildProject, "Build a small transformer", ids.ai),
  };

  return {
    nodes,
    rootIds: [ids.career, ids.health, ids.finance, ids.learning],
  };
}
