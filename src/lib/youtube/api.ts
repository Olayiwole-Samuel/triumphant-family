import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fetchRssVideos } from "./feed";
import {
  classifyLiveStatus,
  parseApiError,
  parsePlaylistVideoIds,
  parseUploadsPlaylistId,
  parseVideos,
  type LiveStatus,
  type YouTubeErrorKind,
  type YouTubeVideo,
} from "./parse";

/**
 * The ONE place the site talks to YouTube.
 *
 * With YOUTUBE_API_KEY (server-only): uploads + verified live-broadcast
 * metadata from the YouTube Data API v3. Each refresh costs ~2 quota units
 * (playlistItems + videos; the uploads playlist ID is cached for a day).
 * Without a key, or if the API fails: the public RSS feed provides recent
 * uploads, and live status is reported as "not_configured" / "unavailable" —
 * never guessed.
 *
 * The result is cached for ~2 minutes (shared by every visitor and by the
 * /api/live-status endpoint), so traffic never multiplies API calls.
 */

export type ChannelMedia = {
  /** Newest first. Bounded (max 25). */
  videos: YouTubeVideo[];
  source: "api" | "rss" | "none";
  liveStatus: LiveStatus;
  apiError?: YouTubeErrorKind;
};

const API_BASE = "https://www.googleapis.com/youtube/v3";
const MAX_VIDEOS = 25;

type ApiResult = { ok: true; json: unknown } | { ok: false; kind: YouTubeErrorKind };

/** GET a Data API endpoint. The key is only ever placed in this server-side request. */
async function apiGet(endpoint: "channels" | "playlistItems" | "videos", params: Record<string, string>): Promise<ApiResult> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { ok: false, kind: "key" };
  const url = new URL(`${API_BASE}/${endpoint}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("key", key);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const json: unknown = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, kind: parseApiError(response.status, json) };
    if (json === null) return { ok: false, kind: "invalid_response" };
    return { ok: true, json };
  } catch {
    return { ok: false, kind: "network" };
  }
}

/**
 * The channel's uploads playlist ID. It never changes, so a success is cached
 * for a day; a failure is cached only briefly. (Cached functions must not
 * throw — an error inside "use cache" would fail the page prerender.)
 */
async function getUploadsPlaylistId(
  channelId: string,
): Promise<{ ok: true; id: string } | { ok: false; kind: YouTubeErrorKind }> {
  "use cache";
  cacheTag("youtube");

  const result = await apiGet("channels", { part: "contentDetails", id: channelId, fields: "items/contentDetails/relatedPlaylists/uploads" });
  const playlistId = result.ok ? parseUploadsPlaylistId(result.json) : undefined;
  if (playlistId) {
    cacheLife("days");
    return { ok: true, id: playlistId };
  }
  cacheLife({ stale: 60, revalidate: 120, expire: 300 });
  return { ok: false, kind: result.ok ? "not_found" : result.kind };
}

async function fetchFromApi(channelId: string): Promise<{ ok: true; videos: YouTubeVideo[] } | { ok: false; kind: YouTubeErrorKind }> {
  const playlist = await getUploadsPlaylistId(channelId);
  if (!playlist.ok) return playlist;
  const playlistId = playlist.id;

  const items = await apiGet("playlistItems", {
    part: "contentDetails",
    playlistId,
    maxResults: String(MAX_VIDEOS),
    fields: "items/contentDetails/videoId",
  });
  if (!items.ok) return items;
  const ids = parsePlaylistVideoIds(items.json);
  if (!ids.length) return { ok: true, videos: [] };

  const details = await apiGet("videos", {
    part: "snippet,contentDetails,liveStreamingDetails,status",
    id: ids.join(","),
    maxResults: String(MAX_VIDEOS),
    fields:
      "items(id,snippet(title,description,publishedAt,thumbnails,liveBroadcastContent),contentDetails/duration,liveStreamingDetails(actualStartTime,actualEndTime,scheduledStartTime),status(embeddable,privacyStatus))",
  });
  if (!details.ok) return details;

  // Keep the playlist's newest-first order.
  const byId = new Map(parseVideos(details.json).map((video) => [video.videoId, video]));
  return { ok: true, videos: ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])) };
}

/**
 * Recent uploads + live status for a channel. Cached ~2 minutes, including
 * failures — so an exhausted quota is retried at most every couple of minutes.
 */
export async function getChannelMedia(channelId: string, useApi: boolean): Promise<ChannelMedia> {
  "use cache";
  // revalidate: the server re-checks YouTube at most every 2 minutes.
  // stale: 5 minutes keeps this data in each page's instant-navigation shell;
  // live status in the browser is refreshed separately by useLiveStatus.
  cacheLife({ stale: 300, revalidate: 120, expire: 3600 });
  cacheTag("youtube");

  if (!/^UC[A-Za-z0-9_-]{22}$/.test(channelId)) {
    return { videos: [], source: "none", liveStatus: { state: "not_configured" } };
  }

  if (useApi && process.env.YOUTUBE_API_KEY) {
    const result = await fetchFromApi(channelId);
    if (result.ok) {
      return {
        videos: result.videos,
        source: "api",
        liveStatus: classifyLiveStatus(result.videos, new Date()),
      };
    }
    console.error(`[youtube] Data API unavailable (${result.kind}); falling back to RSS.`);
    const rss = await fetchRssVideos(channelId);
    return {
      videos: rss,
      source: rss.length ? "rss" : "none",
      liveStatus: { state: "unavailable", reason: result.kind === "quota" ? "quota" : "error", checkedAt: new Date().toISOString() },
      apiError: result.kind,
    };
  }

  const rss = await fetchRssVideos(channelId);
  return { videos: rss, source: rss.length ? "rss" : "none", liveStatus: { state: "not_configured" } };
}

