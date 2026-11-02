import type { Weekday } from "@/types/content";

/**
 * Formatting helpers. Dates are always formatted in the church's time zone so
 * the server and the browser render identical text (no hydration mismatch).
 */
export const CHURCH_TIME_ZONE = "Africa/Lagos";
const LOCALE = "en-GB";

function toDate(value: string): Date {
  // Date-only values ("2026-10-11") are calendar dates, not instants.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
}

/** "11 October 2026" */
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: CHURCH_TIME_ZONE,
  }).format(toDate(value));
}

/** { day: "11", month: "Oct", weekday: "Sun" } — for date badges. */
export function dateParts(value: string) {
  const date = toDate(value);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: CHURCH_TIME_ZONE }).format(date);
  return {
    day: part({ day: "2-digit" }),
    month: part({ month: "short" }),
    weekday: part({ weekday: "short" }),
  };
}

/** "18:00" → "6:00 pm", "09:30" → "9:30 am" */
export function formatTime(value?: string): string | undefined {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  if (!match) return value;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "pm" : "am";
  return `${hours % 12 || 12}:${match[2]} ${suffix}`;
}

export function formatTimeRange(start?: string, end?: string): string | undefined {
  const from = formatTime(start);
  const to = formatTime(end);
  if (from && to) return `${from} – ${to}`;
  return from;
}

export function weekdayLabel(day: Weekday): string {
  return day[0].toUpperCase() + day.slice(1);
}

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to"]);

/** Converts ALL-CAPS text (common in YouTube titles) to Title Case. */
export function titleCaseIfShouting(text: string): string {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (!letters || letters !== letters.toUpperCase()) return text;

  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) =>
      index > 0 && SMALL_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}
