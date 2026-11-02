import type { Sermon } from "../../types/content";

/**
 * Sermon archive logic — pure functions (no Next.js, no network) so they can
 * be unit-tested with fixtures. Relative imports keep it runnable in Node.
 *
 * SOURCE PRIORITY
 * 1. Sanity sermons are the editorial source of truth.
 * 2. YouTube uploads fill in recent messages not yet curated in Sanity.
 * 3. They are matched by YouTube video ID; when both exist, the Sanity
 *    sermon wins and the YouTube copy is dropped (never shown twice, never
 *    overwriting the editor's title, speaker or summary).
 */
export function mergeSermonSources(cms: Sermon[], youtube: Sermon[]): Sermon[] {
  const linked = new Set(cms.map((sermon) => sermon.youtubeVideoId).filter(Boolean));
  const extra = youtube.filter((video) => video.youtubeVideoId && !linked.has(video.youtubeVideoId));
  return [...cms, ...extra].sort(byNewest);
}

function byNewest(a: Sermon, b: Sermon) {
  return (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0);
}

export type MediaFilter = "video" | "audio" | "both";
export type SortOrder = "newest" | "oldest";

export type ArchiveQuery = {
  q: string;
  speaker?: string;
  topic?: string;
  year?: string;
  media?: MediaFilter;
  sort: SortOrder;
  page: number;
};

export const PAGE_SIZE = 12;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads (and sanitises) the archive state from URL search params. */
export function parseArchiveQuery(params: Record<string, string | string[] | undefined>): ArchiveQuery {
  const text = (value: string | undefined, max = 80) =>
    value ? value.replace(/\s+/g, " ").trim().slice(0, max) || undefined : undefined;
  const media = first(params.media);
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  const year = first(params.year);
  return {
    q: text(first(params.q), 100) ?? "",
    speaker: text(first(params.speaker)),
    topic: text(first(params.topic)),
    year: year && /^\d{4}$/.test(year) ? year : undefined,
    media: media === "video" || media === "audio" || media === "both" ? media : undefined,
    sort: first(params.sort) === "oldest" ? "oldest" : "newest",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
  };
}

/** Builds a URL for the archive with the given state (omitting defaults). */
export function archiveHref(query: ArchiveQuery, overrides: Partial<ArchiveQuery> = {}): string {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.speaker) params.set("speaker", next.speaker);
  if (next.topic) params.set("topic", next.topic);
  if (next.year) params.set("year", next.year);
  if (next.media) params.set("media", next.media);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const search = params.toString();
  return search ? `/sermons?${search}` : "/sermons";
}

export function isFiltered(query: ArchiveQuery) {
  return Boolean(query.q || query.speaker || query.topic || query.year || query.media);
}

/** Lower-case, accent-insensitive (so “Ọlá” matches “ola”), single-spaced. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const hasVideo = (sermon: Sermon) => Boolean(sermon.youtubeVideoId);
const hasAudio = (sermon: Sermon) => Boolean(sermon.audioUrl);
export const sermonYear = (sermon: Sermon) => (sermon.date ? sermon.date.slice(0, 4) : undefined);

/** Every word of the search must appear in the title, speaker, series, topics or scriptures. */
function matchesSearch(sermon: Sermon, q: string) {
  const words = normalize(q).split(" ").filter(Boolean);
  if (!words.length) return true;
  const haystack = normalize(
    [sermon.title, sermon.speaker, sermon.series, sermon.scripture, ...sermon.otherScriptures, ...sermon.topics]
      .filter(Boolean)
      .join(" "),
  );
  return words.every((word) => haystack.includes(word));
}

export function filterSermons(sermons: Sermon[], query: ArchiveQuery): Sermon[] {
  const speaker = query.speaker && normalize(query.speaker);
  const topic = query.topic && normalize(query.topic);
  const filtered = sermons.filter((sermon) => {
    if (!matchesSearch(sermon, query.q)) return false;
    if (speaker && normalize(sermon.speaker ?? "") !== speaker) return false;
    if (topic && !sermon.topics.some((t) => normalize(t) === topic)) return false;
    if (query.year && sermonYear(sermon) !== query.year) return false;
    if (query.media === "video" && !hasVideo(sermon)) return false;
    if (query.media === "audio" && !hasAudio(sermon)) return false;
    if (query.media === "both" && !(hasVideo(sermon) && hasAudio(sermon))) return false;
    return true;
  });
  return query.sort === "oldest" ? [...filtered].sort((a, b) => -byNewest(a, b)) : [...filtered].sort(byNewest);
}

export type ArchiveFacets = {
  speakers: string[];
  topics: string[];
  years: string[];
  /** Which media filters make sense (only offered when such sermons exist). */
  media: MediaFilter[];
};

/** Filter options built from the real library — never hardcoded categories. */
export function buildFacets(sermons: Sermon[]): ArchiveFacets {
  const unique = (values: (string | undefined)[]) => {
    const seen = new Map<string, string>();
    for (const value of values) {
      if (value && !seen.has(normalize(value))) seen.set(normalize(value), value.trim());
    }
    return [...seen.values()];
  };
  const media: MediaFilter[] = [];
  if (sermons.some(hasVideo)) media.push("video");
  if (sermons.some(hasAudio)) media.push("audio");
  if (sermons.some((s) => hasVideo(s) && hasAudio(s))) media.push("both");
  return {
    speakers: unique(sermons.map((s) => s.speaker)).sort((a, b) => a.localeCompare(b)),
    topics: unique(sermons.flatMap((s) => s.topics)).sort((a, b) => a.localeCompare(b)),
    years: unique(sermons.map(sermonYear)).sort((a, b) => b.localeCompare(a)),
    media,
  };
}

export type Page<T> = { items: T[]; page: number; pageCount: number; total: number; start: number; end: number };

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const startIndex = (current - 1) * pageSize;
  const slice = items.slice(startIndex, startIndex + pageSize);
  return {
    items: slice,
    page: current,
    pageCount,
    total: items.length,
    start: slice.length ? startIndex + 1 : 0,
    end: startIndex + slice.length,
  };
}

/**
 * Related sermons with a stated reason: shared topics (strongest), same
 * series, then same speaker. Sermons with nothing in common are never
 * returned — an empty list means "nothing genuinely related".
 */
export function relatedSermons(sermon: Sermon, all: Sermon[], limit = 3) {
  const topics = new Set(sermon.topics.map(normalize));
  return all
    .filter((other) => other.id !== sermon.id)
    .map((other) => {
      const shared = other.topics.filter((t) => topics.has(normalize(t)));
      const sameSeries = Boolean(sermon.series && other.series && normalize(sermon.series) === normalize(other.series));
      const sameSpeaker = Boolean(sermon.speaker && other.speaker && normalize(sermon.speaker) === normalize(other.speaker));
      const score = shared.length * 3 + (sameSeries ? 2 : 0) + (sameSpeaker ? 1 : 0);
      const reason = shared.length
        ? `Also about ${shared[0]}`
        : sameSeries
          ? `Same series: ${other.series}`
          : sameSpeaker
            ? `Also by ${other.speaker}`
            : "";
      return { sermon: other, score, reason };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || byNewest(a.sermon, b.sermon))
    .slice(0, limit);
}
