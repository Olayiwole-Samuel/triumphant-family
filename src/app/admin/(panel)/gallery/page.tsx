/* eslint-disable @next/next/no-img-element -- small admin thumbnails */
import { count, desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { ButtonLink, EmptyNote, ItemList, ItemRow, PageHeader, StatusPill } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { thumbUrl } from "@/lib/admin/thumb";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/utils/format";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Photo gallery" };

export default async function GalleryAdminPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  const a = schema.galleryAlbums;
  const p = schema.galleryPhotos;
  const albums = await getDb()
    .select({
      id: a.id,
      title: a.title,
      date: a.date,
      category: a.category,
      published: a.published,
      eventTitle: schema.events.title,
      photos: count(p.id),
      firstPhoto: sql<{ url: string } | null>`(select image from gallery_photos gp where gp.album_id = ${a.id} order by gp.sort_order, gp.created_at limit 1)`,
    })
    .from(a)
    .leftJoin(p, eq(p.albumId, a.id))
    .leftJoin(schema.events, eq(a.eventId, schema.events.id))
    .groupBy(a.id, schema.events.title)
    .orderBy(desc(a.featured), sql`${a.sortOrder} asc nulls last`, sql`${a.date} desc nulls last`);

  return (
    <>
      <PageHeader
        title="Photo gallery"
        description="Albums shown on the Gallery page. Albums with no photos stay hidden."
        actions={<ButtonLink href="/admin/gallery/new" icon="plus">New album</ButtonLink>}
      />
      {albums.length ? (
        <ItemList>
          {albums.map((album) => (
            <ItemRow
              key={album.id}
              href={`/admin/gallery/${album.id}`}
              title={album.title}
              meta={[
                `${album.photos} photo${album.photos === 1 ? "" : "s"}`,
                album.date && formatDate(album.date),
                album.eventTitle && `Event: ${album.eventTitle}`,
                album.category,
              ]
                .filter(Boolean)
                .join(" · ")}
              thumb={
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-plum-100 text-plum-500">
                  {album.firstPhoto?.url ? (
                    <img src={thumbUrl(album.firstPhoto.url, 120)} alt="" className="size-full object-cover" />
                  ) : (
                    <Icon name="image" size={18} className="absolute inset-0 m-auto" />
                  )}
                </span>
              }
              status={<StatusPill published={album.published} draftLabel="Hidden" liveLabel="In gallery" />}
            />
          ))}
        </ItemList>
      ) : (
        <EmptyNote icon="image" title="No albums yet" action={<ButtonLink href="/admin/gallery/new" icon="plus">New album</ButtonLink>}>
          Create an album, then upload many photos at once. Event photos can also be added on the event&apos;s own screen.
        </EmptyNote>
      )}
    </>
  );
}
