import { Suspense } from "react";
import { Aurora } from "@/components/animations/Aurora";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { Container, Section } from "@/components/layout/Section";
import { ServiceTimesSection } from "@/components/sections/shared/ServiceTimesSection";
import { MediaNav, RecentVideos } from "@/components/sections/watch/MediaSections";
import { WatchStage, type StageVideo } from "@/components/sections/watch/WatchStage";
import { Skeleton } from "@/components/ui/States";
import {
  getFeaturedSermon,
  getServiceTimes,
  getSiteChannelMedia,
  getSiteSettings,
  getWatchPage,
  getYouTubeUploads,
} from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { getYouTubeThumbnailUrl } from "@/lib/youtube/utils";

export const metadata = pageMetadata({
  title: "Watch",
  description:
    "Watch The Triumphant Family online — join live services on YouTube, or catch up on recent messages.",
  path: "/watch",
});

/** The stage: live / upcoming / featured video. Streams in (YouTube data). */
async function WatchLive() {
  const [watch, settings, media, uploads, featuredSermon] = await Promise.all([
    getWatchPage(),
    getSiteSettings(),
    getSiteChannelMedia(),
    getYouTubeUploads(9),
    getFeaturedSermon(),
  ]);

  // Featured when nothing is live: editor's pick → featured sermon → latest upload.
  let featured: StageVideo | undefined;
  if (watch.featuredVideoId) {
    const known = uploads.find((video) => video.youtubeVideoId === watch.featuredVideoId);
    featured = {
      videoId: watch.featuredVideoId,
      title: watch.featuredVideoTitle ?? known?.title ?? "Featured video",
      thumbnailUrl: known?.thumbnail?.url ?? getYouTubeThumbnailUrl(watch.featuredVideoId),
      embeddable: known?.embeddable,
      href: known?.href,
    };
  } else {
    const source = featuredSermon?.youtubeVideoId ? featuredSermon : uploads[0];
    if (source?.youtubeVideoId) {
      featured = {
        videoId: source.youtubeVideoId,
        title: source.title,
        thumbnailUrl: source.thumbnail?.url,
        embeddable: source.embeddable,
        href: source.href,
      };
    }
  }

  const manual =
    watch.manualStreamVideoId && watch.manualStreamUrl
      ? { videoId: watch.manualStreamVideoId, url: watch.manualStreamUrl, note: watch.manualStreamNote }
      : undefined;

  return (
    <WatchStage
      initialStatus={media.liveStatus}
      featured={featured}
      manual={manual}
      youtubeChannelUrl={settings.youtubeChannelUrl}
    />
  );
}

async function RecentUploads() {
  const [uploads, settings] = await Promise.all([getYouTubeUploads(9), getSiteSettings()]);
  return <RecentVideos videos={uploads} youtubeChannelUrl={settings.youtubeChannelUrl} />;
}

function StageSkeleton() {
  return (
    <div role="status" aria-label="Loading video" className="grid gap-8 text-white lg:grid-cols-12">
      <Skeleton className="aspect-video rounded-card lg:col-span-8" />
      <div className="space-y-4 lg:col-span-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>
    </div>
  );
}

function RecentSkeleton() {
  return (
    <Section tone="night">
      <Container>
        <div role="status" aria-label="Loading recent videos" className="grid gap-6 text-white sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="aspect-video rounded-card" />
          ))}
        </div>
      </Container>
    </Section>
  );
}

/**
 * Watch: live/featured stage → onward links → recent uploads → service times.
 * Live status comes from verified YouTube metadata (src/lib/youtube) and is
 * refreshed in the browser while the page is open. YouTube-dependent parts
 * stream in behind skeletons, so the page shell never waits on YouTube.
 */
export default async function WatchPage() {
  const [watch, settings, services] = await Promise.all([getWatchPage(), getSiteSettings(), getServiceTimes()]);

  return (
    <>
      <section className="surface-dark relative isolate overflow-hidden bg-plum-950 pt-32 pb-[calc(4rem+var(--radius-sheet))] md:pt-40">
        <Aurora />
        <div className="container-site">
          <Reveal as="p" trigger="load" y={12} className="eyebrow mb-4 text-plum-300">
            Watch online
          </Reveal>
          <SplitText as="h1" trigger="load" delay={0.1} className="text-display-lg max-w-5xl font-bold">
            {watch.heading}
          </SplitText>
          <Reveal as="p" trigger="load" delay={0.4} y={16} className="mt-6 max-w-2xl text-lead text-plum-200">
            {watch.intro ??
              "Worship with us from anywhere. Join our services live on YouTube, or catch up on any message you missed."}
          </Reveal>
          <Reveal trigger="load" delay={0.55} y={32} className="mt-12 md:mt-16">
            <Suspense fallback={<StageSkeleton />}>
              <WatchLive />
            </Suspense>
          </Reveal>
        </div>
      </section>
      <MediaNav />
      <Suspense fallback={<RecentSkeleton />}>
        <RecentUploads />
      </Suspense>
      <ServiceTimesSection
        services={services}
        address={settings.address}
        mapUrl={settings.mapUrl}
        youtubeChannelUrl={settings.youtubeChannelUrl}
        title="Join the next service"
        sheet
      />
    </>
  );
}
