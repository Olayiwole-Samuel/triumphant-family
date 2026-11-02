/* eslint-disable @next/next/no-img-element -- small admin thumbnails */
import { desc, ilike, or } from "drizzle-orm";
import type { Metadata } from "next";
import { inputClass } from "@/components/admin/fields";
import { ButtonLink, EmptyNote, ItemList, ItemRow, PageHeader, StatusPill } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { thumbUrl } from "@/lib/admin/thumb";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/utils/format";
import { getYouTubeThumbnailUrl, getYouTubeVideoId } from "@/lib/youtube/utils";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Sermons" };

export default async function SermonsPage({ searchParams }: PageProps<"/admin/sermons">) {
  await requireAdmin(); // pages aren't protected by the layout's check
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const t = schema.sermons;
  // Escape LIKE wildcards so a search for "100%" matches literally.
  const pattern = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
  const sermons = await getDb()
    .select({
      id: t.id,
      title: t.title,
      date: t.date,
      speaker: t.speaker,
      youtubeUrl: t.youtubeUrl,
      audioUrl: t.audioUrl,
      thumbnail: t.thumbnail,
      published: t.published,
    })
    .from(t)
    .where(search ? or(ilike(t.title, pattern), ilike(t.speaker, pattern), ilike(t.series, pattern)) : undefined)
    .orderBy(desc(t.date), desc(t.createdAt))
    .limit(300);

  return (
    <>
      <PageHeader
        title="Sermons"
        description="Messages on the Sermons page. Your latest YouTube uploads also appear there automatically — add them here to give them notes, topics or audio."
        actions={<ButtonLink href="/admin/sermons/new" icon="plus">Add sermon</ButtonLink>}
      />
      <form className="mb-5" role="search">
        <label htmlFor="sermon-search" className="sr-only">Search sermons</label>
        <div className="relative">
          <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-plum-950/40" />
          <input id="sermon-search" name="q" defaultValue={search} placeholder="Search by title, speaker or series" className={`${inputClass} pl-10`} />
        </div>
      </form>
      {sermons.length ? (
        <ItemList>
          {sermons.map((sermon) => {
            const videoId = getYouTubeVideoId(sermon.youtubeUrl);
            const thumb = sermon.thumbnail ? thumbUrl(sermon.thumbnail.url, 200) : videoId ? getYouTubeThumbnailUrl(videoId) : undefined;
            return (
              <ItemRow
                key={sermon.id}
                href={`/admin/sermons/${sermon.id}`}
                title={sermon.title}
                meta={[formatDate(sermon.date), sermon.speaker, sermon.audioUrl ? "Audio" : null].filter(Boolean).join(" · ")}
                thumb={
                  <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-plum-100 text-plum-500">
                    {thumb ? <img src={thumb} alt="" className="size-full object-cover" /> : <Icon name="mic" size={18} className="absolute inset-0 m-auto" />}
                  </span>
                }
                status={<StatusPill published={sermon.published} />}
              />
            );
          })}
        </ItemList>
      ) : search ? (
        <EmptyNote icon="search" title={`No sermons match “${search}”`} action={<ButtonLink href="/admin/sermons" variant="secondary">Show all</ButtonLink>} />
      ) : (
        <EmptyNote icon="mic" title="No sermons yet" action={<ButtonLink href="/admin/sermons/new" icon="plus">Add sermon</ButtonLink>}>
          Add a message with its YouTube video, an MP3, or both.
        </EmptyNote>
      )}
    </>
  );
}
