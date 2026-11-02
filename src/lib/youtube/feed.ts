import "server-only";
import { parseRssFeed, type YouTubeVideo } from "./parse";

/**
 * The channel's public RSS feed: the 15 newest uploads, no API key needed.
 * Used when no YouTube API key is configured, or as a fallback when the Data
 * API fails. Not cached itself — callers cache (see api.ts).
 * Returns [] if YouTube can't be reached; never throws.
 */
export async function fetchRssVideos(channelId: string): Promise<YouTubeVideo[]> {
  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) throw new Error(`feed responded ${response.status}`);
    return parseRssFeed(await response.text());
  } catch (error) {
    console.error(`[youtube] RSS feed unavailable: ${error instanceof Error ? error.message : "unknown error"}`);
    return [];
  }
}
