import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getSiteChannelMedia } from "@/lib/content";

/**
 * GET /api/live-status — the church channel's verified live status.
 *
 * Takes no parameters (it can't be used to query arbitrary channels or URLs)
 * and never exposes the API key. Served from the shared ~2-minute YouTube
 * cache, and cacheable at the CDN for 60 seconds, so many open Watch pages
 * still cost at most one YouTube request every couple of minutes.
 */
export async function GET() {
  await connection();
  const media = await getSiteChannelMedia();
  return NextResponse.json(media.liveStatus, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=60" },
  });
}
