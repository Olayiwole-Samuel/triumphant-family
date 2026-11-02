"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { FormReader, cleanStringList, success, type FormState } from "@/lib/admin/form";
import { isUuid } from "@/lib/admin/ids";
import { refreshPublic } from "@/lib/admin/revalidate";
import { requireAdmin } from "@/lib/admin/session";
import { SLUG_PATTERN, uniqueSlug } from "@/lib/admin/slug";
import { getDb, schema } from "@/lib/db";
import { getYouTubeVideoId } from "@/lib/youtube/utils";

const AUDIO_MIME = /^audio\/[a-z0-9.+-]+$/;

function audioUrl(form: FormReader): string | undefined {
  const value = form.raw("audioUrl").trim();
  if (!value) return undefined;
  if (/^\/uploads\/[a-z0-9]+-[a-f0-9]{12}\.(mp3|m4a|wav|ogg)$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return url.href;
  } catch {
    // handled below
  }
  form.error("audioUrl", "The audio link must start with https:// (or upload the MP3 instead).");
  return undefined;
}

export async function saveSermon(id: string | null, _state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);
  const db = getDb();

  const title = form.text("title", { label: "Title", required: true, max: 160 });
  const youtubeUrl = form.url("youtubeUrl", { label: "YouTube link" });
  if (youtubeUrl && !getYouTubeVideoId(youtubeUrl)) form.error("youtubeUrl", "That doesn't look like a YouTube video link.");
  const audio = audioUrl(form);
  if (!youtubeUrl && !audio && !form.errors.youtubeUrl && !form.errors.audioUrl) {
    form.error("youtubeUrl", "Add a YouTube link or an audio recording (at least one).");
  }
  const eventId = form.raw("eventId");
  const wantedSlug = form.raw("slug").trim();
  if (wantedSlug && !SLUG_PATTERN.test(wantedSlug)) {
    form.error("slug", "Use lowercase letters, numbers and dashes only, e.g. walking-in-victory.");
  }

  const values = {
    title: title ?? "",
    date: form.date("date", { label: "Date preached", required: true }) ?? "",
    speaker: form.text("speaker", { label: "Speaker", max: 120 }) ?? null,
    series: form.text("series", { label: "Series", max: 120 }) ?? null,
    scripture: form.text("scripture", { label: "Main scripture", max: 120 }) ?? null,
    otherScriptures: cleanStringList(form.json("otherScriptures", []), { max: 20, maxLength: 120 }),
    topics: cleanStringList(form.json("topics", []), { max: 15, maxLength: 60 }),
    description: form.text("description", { label: "Summary", max: 5000 }) ?? null,
    youtubeUrl: youtubeUrl ?? null,
    audioUrl: audio ?? null,
    audioMimeType: audio && AUDIO_MIME.test(form.raw("audioUrlType")) ? form.raw("audioUrlType") : null,
    thumbnail: form.image("thumbnail", { label: "Thumbnail" }) ?? null,
    eventId: isUuid(eventId) ? eventId : null,
    featured: form.bool("featured"),
    published: form.raw("intent") === "publish",
  };
  if (!form.ok) return form.fail();

  const slug = await uniqueSlug(schema.sermons, wantedSlug || values.title, id ?? undefined);
  if (id) {
    await db.update(schema.sermons).set({ ...values, slug }).where(eq(schema.sermons.id, id));
  } else {
    const [row] = await db.insert(schema.sermons).values({ ...values, slug }).returning({ id: schema.sermons.id });
    id = row.id;
  }
  refreshPublic("sermon");
  if (!data.get("existing")) redirect(`/admin/sermons/${id}?saved=1`);
  return success(values.published ? "Sermon saved and published." : "Saved as a draft — it isn't on the website yet.");
}

export async function deleteSermon(id: string) {
  await requireAdmin();
  await getDb().delete(schema.sermons).where(eq(schema.sermons.id, id));
  refreshPublic("sermon");
  redirect("/admin/sermons");
}
