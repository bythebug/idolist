import * as chrono from "chrono-node";
import { format, isToday, isTomorrow } from "date-fns";

export interface ParsedTask {
  title: string;
  dueDate: string | null;       // ISO date string "YYYY-MM-DD"
  isToday: boolean;
  reminder: "today" | "tomorrow" | "none";
  dateLabel: string | null;     // human-readable label for the preview chip
}

export function parseTask(input: string): ParsedTask {
  const trimmed = input.trim();
  if (!trimmed) {
    return { title: trimmed, dueDate: null, isToday: false, reminder: "none", dateLabel: null };
  }

  const results = chrono.parse(trimmed, new Date(), { forwardDate: true });

  if (results.length === 0) {
    return { title: trimmed, dueDate: null, isToday: false, reminder: "none", dateLabel: null };
  }

  const result = results[0];
  const date = result.date();

  // Remove the matched date text from the title, cleaning up stray prepositions
  let title = trimmed.slice(0, result.index) + trimmed.slice(result.index + result.text.length);
  title = title.replace(/\s+(by|on|at|for|due)\s*$/i, "").replace(/\s{2,}/g, " ").trim();
  if (!title) title = trimmed; // fallback: keep original if title would be empty

  const dueDateStr = format(date, "yyyy-MM-dd");
  const todayFlag = isToday(date);
  const tomorrowFlag = isTomorrow(date);

  let dateLabel: string;
  if (todayFlag) {
    dateLabel = "Today";
  } else if (tomorrowFlag) {
    dateLabel = "Tomorrow";
  } else {
    dateLabel = format(date, "EEE, MMM d");
  }

  return {
    title,
    dueDate: dueDateStr,
    isToday: todayFlag,
    reminder: todayFlag ? "today" : tomorrowFlag ? "tomorrow" : "none",
    dateLabel,
  };
}
