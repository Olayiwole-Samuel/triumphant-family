/**
 * Event date/time rules — pure functions (no Next.js, no network) so they can
 * be unit-tested. Relative imports only.
 *
 * Editors enter WALL-CLOCK times in the event's time zone (default
 * Africa/Lagos). Calendar dates ("2026-10-12") are treated as plain dates —
 * never converted through UTC — so there are no off-by-one-day errors.
 *
 * Explicit rules:
 * - No date               → "date to be announced" (never a confirmed upcoming event).
 * - No start time / All day → an all-day event (spanning every day to the end date).
 * - Start time, no end time → shown as starting then; it counts as finished at the
 *                           end of its last day; NO calendar export (duration unknown).
 * - End date (multi-day)   → the event runs from the start date to the end date.
 */

export const DEFAULT_TIMEZONE = "Africa/Lagos";

/** Time zones offered in the Studio, with the label shown next to times. */
export const EVENT_TIMEZONES: { value: string; label: string; short: string }[] = [
  { value: "Africa/Lagos", label: "Lagos (WAT)", short: "WAT" },
  { value: "Africa/Accra", label: "Accra (GMT)", short: "Accra time" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)", short: "SAST" },
  { value: "Europe/London", label: "London (UK time)", short: "UK time" },
  { value: "America/New_York", label: "New York (Eastern)", short: "Eastern time" },
  { value: "America/Chicago", label: "Houston / Chicago (Central)", short: "Central time" },
  { value: "America/Toronto", label: "Toronto (Eastern)", short: "Toronto time" },
  { value: "Asia/Dubai", label: "Dubai (GST)", short: "Dubai time" },
];

export type EventTimeInput = {
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  timezone?: string;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validTimezone(tz?: string): string {
  if (!tz) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function timezoneLabel(tz?: string): string {
  const zone = validTimezone(tz);
  return EVENT_TIMEZONES.find((z) => z.value === zone)?.short ?? zone.split("/").pop()!.replace(/_/g, " ") + " time";
}

/** Offset (ms) of `tz` from UTC at the given instant. */
function offsetMs(utcMs: number, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - utcMs;
}

/** Wall-clock date + time in `tz` → UTC milliseconds (DST-safe for real zones). */
export function zonedToUtc(date: string, time: string, tz: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, h, min);
  let utc = naive - offsetMs(naive, tz);
  utc = naive - offsetMs(utc, tz);
  return utc;
}

/** "2026-10-12" + n days → "2026-10-13" (pure calendar arithmetic). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export type EventInstants = {
  /** UTC ms of the start (midnight for all-day). */
  start: number;
  /** UTC ms of the end, when known (exclusive midnight for all-day). */
  end?: number;
  allDay: boolean;
  /** Last calendar day of the event (YYYY-MM-DD). */
  lastDay: string;
  multiDay: boolean;
  timezone: string;
};

/** Start/end instants for an event, or undefined when it has no valid date. */
export function eventInstants(event: EventTimeInput): EventInstants | undefined {
  if (!event.date || !DATE.test(event.date)) return undefined;
  const tz = validTimezone(event.timezone);
  const lastDay = event.endDate && DATE.test(event.endDate) && event.endDate >= event.date ? event.endDate : event.date;
  const allDay = Boolean(event.allDay) || !event.startTime || !TIME.test(event.startTime);
  const multiDay = lastDay !== event.date;

  if (allDay) {
    return {
      start: zonedToUtc(event.date, "00:00", tz),
      end: zonedToUtc(addDays(lastDay, 1), "00:00", tz),
      allDay,
      lastDay,
      multiDay,
      timezone: tz,
    };
  }

  const start = zonedToUtc(event.date, event.startTime!, tz);
  const endCandidate = event.endTime && TIME.test(event.endTime) ? zonedToUtc(lastDay, event.endTime, tz) : undefined;
  return {
    start,
    end: endCandidate && endCandidate > start ? endCandidate : undefined,
    allDay,
    lastDay,
    multiDay,
    timezone: tz,
  };
}

export type EventStatus = "upcoming" | "past" | "tba";

/**
 * upcoming: hasn't finished yet (includes events happening right now).
 * past: finished. Without an end time, an event finishes at the end of its last day.
 * tba: no valid date — shown separately, never as a confirmed upcoming event.
 */
export function eventStatus(event: EventTimeInput, now: number): EventStatus {
  const instants = eventInstants(event);
  if (!instants) return "tba";
  const finish = instants.end ?? zonedToUtc(addDays(instants.lastDay, 1), "00:00", instants.timezone);
  return finish <= now ? "past" : "upcoming";
}

/* -------------------------------------------------------------- Formatting */

const formatPlainDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

/** "Sunday 12 October 2026" · "12–14 October 2026" · "30 October – 2 November 2026" */
export function formatEventDates(event: EventTimeInput): string | undefined {
  const instants = eventInstants(event);
  if (!instants || !event.date) return undefined;
  if (!instants.multiDay) return formatPlainDate(event.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const [sy, sm] = event.date.split("-");
  const [ey, em] = instants.lastDay.split("-");
  const endText = formatPlainDate(instants.lastDay, { day: "numeric", month: "long", year: "numeric" });
  if (sy === ey && sm === em) return `${Number(event.date.slice(8))}–${endText}`;
  if (sy === ey) return `${formatPlainDate(event.date, { day: "numeric", month: "long" })} – ${endText}`;
  return `${formatPlainDate(event.date, { day: "numeric", month: "long", year: "numeric" })} – ${endText}`;
}

const clock = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
};

/** "9:00 am – 11:30 am WAT" · "From 6:00 pm WAT" · "All day" */
export function formatEventTimes(event: EventTimeInput): string | undefined {
  const instants = eventInstants(event);
  if (!instants) return undefined;
  if (instants.allDay) return instants.multiDay ? "All day, each day" : "All day";
  const zone = timezoneLabel(instants.timezone);
  if (event.endTime && TIME.test(event.endTime) && instants.end) {
    return `${clock(event.startTime!)} – ${clock(event.endTime)} ${zone}${instants.multiDay ? " (start to finish)" : ""}`;
  }
  return `From ${clock(event.startTime!)} ${zone}`;
}

export type DateTileParts = {
  month: string;
  day: string;
  weekday: string;
  /** Present for multi-day events. */
  end?: { month: string; day: string };
};

export function dateTileParts(event: EventTimeInput): DateTileParts | undefined {
  const instants = eventInstants(event);
  if (!instants || !event.date) return undefined;
  const parts = (date: string) => ({
    month: formatPlainDate(date, { month: "short" }),
    day: formatPlainDate(date, { day: "numeric" }),
  });
  return {
    ...parts(event.date),
    weekday: formatPlainDate(event.date, { weekday: "short" }),
    end: instants.multiDay ? parts(instants.lastDay) : undefined,
  };
}

/** ISO 8601 with the event's UTC offset, e.g. 2026-10-12T09:00:00+01:00 (for structured data). */
export function isoWithOffset(utcMs: number, tz: string): string {
  const off = offsetMs(utcMs, tz);
  const local = new Date(utcMs + off).toISOString().slice(0, 19);
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off) / 60000;
  return `${local}${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}
