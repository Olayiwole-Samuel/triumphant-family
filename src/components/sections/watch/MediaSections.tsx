import Link from "next/link";
import { Stagger } from "@/components/animations/Stagger";
import { Container, Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Gleam } from "@/components/ui/Gleam";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/States";
import type { Sermon } from "@/types/content";
import { VideoCard } from "../shared/VideoCard";

/** Recent uploads / messages — real data only (YouTube or Sanity). */
export function RecentVideos({ videos, youtubeChannelUrl }: { videos: Sermon[]; youtubeChannelUrl?: string }) {
  return (
    <Section tone="night">
      <Container>
        <SectionHeading
          eyebrow="Recently shared"
          title="Catch up on recent messages"
          action={
            <Button href="/sermons" variant="glass" icon="arrowRight">
              Sermon archive
            </Button>
          }
        />
        {videos.length ? (
          <Stagger as="ul" variant="tilt" className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <li key={video.id}>
                <VideoCard sermon={video} />
              </li>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            className="mt-14"
            icon="play"
            title="Recent videos are unavailable right now"
            description="We couldn’t load the latest uploads. You can always find every message on our YouTube channel."
            action={
              youtubeChannelUrl ? (
                <Button href={youtubeChannelUrl} variant="white" icon="arrowUpRight">
                  Open YouTube
                </Button>
              ) : undefined
            }
          />
        )}
      </Container>
    </Section>
  );
}

const DESTINATIONS = [
  {
    href: "/sermons",
    title: "Sermon archive",
    text: "Search every message by title, speaker, topic or scripture — and listen to audio.",
    icon: "play" as const,
  },
  {
    href: "/gallery",
    title: "Photo gallery",
    text: "Moments of worship, celebration and fellowship from the family.",
    icon: "image" as const,
  },
];

/** Big, simple routes onward from the Watch page. */
export function MediaNav() {
  return (
    <Section tone="canvas" sheet>
      <Container>
        <Stagger as="ul" className="grid gap-4 md:grid-cols-2">
          {DESTINATIONS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="squircle group relative flex h-full items-start gap-5 overflow-hidden rounded-card bg-white p-7 shadow-card transition-[translate,box-shadow] duration-500 ease-spring hover:-translate-y-1 hover:shadow-float md:p-10"
              >
                <span className="squircle grid size-14 shrink-0 place-items-center rounded-2xl bg-plum-600 text-white">
                  <Icon name={item.icon} size={24} />
                </span>
                <span className="flex-1">
                  <span className="block text-2xl font-bold tracking-tight">{item.title}</span>
                  <span className="mt-2 block text-plum-950/65">{item.text}</span>
                </span>
                <Gleam className="absolute -right-6 -bottom-6 size-28 text-plum-100 transition-transform duration-700 ease-spring group-hover:rotate-45" />
              </Link>
            </li>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
