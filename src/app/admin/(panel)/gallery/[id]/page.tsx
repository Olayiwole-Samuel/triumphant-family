import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { ButtonLink, Card, Notice, PageHeader, StatusPill } from "@/components/admin/ui";
import { isUuid } from "@/lib/admin/ids";
import { getDb, schema } from "@/lib/db";
import { deleteAlbum } from "../actions";
import { AlbumForm } from "../AlbumForm";
import { addPhotos, deletePhoto, describePhoto, reorderPhotos, setCoverPhoto } from "../photo-actions";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Edit album" };

export default async function EditAlbumPage({ params, searchParams }: PageProps<"/admin/gallery/[id]">) {
  await requireAdmin(); // pages aren't protected by the layout's check
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const db = getDb();
  const [album] = await db.select().from(schema.galleryAlbums).where(eq(schema.galleryAlbums.id, id)).limit(1);
  if (!album) notFound();
  const photos = await db
    .select({ id: schema.galleryPhotos.id, image: schema.galleryPhotos.image })
    .from(schema.galleryPhotos)
    .where(eq(schema.galleryPhotos.albumId, album.id))
    .orderBy(asc(schema.galleryPhotos.sortOrder), asc(schema.galleryPhotos.createdAt));

  return (
    <>
      <PageHeader
        title={album.title}
        status={<StatusPill published={album.published} draftLabel="Hidden" liveLabel="In gallery" />}
        back={{ href: "/admin/gallery", label: "Photo gallery" }}
        actions={
          <>
            {album.published && photos.length > 0 && (
              <ButtonLink href="/gallery" icon="external" variant="secondary" external>
                View gallery
              </ButtonLink>
            )}
            <DeleteButton action={deleteAlbum.bind(null, album.id)} label="Delete album" confirmLabel="Tap again — deletes the album and its photos" />
          </>
        }
      />
      {created && (
        <div className="mb-6">
          <Notice>Album created. Now upload the photos below.</Notice>
        </div>
      )}
      <Card title="Photos" description="Upload many at once. Describe each photo for people using screen readers. Changes save straight away.">
        <PhotoManager
          albumId={album.id}
          photos={photos}
          coverPhotoId={album.coverPhotoId}
          actions={{ addPhotos, describePhoto, deletePhoto, reorderPhotos, setCoverPhoto }}
        />
      </Card>
      <div className="mt-6">
        <AlbumForm album={album} />
      </div>
    </>
  );
}
