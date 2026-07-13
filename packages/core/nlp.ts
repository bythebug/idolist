import * as chrono from "chrono-node";
import { format, isToday, isTomorrow } from "date-fns";

export interface ParsedTask {
  title: string;
  dueDate: string | null;       // "YYYY-MM-DD"
  dueTime: string | null;       // "HH:mm" 24-hour, only when explicitly mentioned
  isToday: boolean;
  reminder: "today" | "tomorrow" | "none";
  dateLabel: string | null;     // human-readable label for the preview chip
  areaHint: string | null;      // raw area name extracted from "in [Area]" pattern
}

// Common English words that follow "in" but are NOT area references
const AREA_SKIP =
  /^(the|a|an|time|order|progress|addition|general|detail|summary|fact|case|place|short|brief|total|advance|conclusion|contrast|touch|mind|writing|charge|turn|person|practice|theory|use|sight|hand|between|this|that|these|those|my|your|our|their|all|any|every|no|some)$/i;

export function parseTask(input: string): ParsedTask {
  const trimmed = input.trim();
  const empty: ParsedTask = {
    title: trimmed,
    dueDate: null,
    dueTime: null,
    isToday: false,
    reminder: "none",
    dateLabel: null,
    areaHint: null,
  };
  if (!trimmed) return empty;

  // ── Step 1: extract date/time via chrono ──────────────────────
  const results = chrono.parse(trimmed, new Date(), { forwardDate: true });

  let title = trimmed;
  let dueDate: string | null = null;
  let dueTime: string | null = null;
  let dateLabel: string | null = null;
  let todayFlag = false;
  let tomorrowFlag = false;

  if (results.length > 0) {
    const result = results[0];
    const date = result.date();

    // Strip the matched date phrase from the title
    title =
      trimmed.slice(0, result.index) +
      trimmed.slice(result.index + result.text.length);
    title = title.replace(/\s+(by|on|at|for|due)\s*$/i, "").replace(/\s{2,}/g, " ").trim();
    if (!title) title = trimmed;

    dueDate = format(date, "yyyy-MM-dd");
    todayFlag = isToday(date);
    tomorrowFlag = isTomorrow(date);

    const hasExplicitTime = result.start.isCertain("hour");
    dueTime = hasExplicitTime ? format(date, "HH:mm") : null;

    if (todayFlag) {
      dateLabel = dueTime ? `Today at ${format(date, "h:mm a")}` : "Today";
    } else if (tomorrowFlag) {
      dateLabel = dueTime ? `Tomorrow at ${format(date, "h:mm a")}` : "Tomorrow";
    } else {
      dateLabel = dueTime
        ? `${format(date, "EEE, MMM d")} at ${format(date, "h:mm a")}`
        : format(date, "EEE, MMM d");
    }
  }

  // ── Step 2: extract "in [Area]" from the remaining title ──────
  // Match "in X" at the END (after date stripping, so date-related "in" is already gone)
  // Multi-word areas supported: "in Career Development", "in Side Projects"
  let areaHint: string | null = null;
  const areaMatch = title.match(/(?:^|\s)in\s+([A-Za-z][A-Za-z\s]{0,40}?)(?:\s*$)/i);
  if (areaMatch) {
    const candidate = areaMatch[1].trim();
    // Skip if it looks like a common English phrase rather than a proper area name
    const firstWord = candidate.split(/\s+/)[0];
    if (!AREA_SKIP.test(firstWord)) {
      areaHint = candidate;
      // Strip "in [area]" from title
      title = title.replace(areaMatch[0], " ").replace(/\s{2,}/g, " ").trim();
    }
  }

  if (!title) title = trimmed;

  return {
    title,
    dueDate,
    dueTime,
    isToday: todayFlag,
    reminder: todayFlag ? "today" : tomorrowFlag ? "tomorrow" : "none",
    dateLabel,
    areaHint,
  };
}
