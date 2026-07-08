import * as chrono from "chrono-node";
import { format, isToday, isTomorrow } from "date-fns";

export interface ParsedTask {
  title: string;
  dueDate: string | null;       // "YYYY-MM-DD"
  dueTime: string | null;       // "HH:mm" 24-hour, only when explicitly mentioned
  isToday: boolean;
  reminder: "today" | "tomorrow" | "none";
  dateLabel: string | null;     // human-readable label for the preview chip
}

export function parseTask(input: string): ParsedTask {
  const trimmed = input.trim();
  const empty: ParsedTask = { title: trimmed, dueDate: null, dueTime: null, isToday: false, reminder: "none", dateLabel: null };
  if (!trimmed) return empty;

  const results = chrono.parse(trimmed, new Date(), { forwardDate: true });
  if (results.length === 0) return empty;

  const result = results[0];
  const date = result.date();

  // Strip the matched date/time phrase from the title
  let title = trimmed.slice(0, result.index) + trimmed.slice(result.index + result.text.length);
  title = title.replace(/\s+(by|on|at|for|due)\s*$/i, "").replace(/\s{2,}/g, " ").trim();
  if (!title) title = trimmed;

  const dueDateStr = format(date, "yyyy-MM-dd");
  const todayFlag = isToday(date);
  const tomorrowFlag = isTomorrow(date);

  // Only set dueTime when chrono found an explicit hour (not just a date)
  const hasExplicitTime = result.start.isCertain("hour");
  const dueTime = hasExplicitTime ? format(date, "HH:mm") : null;

  let dateLabel: string;
  if (todayFlag) {
    dateLabel = dueTime ? `Today at ${format(date, "h:mm a")}` : "Today";
  } else if (tomorrowFlag) {
    dateLabel = dueTime ? `Tomorrow at ${format(date, "h:mm a")}` : "Tomorrow";
  } else {
    dateLabel = dueTime ? `${format(date, "EEE, MMM d")} at ${format(date, "h:mm a")}` : format(date, "EEE, MMM d");
  }

  return {
    title,
    dueDate: dueDateStr,
    dueTime,
    isToday: todayFlag,
    reminder: todayFlag ? "today" : tomorrowFlag ? "tomorrow" : "none",
    dateLabel,
  };
}
