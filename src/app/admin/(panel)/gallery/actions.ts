"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { FormReader, success, type FormState } from "@/lib/admin/form";
import { isUuid } from "@/lib/admin/ids";
import { refreshPublic } from "@/lib/admin/revalidate";
import { requireAdmin } from "@/lib/admin/session";
import { uniqueSlug } from "@/lib/admin/slug";
import { getDb, schema } from "@/lib/db";

export async function saveAlbum(id: string | null, _state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);
  const eventId = form.raw("eventId");
  const values = {
    title: form.text("title", { label: "Album name", required: true, max: 160 }) ?? "",
    date: form.date("date", { label: "Date" }) ?? null,
    category: form.text("category", { label: "Category", max: 60 }) ?? null,
    description: form.text("description", { label: "Description", max: 1000 }) ?? null,
    eventId: isUuid(eventId) ? eventId : null,
    featured: form.bool("featured"),
    sortOrder: form.int("sortOrder", { label: "Display order", min: 0, max: 999 }) ?? null,
    published: form.raw("intent") === "publish",
  };
  if (!form.ok) return form.fail();

  const db = getDb();
  if (id) {
    await db.update(schema.galleryAlbums).set(values).where(eq(schema.galleryAlbums.id, id));
  } else {
    const slug = await uniqueSlug(schema.galleryAlbums, values.title);
    const [row] = await db.insert(schema.galleryAlbums).values({ ...values, slug }).returning({ id: schema.galleryAlbums.id });
    id = row.id;
  }
  refreshPublic("galleryAlbum");
  if (!data.get("existing")) redirect(`/admin/gallery/${id}?created=1`);
  return success(values.published ? "Album saved — it's in the Photo gallery." : "Album saved as a draft (hidden from the gallery).");
}

export async function deleteAlbum(id: string) {
  await requireAdmin();
  await getDb().delete(schema.galleryAlbums).where(eq(schema.galleryAlbums.id, id));
  refreshPublic("galleryAlbum");
  redirect("/admin/gallery");
}
