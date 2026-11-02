import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SermonDetail, SermonDetailSkeleton } from "@/components/sections/sermons/SermonDetail";
import { getSermonArchive, getSermonBySlug, getSermonSlugs } from "@/lib/content";
import { relatedSermons } from "@/lib/sermons/archive";
import { pageMetadata } from "@/lib/seo";

/**
 * Sermon detail: /sermons/<slug> for Sanity sermons, /sermons/yt-<id> for a
 * recent YouTube upload. Known slugs are prerendered; others render on first
 * visit (ISR) behind a skeleton. Unknown or hidden slugs → not found.
 */
export async function generateStaticParams() {
  const slugs = await getSermonSlugs();
  // Cache Components needs at least one entry; this one simply resolves to "not found".
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "no-sermons-yet" }];
}

export async function generateMetadata(props: PageProps<"/sermons/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const sermon = await getSermonBySlug(slug);
  if (!sermon) return { title: "Sermon not found", robots: { index: false } };
  const description =
    sermon.description?.replace(/\s+/g, " ").slice(0, 160) ||
    [sermon.speaker, sermon.scripture].filter(Boolean).join(" · ") ||
    `A message from The Triumphant Family.`;
  return pageMetadata({ title: sermon.title, description, path: sermon.href, image: sermon.thumbnail?.url });
}

async function SermonContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sermon = await getSermonBySlug(slug);
  if (!sermon) notFound();

  const all = await getSermonArchive();
  const related = relatedSermons(sermon, all);
  // When nothing is genuinely related, show recent messages — labelled as such.
  const recent = related.length ? [] : all.filter((other) => other.id !== sermon.id).slice(0, 3);
  return <SermonDetail sermon={sermon} related={related} recent={recent} />;
}

export default function SermonPage(props: PageProps<"/sermons/[slug]">) {
  return (
    <Suspense fallback={<SermonDetailSkeleton />}>
      <SermonContent params={props.params} />
    </Suspense>
  );
}
