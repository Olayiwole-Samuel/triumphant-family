import { addDays, eventInstants, type EventTimeInput } from "./time";

/**
 * Add-to-calendar helpers — pure functions (no dependencies).
 *
 * Both Google Calendar and .ics use UTC instants for timed events (so every
 * calendar app converts to the visitor's own zone correctly) and plain
 * dates for all-day events. When an event has a start time but no end time,
 * no calendar data is produced — we never invent a duration.
 */

export type CalendarEvent = EventTimeInput & {
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  location?: string;
  address?: string;
  onlineUrl?: string;
};

/** Absolute URL of the event page (uses the configured site URL). */
export const eventPageUrl = (siteUrl: string, slug: string) => `${siteUrl.replace(/\/$/, "")}/events/${slug}`;

const utcStamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const plainDate = (date: string) => date.replace(/-/g, "");

/** Start/end values, or undefined when the event can't be exported honestly. */
function range(event: CalendarEvent) {
  const instants = eventInstants(event);
  if (!instants) return undefined;
  if (instants.allDay) {
    return { allDay: true as const, start: plainDate(event.date!), end: plainDate(addDays(instants.lastDay, 1)) };
  }
  if (!instants.end) return undefined;
  return { allDay: false as const, start: utcStamp(instants.start), end: utcStamp(instants.end) };
}

export const canAddToCalendar = (event: CalendarEvent) => Boolean(range(event));

/** Venue + address on one line ("Main Auditorium, 1 Church Road, Lagos"). */
export function placeLine(event: Pick<CalendarEvent, "location" | "address">): string {
  return [event.location, event.address?.trim().replace(/\s*\n\s*/g, ", ")].filter(Boolean).join(", ");
}

/** The editor's map link, or a Google Maps search for the venue + address. Needs an address or map link. */
export function directionsUrl(event: Pick<CalendarEvent, "location" | "address"> & { mapUrl?: string }): string | undefined {
  if (event.mapUrl) return event.mapUrl;
  if (!event.address) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeLine(event))}`;
}

function where(event: CalendarEvent) {
  return placeLine(event) || event.onlineUrl || "";
}

function details(event: CalendarEvent, url: string) {
  return [event.summary || event.description?.slice(0, 600), event.onlineUrl ? `Join online: ${event.onlineUrl}` : "", `Event details: ${url}`]
    .filter(Boolean)
    .join("\n\n");
}

export function googleCalendarUrl(event: CalendarEvent, siteUrl: string): string | undefined {
  const r = range(event);
  if (!r) return undefined;
  const url = eventPageUrl(siteUrl, event.slug);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${r.start}/${r.end}`,
    details: details(event, url),
  });
  const location = where(event);
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** RFC 5545 text escaping: backslash, semicolon, comma, newline. */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\r\n|\r/g, "\n")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Folds a content line at 75 octets (UTF-8 safe), continuation lines start with a space. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines carry a leading space
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** A complete .ics file (CRLF line endings), or undefined when not exportable. */
export function buildIcs(event: CalendarEvent, siteUrl: string, now: number = Date.now()): string | undefined {
  const r = range(event);
  if (!r) return undefined;
  const url = eventPageUrl(siteUrl, event.slug);
  const host = (() => {
    try {
      return new URL(siteUrl).host;
    } catch {
      return "triumphantfamily.local";
    }
  })();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Triumphant Family//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.slug}@${host}`,
    `DTSTAMP:${utcStamp(now)}`,
    r.allDay ? `DTSTART;VALUE=DATE:${r.start}` : `DTSTART:${r.start}`,
    r.allDay ? `DTEND;VALUE=DATE:${r.end}` : `DTEND:${r.end}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(details(event, url))}`,
    ...(where(event) ? [`LOCATION:${escapeIcsText(where(event))}`] : []),
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}
