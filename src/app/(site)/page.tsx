import { GalleryStory } from "@/components/sections/home/GalleryStory";
import { GivingCta } from "@/components/sections/home/GivingCta";
import { HomeHero } from "@/components/sections/home/HomeHero";
import { VisitCta } from "@/components/sections/home/VisitCta";
import { WelcomeSection } from "@/components/sections/home/WelcomeSection";
import { EventsSection } from "@/components/sections/shared/EventsSection";
import { LeadershipSection } from "@/components/sections/shared/LeadershipSection";
import { SermonShowcase } from "@/components/sections/shared/SermonShowcase";
import { ServiceTimesSection } from "@/components/sections/shared/ServiceTimesSection";
import {
  getAlbumPhotos,
  getFeaturedSermon,
  getGivingSettings,
  getHomePage,
  getLatestSermons,
  getLeaders,
  getServiceTimes,
  getSiteSettings,
  getUpcomingEvents,
  getYouTubeUploads,
} from "@/lib/content";
import type { Metadata } from "next";
import { Suspense, type ComponentProps } from "react";

/** The title comes from the site-wide default (Church name — tagline). */
export const metadata: Metadata = {
  description:
    "The Triumphant Family — The Gleam of Salvation Apostolic Ministry. A place to encounter God, grow in faith and find your spiritual family, in person or online.",
  alternates: { canonical: "/" },
};

/** Sermon showcase + the church's latest YouTube uploads (external data). */
async function HomeSermons(props: Omit<ComponentProps<typeof SermonShowcase>, "uploads">) {
  const uploads = await getYouTubeUploads(3);
  return <SermonShowcase {...props} uploads={uploads} />;
}

/**
 * Home: Hero → Services → Welcome → Featured sermon → Events → Leadership →
 * Gallery → Giving → Visit. All content is fetched here in parallel (each
 * function is cached and tagged) and passed down to presentational sections.
 */
export default async function HomePage() {
  const [settings, home, services, leaders, featured, sermons, events, giving] =
    await Promise.all([
      getSiteSettings(),
      getHomePage(),
      getServiceTimes(),
      getLeaders(),
      getFeaturedSermon(),
      getLatestSermons(4),
      getUpcomingEvents(4),
      getGivingSettings(),
    ]);

  const moreSermons = sermons.filter((sermon) => sermon.id !== featured?.id).slice(0, 3);
  const photos = home.galleryHighlights.length ? home.galleryHighlights : await getAlbumPhotos();

  // The editor's featured event leads the list.
  const orderedEvents = home.featuredEventSlug
    ? [
        ...events.filter((event) => event.slug === home.featuredEventSlug),
        ...events.filter((event) => event.slug !== home.featuredEventSlug),
      ]
    : events;

  const marqueeItems = settings.beliefs.map((belief) => belief.title);

  return (
    <>
      <HomeHero home={home} nextService={services[0]} />
      <ServiceTimesSection
        services={services}
        address={settings.address}
        mapUrl={settings.mapUrl}
        youtubeChannelUrl={settings.youtubeChannelUrl}
        sheet
      />
      <WelcomeSection home={home} marqueeItems={marqueeItems} />
      {/* The YouTube row streams in; until then the section shows without it. */}
      <Suspense
        fallback={
          <SermonShowcase
            featured={featured}
            more={moreSermons}
            uploads={[]}
            youtubeChannelUrl={settings.youtubeChannelUrl}
          />
        }
      >
        <HomeSermons featured={featured} more={moreSermons} youtubeChannelUrl={settings.youtubeChannelUrl} />
      </Suspense>
      <EventsSection events={orderedEvents} sheet />
      <LeadershipSection leaders={leaders} />
      <GalleryStory photos={photos} />
      <GivingCta giving={giving} />
      <VisitCta settings={settings} service={services[0]} />
    </>
  );
}
