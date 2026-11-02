"use server";

import { FormReader, cleanText, success, type FormState } from "@/lib/admin/form";
import { refreshPublic } from "@/lib/admin/revalidate";
import { requireAdmin } from "@/lib/admin/session";
import {
  SETTINGS_TAGS,
  writeSettings,
  type AboutPageData,
  type EventsPageData,
  type GivingData,
  type HomePageData,
  type WatchPageData,
} from "@/lib/content/settings";
import { getYouTubeVideoId } from "@/lib/youtube/utils";
import type { CallToAction } from "@/types/content";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function button(form: FormReader, prefix: string, label: string): CallToAction | undefined {
  const text = form.text(`${prefix}Label`, { label: `${label} text`, max: 40 });
  const href = form.url(`${prefix}Href`, { label: `${label} link`, allowPath: true });
  if (text && !href) form.error(`${prefix}Href`, `Add where the ${label.toLowerCase()} goes, e.g. /watch.`);
  if (href && !text) form.error(`${prefix}Label`, `Add the ${label.toLowerCase()} text.`);
  return text && href ? { label: text, href } : undefined;
}

export async function saveHomePage(_state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);
  const featuredSermonId = form.raw("featuredSermonId");
  const featuredEventId = form.raw("featuredEventId");
  const home: HomePageData = {
    heroEyebrow: form.text("heroEyebrow", { label: "Small heading", max: 120 }),
    heroTitle: form.text("heroTitle", { label: "Headline", max: 120 }),
    heroSubtitle: form.text("heroSubtitle", { label: "Introduction", max: 400 }),
    heroImage: form.image("heroImage", { label: "Photo" }),
    primaryCta: button(form, "primary", "Main button"),
    secondaryCta: button(form, "secondary", "Second button"),
    welcomeHeading: form.text("welcomeHeading", { label: "Welcome heading", max: 120 }),
    welcomeStatement: form.text("welcomeStatement", { label: "Welcome statement", max: 300 }),
    welcomeBody: form.text("welcomeBody", { label: "Welcome message", max: 2000 }),
    welcomeImage: form.image("welcomeImage", { label: "Welcome photo" }),
    scriptureText: form.text("scriptureText", { label: "Scripture", max: 600 }),
    scriptureReference: form.text("scriptureReference", { label: "Scripture reference", max: 80 }),
    galleryHighlights: form.images("galleryHighlights", { max: 12 }),
    featuredSermonId: UUID.test(featuredSermonId) ? featuredSermonId : undefined,
    featuredEventId: UUID.test(featuredEventId) ? featuredEventId : undefined,
  };
  if (home.scriptureText && !home.scriptureReference) form.error("scriptureReference", "Add the reference, e.g. 2 Corinthians 2:14 (KJV).");
  if (!form.ok) return form.fail();

  await writeSettings("home", home);
  refreshPublic(SETTINGS_TAGS.home);
  return success("Home page saved.");
}

export async function saveAboutPage(_state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);
  const about: AboutPageData = {
    heroTitle: form.text("heroTitle", { label: "Headline", max: 120 }),
    heroIntro: form.text("heroIntro", { label: "Introduction", max: 600 }),
    heroImage: form.image("heroImage", { label: "Photo" }),
    storyHeading: form.text("storyHeading", { label: "Story label", max: 60 }),
    storyIntro: form.text("storyIntro", { label: "Story opening line", max: 300 }),
    storyBody: form.text("storyBody", { label: "Our story", max: 20000 }),
    storyImages: form.images("storyImages", { max: 3 }),
    invitationHeading: form.text("invitationHeading", { label: "Invitation heading", max: 120 }),
    invitationBody: form.text("invitationBody", { label: "Invitation text", max: 600 }),
  };
  if (!form.ok) return form.fail();
  await writeSettings("about", about);
  refreshPublic(SETTINGS_TAGS.about);
  return success("About page saved.");
}

export async function saveWatchPage(_state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);
  const featuredVideoUrl = form.url("featuredVideoUrl", { label: "Featured video link" });
  if (featuredVideoUrl && !getYouTubeVideoId(featuredVideoUrl)) form.error("featuredVideoUrl", "Paste a link to a YouTube video.");
  const manualStreamUrl = form.url("manualStreamUrl", { label: "Livestream link" });
  if (manualStreamUrl && !getYouTubeVideoId(manualStreamUrl)) form.error("manualStreamUrl", "Paste the YouTube link of the live service.");
  const watch: WatchPageData = {
    heading: form.text("heading", { label: "Headline", max: 120 }),
    intro: form.text("intro", { label: "Introduction", max: 600 }),
    featuredVideoUrl,
    featuredVideoTitle: form.text("featuredVideoTitle", { label: "Featured video title", max: 160 }),
    manualStreamUrl,
    manualStreamNote: form.text("manualStreamNote", { label: "Livestream note", max: 200 }),
    useYouTubeApi: form.bool("useYouTubeApi"),
  };
  if (!form.ok) return form.fail();
  await writeSettings("watch", watch);
  refreshPublic(SETTINGS_TAGS.watch);
  return success("Watch page saved.");
}

export async function saveEventsPage(_state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);
  const page: EventsPageData = {
    heading: form.text("heading", { label: "Headline", max: 120 }),
    intro: form.text("intro", { label: "Introduction", max: 600 }),
  };
  if (!form.ok) return form.fail();
  await writeSettings("events", page);
  refreshPublic(SETTINGS_TAGS.events);
  return success("Events page saved.");
}

export async function saveGiving(_state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);
  const accountNumber = form.text("accountNumber", { label: "Account number", max: 30 });
  if (accountNumber && !/^[\d\s-]{6,30}$/.test(accountNumber)) {
    form.error("accountNumber", "Use digits only (spaces are fine).");
  }
  const giving: GivingData = {
    active: form.bool("active"),
    heading: form.text("heading", { label: "Headline", max: 120 }),
    introduction: form.text("introduction", { label: "Why we give", max: 1500 }),
    scriptureText: form.text("scriptureText", { label: "Scripture", max: 600 }),
    scriptureReference: form.text("scriptureReference", { label: "Scripture reference", max: 80 }),
    bankName: form.text("bankName", { label: "Bank name", max: 80 }),
    accountName: form.text("accountName", { label: "Account name", max: 120 }),
    accountNumber,
    additionalInstructions: form.text("additionalInstructions", { label: "Instructions", max: 800 }),
    categories: form
      .json<Array<Record<string, unknown>>>("categories", [])
      .map((row) => ({ title: cleanText(row.title, 80) ?? "", description: cleanText(row.description, 300) }))
      .filter((category) => category.title),
  };
  if (accountNumber && !giving.bankName) form.error("bankName", "Add the bank name so people know where to send it.");
  if (!form.ok) return form.fail();
  await writeSettings("giving", giving);
  refreshPublic(SETTINGS_TAGS.giving);
  return success("Giving details saved.");
}
