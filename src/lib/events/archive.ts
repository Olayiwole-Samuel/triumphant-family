import type { ChurchEvent, EventFormat } from "../../types/content";

/**
 * Events archive logic — pure functions so they can be unit-tested.
 * State lives in the URL: /events?when=past&category=Youth&q=retreat&sort=az&page=2
 */

export type EventWhen = "upcoming" | "past";
export type EventSort = "soonest" | "latest" | "az";

export type EventQuery = {
  q: string;
  when: EventWhen;
  category?: string;
  format?: EventFormat;
  sort: EventSort;
  page: number;
};

export const EVENTS_PAGE_SIZE = 12;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const FORMATS: EventFormat[] = ["in-person", "online", "hybrid"];

/** Default sort: soonest first for upcoming, most recent first for past. */
export const defaultSort = (when: EventWhen): EventSort => (when === "past" ? "latest" : "soonest");

export function parseEventQuery(params: Record<string, string | string[] | undefined>): EventQuery {
  const text = (value: string | undefined, max = 80) =>
    value ? value.replace(/\s+/g, " ").trim().slice(0, max) || undefined : undefined;
  const when: EventWhen = first(params.when) === "past" ? "past" : "upcoming";
  const sort = first(params.sort);
  const format = first(params.format) as EventFormat | undefined;
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return {
    q: text(first(params.q), 100) ?? "",
    when,
    category: text(first(params.category)),
    format: format && FORMATS.includes(format) ? format : undefined,
    sort: sort === "soonest" || sort === "latest" || sort === "az" ? sort : defaultSort(when),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 500) : 1,
  };
}

/** Search params for a query (defaults omitted) — used for links and pagination. */
export function eventQueryParams(query: EventQuery, overrides: Partial<EventQuery> = {}): Record<string, string> {
  const next = { ...query, ...overrides };
  const params: Record<string, string> = {};
  if (next.q) params.q = next.q;
  if (next.when !== "upcoming") params.when = next.when;
  if (next.category) params.category = next.category;
  if (next.format) params.format = next.format;
  if (next.sort !== defaultSort(next.when)) params.sort = next.sort;
  if (next.page > 1) params.page = String(next.page);
  return params;
}

export function eventsHref(query: EventQuery, overrides: Partial<EventQuery> = {}): string {
  const search = new URLSearchParams(eventQueryParams(query, overrides)).toString();
  return search ? `/events?${search}` : "/events";
}

export const isEventFiltered = (query: EventQuery) => Boolean(query.q || query.category || query.format);

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function matches(event: ChurchEvent, q: string) {
  const words = normalize(q).split(" ").filter(Boolean);
  if (!words.length) return true;
  const haystack = normalize(
    [event.title, event.summary, event.description, event.location, event.address, event.category, event.series]
      .filter(Boolean)
      .join(" "),
  );
  return words.every((word) => haystack.includes(word));
}

const startOf = (event: ChurchEvent) => (event.startsAt ? Date.parse(event.startsAt) : Number.POSITIVE_INFINITY);

/**
 * Upcoming: dated events by start time, then "date to be announced" events.
 * Past: newest first. Search/category/format apply to both.
 */
export function filterEvents(events: ChurchEvent[], query: EventQuery): ChurchEvent[] {
  const category = query.category && normalize(query.category);
  const pool = events.filter((event) =>
    query.when === "past" ? event.status === "past" : event.status === "upcoming" || event.status === "tba",
  );
  const filtered = pool.filter(
    (event) =>
      matches(event, query.q) &&
      (!category || normalize(event.category ?? "") === category) &&
      (!query.format || event.format === query.format),
  );

  const byTitle = (a: ChurchEvent, b: ChurchEvent) => a.title.localeCompare(b.title);
  if (query.sort === "az") return [...filtered].sort(byTitle);
  if (query.sort === "latest") {
    // TBA (no start) still sorts last — never ahead of dated events.
    const latestKey = (event: ChurchEvent) => (event.startsAt ? -Date.parse(event.startsAt) : Number.POSITIVE_INFINITY);
    return [...filtered].sort((a, b) => latestKey(a) - latestKey(b) || byTitle(a, b));
  }
  // soonest — TBA (no start) naturally sorts last
  return [...filtered].sort((a, b) => startOf(a) - startOf(b) || byTitle(a, b));
}

export type EventFacets = { categories: string[]; formats: EventFormat[] };

/** Only offer filters the real events can satisfy. */
export function buildEventFacets(events: ChurchEvent[]): EventFacets {
  const categories = new Map<string, string>();
  for (const event of events) {
    if (event.category && !categories.has(normalize(event.category))) categories.set(normalize(event.category), event.category.trim());
  }
  const formats = FORMATS.filter((format) => events.some((event) => event.format === format));
  return {
    categories: [...categories.values()].sort((a, b) => a.localeCompare(b)),
    formats: formats.length > 1 ? formats : [],
  };
}

/**
 * Related events: other UPCOMING events in the same category (with a stated
 * reason). If none share a category, returns [] — the page then shows
 * "More upcoming events", honestly labelled, instead of calling them related.
 */
export function relatedEvents(event: ChurchEvent, events: ChurchEvent[], limit = 3) {
  if (!event.category) return [];
  const category = normalize(event.category);
  return events
    .filter((other) => other.id !== event.id && other.status === "upcoming" && normalize(other.category ?? "") === category)
    .sort((a, b) => startOf(a) - startOf(b))
    .slice(0, limit)
    .map((other) => ({ event: other, reason: `Also in ${other.category}` }));
}

export const FORMAT_LABELS: Record<EventFormat, string> = {
  "in-person": "In person",
  online: "Online",
  hybrid: "In person & online",
};
