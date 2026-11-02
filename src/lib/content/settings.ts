import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { StoredImage } from "@/lib/db/schema";
import type { Belief, CallToAction, GivingCategory, SocialLink } from "@/types/content";

/**
 * Page-level content, stored as one JSON document per page in the `settings`
 * table. Every field is optional in storage: the website fills gaps with
 * neutral defaults (src/lib/content/index.ts), never invented facts.
 */

export type SiteSettingsData = {
  churchName?: string;
  ministryName?: string;
  tagline?: string;
  description?: string;
  logo?: StoredImage;
  shareImage?: StoredImage;
  contactEmail?: string;
  phone?: string;
  address?: string;
  mapUrl?: string;
  officeHours?: string;
  youtubeChannelUrl?: string;
  youtubeChannelId?: string;
  socialLinks?: SocialLink[];
  mission?: string;
  vision?: string;
  beliefs?: Belief[];
};

export type HomePageData = {
  heroEyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: StoredImage;
  primaryCta?: CallToAction;
  secondaryCta?: CallToAction;
  welcomeHeading?: string;
  welcomeStatement?: string;
  welcomeBody?: string;
  welcomeImage?: StoredImage;
  scriptureText?: string;
  scriptureReference?: string;
  galleryHighlights?: StoredImage[];
  featuredSermonId?: string;
  featuredEventId?: string;
};

export type AboutPageData = {
  heroTitle?: string;
  heroIntro?: string;
  heroImage?: StoredImage;
  storyHeading?: string;
  storyIntro?: string;
  storyBody?: string;
  storyImages?: StoredImage[];
  invitationHeading?: string;
  invitationBody?: string;
};

export type WatchPageData = {
  heading?: string;
  intro?: string;
  featuredVideoUrl?: string;
  featuredVideoTitle?: string;
  manualStreamUrl?: string;
  manualStreamNote?: string;
  /** Off → YouTube is never asked about live services. */
  useYouTubeApi?: boolean;
};

export type EventsPageData = {
  heading?: string;
  intro?: string;
};

export type GivingData = {
  /** Off → the Give page hides the bank details. */
  active?: boolean;
  heading?: string;
  introduction?: string;
  scriptureText?: string;
  scriptureReference?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  additionalInstructions?: string;
  categories?: GivingCategory[];
};

export type SettingsMap = {
  site: SiteSettingsData;
  home: HomePageData;
  about: AboutPageData;
  watch: WatchPageData;
  events: EventsPageData;
  giving: GivingData;
};

export type SettingsKey = keyof SettingsMap;

/** Cache tag for each settings document (expired when the admin saves it). */
export const SETTINGS_TAGS: Record<SettingsKey, string> = {
  site: "siteSettings",
  home: "homePage",
  about: "aboutPage",
  watch: "watchPage",
  events: "eventsPage",
  giving: "givingSettings",
};

export async function readSettings<K extends SettingsKey>(key: K): Promise<SettingsMap[K]> {
  const [row] = await getDb()
    .select({ data: schema.settings.data })
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .limit(1);
  return (row?.data ?? {}) as SettingsMap[K];
}

export async function writeSettings<K extends SettingsKey>(key: K, data: SettingsMap[K]): Promise<void> {
  await getDb()
    .insert(schema.settings)
    .values({ key, data })
    .onConflictDoUpdate({ target: schema.settings.key, set: { data, updatedAt: new Date() } });
}
