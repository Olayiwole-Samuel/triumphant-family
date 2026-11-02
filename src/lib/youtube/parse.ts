/**
 * Pure YouTube parsing, validation and live-status rules.
 *
 * No network, no Next.js imports — so it can be unit-tested with fixtures and
 * shared by the RSS reader (feed.ts) and the Data API client (api.ts).
 * External responses are treated as untrusted: every field is checked before
 * it is used, and anything malformed is dropped rather than guessed.
 */

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function isValidVideoId(value: unknown): value is string {
  return typeof value === "string" && VIDEO_ID.test(value);
}

/** A video as the website uses it, from either the Data API or the RSS feed. */
export type YouTubeVideo = {
  videoId: string;
  title: string;
  description: string;
  /** ISO timestamp */
  publishedAt: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  /** Only known via the Data API. */
  liveBroadcastContent?: "live" | "upcoming" | "none";
  scheduledStartTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  /** false when the owner has disabled embedding (Data API only). */
  embeddable?: boolean;
  source: "api" | "rss";
};

export type YouTubeErrorKind = "quota" | "key" | "not_found" | "network" | "invalid_response" | "unknown";

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown) => (typeof value === "string" ? value : undefined);
const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

/** "PT1H2M3S" → 3723. Returns undefined for anything unparseable (incl. "P0D" for live). */
export function parseIsoDuration(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return undefined;
  const [, d, h, m, s] = match.map((part) => (part ? Number(part) : 0));
  const total = d * 86400 + h * 3600 + m * 60 + s;
  return total > 0 ? total : undefined;
}

