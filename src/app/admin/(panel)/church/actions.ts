"use server";

import { FormReader, cleanText, success, type FormState } from "@/lib/admin/form";
import { refreshPublic } from "@/lib/admin/revalidate";
import { requireAdmin } from "@/lib/admin/session";
import { SETTINGS_TAGS, writeSettings, type SiteSettingsData } from "@/lib/content/settings";
import { getYouTubeVideoId } from "@/lib/youtube/utils";
import type { Belief, SocialLink, SocialPlatform } from "@/types/content";

const PLATFORMS: SocialPlatform[] = ["youtube", "facebook", "instagram", "x", "tiktok", "whatsapp", "other"];
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

export async function saveChurchInfo(_state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);

  const socialLinks: SocialLink[] = [];
  for (const [index, row] of form.json<Array<Record<string, unknown>>>("socialLinks", []).entries()) {
    const url = cleanText(row.url, 500);
    if (!url) continue;
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
      socialLinks.push({
        platform: PLATFORMS.find((p) => p === row.platform) ?? "other",
        url: parsed.href,
        label: cleanText(row.label, 60),
      });
    } catch {
      form.error("socialLinks", `Social link ${index + 1} must be a full web address starting with https://`);
    }
  }

  const beliefs: Belief[] = form
    .json<Array<Record<string, unknown>>>("beliefs", [])
    .map((row) => ({ title: cleanText(row.title, 120) ?? "", description: cleanText(row.description, 600) }))
    .filter((belief) => belief.title);

  const channelId = form.text("youtubeChannelId", { label: "YouTube channel ID", max: 40 });
  if (channelId && !CHANNEL_ID.test(channelId)) {
    form.error("youtubeChannelId", "A channel ID starts with “UC” and is 24 characters long.");
  }
  const channelUrl = form.url("youtubeChannelUrl", { label: "YouTube channel link" });
  if (channelUrl && getYouTubeVideoId(channelUrl)) {
    form.error("youtubeChannelUrl", "That's a link to a video — paste the channel's link instead (e.g. https://www.youtube.com/@yourchannel).");
  }

  const settings: SiteSettingsData = {
    churchName: form.text("churchName", { label: "Church name", required: true, max: 120 }),
    ministryName: form.text("ministryName", { label: "Ministry name", max: 160 }),
    tagline: form.text("tagline", { label: "Tagline", max: 160 }),
    description: form.text("description", { label: "Short description", max: 300 }),
    logo: form.image("logo", { label: "Logo" }),
    shareImage: form.image("shareImage", { label: "Sharing image" }),
    contactEmail: form.email("contactEmail", { label: "Email" }),
    phone: form.text("phone", { label: "Phone", max: 40 }),
    address: form.text("address", { label: "Address", max: 400 }),
    mapUrl: form.url("mapUrl", { label: "Map link" }),
    officeHours: form.text("officeHours", { label: "Office hours", max: 300 }),
    youtubeChannelUrl: channelUrl,
    youtubeChannelId: channelId,
    socialLinks,
    mission: form.text("mission", { label: "Mission", max: 800 }),
    vision: form.text("vision", { label: "Vision", max: 800 }),
    beliefs,
  };
  if (!form.ok) return form.fail();

  await writeSettings("site", settings);
  refreshPublic(SETTINGS_TAGS.site);
  return success("Church information saved. It's now live across the website.");
}
