"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { cleanText, sanitizeImage } from "@/lib/admin/form";
import { isUuid } from "@/lib/admin/ids";
import { refreshPublic } from "@/lib/admin/revalidate";
import { requireAdmin } from "@/lib/admin/session";
import { getDb, schema } from "@/lib/db";
import type { StoredImage } from "@/lib/db/schema";

/**
 * Photo actions used by the photo manager (gallery albums and event photos).
 * Each change is saved straight away.
 */

export type ManagedPhoto = { id: string; image: StoredImage };

const refresh = () => refreshPublic("galleryAlbum");

export async function addPhotos(albumId: string, images: StoredImage[]): Promise<ManagedPhoto[]> {
  await requireAdmin();
  if (!isUuid(albumId)) return [];
  const clean = images.slice(0, 100).map(sanitizeImage).filter((image): image is StoredImage => Boolean(image));
  if (!clean.length) return [];

  const db = getDb();
  const [last] = await db
    .select({ value: max(schema.galleryPhotos.sortOrder) })
    .from(schema.galleryPhotos)
    .where(eq(schema.galleryPhotos.albumId, albumId));
  const start = (last?.value ?? -1) + 1;
  const rows = await db
    .insert(schema.galleryPhotos)
    .values(clean.map((image, index) => ({ albumId, image, sortOrder: start + index })))
    .returning({ id: schema.galleryPhotos.id, image: schema.galleryPhotos.image });
  refresh();
  return rows;
}

export async function describePhoto(photoId: string, alt: string, caption: string) {
  await requireAdmin();
  if (!isUuid(photoId)) return;
  const db = getDb();
  const [photo] = await db.select().from(schema.galleryPhotos).where(eq(schema.galleryPhotos.id, photoId)).limit(1);
  if (!photo) return;
  await db
    .update(schema.galleryPhotos)
    .set({ image: { ...photo.image, alt: cleanText(alt, 300) ?? "", caption: cleanText(caption, 500) } })
    .where(eq(schema.galleryPhotos.id, photoId));
  refresh();
}

export async function deletePhoto(photoId: string) {
  await requireAdmin();
  if (!isUuid(photoId)) return;
  await getDb().delete(schema.galleryPhotos).where(eq(schema.galleryPhotos.id, photoId));
  refresh();
}

export async function reorderPhotos(albumId: string, orderedIds: string[]) {
  await requireAdmin();
  if (!isUuid(albumId)) return;
  const ids = orderedIds.filter(isUuid).slice(0, 2000);
  const db = getDb();
  const existing = await db
    .select({ id: schema.galleryPhotos.id })
    .from(schema.galleryPhotos)
    .where(and(eq(schema.galleryPhotos.albumId, albumId), inArray(schema.galleryPhotos.id, ids)));
  const valid = new Set(existing.map((row) => row.id));
  for (const [index, id] of ids.entries()) {
    if (valid.has(id)) await db.update(schema.galleryPhotos).set({ sortOrder: index }).where(eq(schema.galleryPhotos.id, id));
  }
  refresh();
}

export async function setCoverPhoto(albumId: string, photoId: string) {
  await requireAdmin();
  if (!isUuid(albumId) || !isUuid(photoId)) return;
  await getDb().update(schema.galleryAlbums).set({ coverPhotoId: photoId }).where(eq(schema.galleryAlbums.id, albumId));
  refresh();
}