/** 3723 → "1:02:03", 185 → "3:05" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Best thumbnail from a Data API `snippet.thumbnails` object (https only). */
function pickThumbnail(thumbnails: unknown, videoId: string): string {
  if (isObject(thumbnails)) {
    for (const size of ["maxres", "standard", "high", "medium", "default"]) {
      const entry = thumbnails[size];
      const url = isObject(entry) ? str(entry.url) : undefined;
      if (url?.startsWith("https://")) return url;
    }
  }
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** channels.list → the channel's "uploads" playlist ID. */
export function parseUploadsPlaylistId(json: unknown): string | undefined {
  if (!isObject(json) || !Array.isArray(json.items) || !isObject(json.items[0])) return undefined;
  const details = json.items[0].contentDetails;
  if (!isObject(details) || !isObject(details.relatedPlaylists)) return undefined;
  const uploads = str(details.relatedPlaylists.uploads);
  return uploads && /^[A-Za-z0-9_-]{10,64}$/.test(uploads) ? uploads : undefined;
}

/** playlistItems.list → video IDs, in playlist order (newest first). */
export function parsePlaylistVideoIds(json: unknown): string[] {
  if (!isObject(json) || !Array.isArray(json.items)) return [];
  return json.items.flatMap((item) => {
    if (!isObject(item) || !isObject(item.contentDetails)) return [];
    const id = item.contentDetails.videoId;
    return isValidVideoId(id) ? [id] : [];
  });
}

/** videos.list (part=snippet,contentDetails,liveStreamingDetails,status) → videos. */
export function parseVideos(json: unknown): YouTubeVideo[] {
  if (!isObject(json) || !Array.isArray(json.items)) return [];
  return json.items.flatMap((item): YouTubeVideo[] => {
    if (!isObject(item) || !isValidVideoId(item.id) || !isObject(item.snippet)) return [];
    const snippet = item.snippet;
    const title = str(snippet.title);
    const publishedAt = snippet.publishedAt;
    if (!title || !isIsoDate(publishedAt)) return [];

    const live = isObject(item.liveStreamingDetails) ? item.liveStreamingDetails : {};
    const content = str(snippet.liveBroadcastContent);
    const status = isObject(item.status) ? item.status : {};
    // Private/deleted videos can't be watched by visitors — skip them.
    if (status.privacyStatus && status.privacyStatus !== "public") return [];

    return [
      {
        videoId: item.id,
        title,
        description: str(snippet.description) ?? "",
        publishedAt,
        thumbnailUrl: pickThumbnail(snippet.thumbnails, item.id),
        durationSeconds: isObject(item.contentDetails)
          ? parseIsoDuration(item.contentDetails.duration)
          : undefined,
        liveBroadcastContent:
          content === "live" || content === "upcoming" || content === "none" ? content : undefined,
        scheduledStartTime: isIsoDate(live.scheduledStartTime) ? live.scheduledStartTime : undefined,
        actualStartTime: isIsoDate(live.actualStartTime) ? live.actualStartTime : undefined,
        actualEndTime: isIsoDate(live.actualEndTime) ? live.actualEndTime : undefined,
        embeddable: typeof status.embeddable === "boolean" ? status.embeddable : undefined,
        source: "api",
      },
    ];
  });
}

/** Maps a Data API error body to a kind we can act on (quota → back off). */
export function parseApiError(status: number, json: unknown): YouTubeErrorKind {
  const message = isObject(json) && isObject(json.error) ? str(json.error.message) ?? "" : "";
  if (/api key/i.test(message)) return "key";
  const reason =
    isObject(json) && isObject(json.error) && Array.isArray(json.error.errors) && isObject(json.error.errors[0])
      ? str(json.error.errors[0].reason)
      : undefined;
  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded" || reason === "rateLimitExceeded") return "quota";
  if (reason === "keyInvalid" || reason === "forbidden" || reason === "accessNotConfigured") return "key";
  if (status === 400 && reason?.toLowerCase().includes("key")) return "key";
  if (status === 404) return "not_found";
  if (status === 403) return "key";
  return "unknown";
}

/* ---------------------------------------------------------------- RSS feed */

const ENTRY = /<entry>([\s\S]*?)<\/entry>/g;

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function pick(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXml(match[1].trim()) : "";
}

/** The public channel RSS feed (15 newest uploads; no live/duration data). */
export function parseRssFeed(xml: string): YouTubeVideo[] {
  return Array.from(xml.matchAll(ENTRY)).flatMap(([, entry]): YouTubeVideo[] => {
    const videoId = pick(entry, "yt:videoId");
    const title = pick(entry, "title");
    const publishedAt = pick(entry, "published");
    if (!isValidVideoId(videoId) || !title || !isIsoDate(publishedAt)) return [];
    return [
      {
        videoId,
        title,
        description: pick(entry, "media:description"),
        publishedAt,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        source: "rss",
      },
    ];
  });
}

/* ------------------------------------------------------------- Live status */

export type LiveVideoSummary = Pick<YouTubeVideo, "videoId" | "title" | "thumbnailUrl" | "embeddable">;

/**
 * - live: YouTube reports the broadcast is live (started, not ended).
 * - upcoming: YouTube reports a scheduled broadcast with a start time.
 * - ended: a broadcast that finished in the last 12 hours.
 * - none: verified — nothing live or scheduled.
 * - unavailable: YouTube could not be checked (network, quota, key).
 * - not_configured: no API key, so live status is not checked at all.
 */
export type LiveStatus =
  | { state: "live"; video: LiveVideoSummary; startedAt?: string; checkedAt: string }
  | { state: "upcoming"; video: LiveVideoSummary; startsAt: string; checkedAt: string }
  | { state: "ended"; video: LiveVideoSummary; endedAt: string; checkedAt: string }
  | { state: "none"; checkedAt: string }
  | { state: "unavailable"; reason: "quota" | "error"; checkedAt: string }
  | { state: "not_configured" };

const summary = (video: YouTubeVideo): LiveVideoSummary => ({
  videoId: video.videoId,
  title: video.title,
  thumbnailUrl: video.thumbnailUrl,
  embeddable: video.embeddable,
});

const HOUR = 3_600_000;

/**
 * Decides the channel's live status from VERIFIED Data API metadata only.
 * A title containing "live", or a video simply existing, never counts.
 * RSS videos (no broadcast metadata) are ignored here by design.
 */
export function classifyLiveStatus(videos: YouTubeVideo[], now: Date): LiveStatus {
  const checkedAt = now.toISOString();
  const verified = videos.filter((video) => video.source === "api");

  const live = verified.find(
    (video) => video.liveBroadcastContent === "live" && video.actualStartTime && !video.actualEndTime,
  );
  if (live) return { state: "live", video: summary(live), startedAt: live.actualStartTime, checkedAt };

  // YouTube can leave a missed schedule as "upcoming" indefinitely; ignore
  // anything whose start time passed more than 2 hours ago.
  const upcoming = verified
    .filter(
      (video) =>
        video.liveBroadcastContent === "upcoming" &&
        video.scheduledStartTime &&
        Date.parse(video.scheduledStartTime) > now.getTime() - 2 * HOUR,
    )
    .sort((a, b) => Date.parse(a.scheduledStartTime!) - Date.parse(b.scheduledStartTime!))[0];
  if (upcoming) {
    return { state: "upcoming", video: summary(upcoming), startsAt: upcoming.scheduledStartTime!, checkedAt };
  }

  const ended = verified
    .filter(
      (video) =>
        video.actualEndTime &&
        Date.parse(video.actualEndTime) <= now.getTime() &&
        Date.parse(video.actualEndTime) > now.getTime() - 12 * HOUR,
    )
    .sort((a, b) => Date.parse(b.actualEndTime!) - Date.parse(a.actualEndTime!))[0];
  if (ended) return { state: "ended", video: summary(ended), endedAt: ended.actualEndTime!, checkedAt };

  return { state: "none", checkedAt };
}
