import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { ButtonLink, Card, Notice, PageHeader, StatusPill } from "@/components/admin/ui";
import { isUuid } from "@/lib/admin/ids";
import { getDb, schema } from "@/lib/db";
import { addPhotos, deletePhoto, describePhoto, reorderPhotos, setCoverPhoto } from "../../gallery/photo-actions";
import { deleteEvent, ensureEventAlbum } from "../actions";
import { EventForm } from "../EventForm";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({ params, searchParams }: PageProps<"/admin/events/[id]">) {
  await requireAdmin(); // pages aren't protected by the layout's check
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const db = getDb();
  const [event] = await db.select().from(schema.events).where(eq(schema.events.id, id)).limit(1);
  if (!event) notFound();

  const [album] = await db
    .select({ id: schema.galleryAlbums.id, coverPhotoId: schema.galleryAlbums.coverPhotoId, published: schema.galleryAlbums.published })
    .from(schema.galleryAlbums)
    .where(eq(schema.galleryAlbums.eventId, event.id))
    .orderBy(asc(schema.galleryAlbums.createdAt))
    .limit(1);
  const photos = album
    ? await db
        .select({ id: schema.galleryPhotos.id, image: schema.galleryPhotos.image })
        .from(schema.galleryPhotos)
        .where(eq(schema.galleryPhotos.albumId, album.id))
        .orderBy(asc(schema.galleryPhotos.sortOrder), asc(schema.galleryPhotos.createdAt))
    : [];

  return (
    <>
      <PageHeader
        title={event.title}
        status={<StatusPill published={event.published} />}
        back={{ href: "/admin/events", label: "Events" }}
        actions={
          <>
            {event.published && (
              <ButtonLink href={`/events/${event.slug}`} icon="external" variant="secondary" external>
                View on website
              </ButtonLink>
            )}
            <DeleteButton action={deleteEvent.bind(null, event.id)} />
          </>
        }
      />
      {saved && (
        <div className="mb-6">
          <Notice>{event.published ? "Event published — it’s now on the website." : "Saved as a draft. Press Publish when it’s ready."}</Notice>
        </div>
      )}
      <EventForm event={event} showPhotosTab />

      <Card
        id="photos"
        className="-mt-20 mb-28"
        title="Photos from the event"
        description={
          album
            ? `Saved as you upload. They appear on the event page${album.published ? " and in the Photo gallery" : ""}.`
            : "Upload photos after the event — they appear on the event page and in the Photo gallery."
        }
      >
        <PhotoManager
          albumId={album?.id ?? null}
          photos={photos}
          coverPhotoId={album?.coverPhotoId}
          ensureAlbum={ensureEventAlbum.bind(null, event.id)}
          actions={{ addPhotos, describePhoto, deletePhoto, reorderPhotos, setCoverPhoto }}
        />
        {album && (
          <p className="text-[0.8125rem] text-plum-950/55">
            Album title, category, or hiding it from the gallery:{" "}
            <Link href={`/admin/gallery/${album.id}`} className="font-semibold text-plum-600 hover:underline">
              open it in Photo gallery
            </Link>
            .
          </p>
        )}
      </Card>
    </>
  );
}
