import { Aurora } from "@/components/animations/Aurora";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { MediaImage } from "@/components/media/MediaImage";
import { Button } from "@/components/ui/Button";
import { Gleam } from "@/components/ui/Gleam";
import { Icon } from "@/components/ui/Icon";
import { HERO_TIMING } from "@/lib/animations/constants";
import { formatTime, weekdayLabel } from "@/lib/utils/format";
import type { HomePage, ServiceTime } from "@/types/content";
import { HeroMedia } from "./HeroMedia";

type HomeHeroProps = {
  home: HomePage;
  nextService?: ServiceTime;
};

/**
 * High-intensity section.
 * Entrance: glass pill (with the gleam — deliberately no "live" indicator) →
 * headline lines flip up in 3D → copy → CTAs → media
 * card wipes up. Scroll (desktop): the media card pins and expands to
 * full-bleed. Behind it all, a slowly drifting aurora in tonal plum.
 */
export function HomeHero({ home, nextService }: HomeHeroProps) {
  return (
    <section className="surface-dark relative isolate overflow-hidden bg-plum-950">
      <Aurora />

      <div className="container-site flex flex-col items-center pt-36 pb-14 text-center md:pt-44 md:pb-20">
        {home.heroEyebrow && (
          <Reveal
            as="p"
            trigger="load"
            delay={HERO_TIMING.eyebrow}
            y={12}
            className="material-dark mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[0.8125rem] font-medium text-plum-100"
          >
            <Gleam className="size-3.5 text-plum-300" />
            {home.heroEyebrow}
          </Reveal>
        )}

        <SplitText
          as="h1"
          trigger="load"
          delay={HERO_TIMING.title}
          className="text-display-xl max-w-[16ch] font-bold"
        >
          {home.heroTitle}
        </SplitText>

        {home.heroSubtitle && (
          <Reveal
            as="p"
            trigger="load"
            delay={HERO_TIMING.subtitle}
            y={20}
            className="mt-8 max-w-xl text-lead text-plum-200"
          >
            {home.heroSubtitle}
          </Reveal>
        )}

        <Reveal
          trigger="load"
          delay={HERO_TIMING.actions}
          y={20}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {home.primaryCta && (
            <Button href={home.primaryCta.href} variant="white" size="lg" icon="play" iconFirst magnetic>
              {home.primaryCta.label}
            </Button>
          )}
          {home.secondaryCta && (
            <Button href={home.secondaryCta.href} variant="glass" size="lg" icon="arrowRight" magnetic>
              {home.secondaryCta.label}
            </Button>
          )}
        </Reveal>
      </div>

      <HeroMedia>
        <div className="absolute inset-0 px-4 lg:px-0">
          <div
            data-media-frame
            data-animate
            className="relative h-full w-full overflow-hidden [clip-path:inset(0%_0%_0%_0%_round_28px)] lg:[clip-path:inset(0%_7%_0%_7%_round_36px)]"
          >
            <div data-media-inner className="absolute inset-0 will-change-transform">
              <MediaImage
                image={home.heroImage}
                sizes="100vw"
                priority
                placeholderLabel="Hero photo — add one in the Studio (Home Page)"
                placeholderTone="plum"
              />
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-plum-950/80 via-plum-950/10 to-transparent"
            />
            {nextService && (
              <div
                data-media-overlay
                className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-4 p-6 md:flex-row md:items-end md:justify-between md:p-12 lg:px-[10%] lg:pb-16"
              >
                <div>
                  <p className="text-sm font-medium text-plum-200">Join us this week</p>
                  <p className="mt-1 text-display-sm font-bold">
                    {weekdayLabel(nextService.day)}s · {formatTime(nextService.startTime)}
                  </p>
                </div>
                {nextService.location && (
                  <span className="material-dark inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium">
                    <Icon name="mapPin" size={16} className="text-plum-300" />
                    {nextService.location}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </HeroMedia>
    </section>
  );
}
