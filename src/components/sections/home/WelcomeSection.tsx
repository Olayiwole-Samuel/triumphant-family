import { ImageReveal } from "@/components/animations/ImageReveal";
import { Marquee } from "@/components/animations/Marquee";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { Container, Section } from "@/components/layout/Section";
import { MediaImage } from "@/components/media/MediaImage";
import { Button } from "@/components/ui/Button";
import { Gleam } from "@/components/ui/Gleam";
import { SampleBadge } from "@/components/ui/SampleBadge";
import type { HomePage } from "@/types/content";

type WelcomeSectionProps = {
  home: HomePage;
  /** Words for the scrolling ticker (e.g. belief titles from the CMS). */
  marqueeItems?: string[];
};

/**
 * Editorial welcome: the statement brightens word by word on scroll (shown in
 * full with reduced motion), then the welcome message, a scripture in the
 * Cormorant voice, and a photo — or the gleam motif when no photo is set.
 */
export function WelcomeSection({ home, marqueeItems = [] }: WelcomeSectionProps) {
  return (
    <Section tone="white" className="overflow-hidden">
      <Container>
        <div className="flex items-center justify-between gap-4">
          <Reveal as="p" y={12} className="eyebrow text-plum-600">
            {home.welcomeHeading ?? "Welcome"}
          </Reveal>
          <SampleBadge show={home.isSample} className="text-plum-600" />
        </div>

        {home.welcomeStatement && (
          <SplitText as="h2" variant="words-scrub" className="mt-6 max-w-[20ch] text-display-lg font-bold">
            {home.welcomeStatement}
          </SplitText>
        )}
      </Container>

      {marqueeItems.length > 0 && (
        <Marquee
          items={marqueeItems}
          className="scripture mt-16 py-3 text-[clamp(3rem,8vw,7.5rem)] leading-none text-plum-300 md:mt-24"
        />
      )}

      <Container className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          {home.welcomeImage ? (
            <ImageReveal className="relative aspect-[4/5] shadow-float">
              <MediaImage image={home.welcomeImage} sizes="(min-width: 1024px) 38vw, 100vw" />
            </ImageReveal>
          ) : (
            <Reveal className="squircle relative isolate grid aspect-[4/5] max-h-[34rem] w-full place-items-center overflow-hidden rounded-media bg-plum-900 shadow-float">
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_30%_25%,var(--color-plum-600),transparent_70%),radial-gradient(55%_50%_at_80%_85%,var(--color-plum-700),transparent_70%)]"
              />
              <Gleam className="size-24 text-plum-100/90 md:size-32" />
            </Reveal>
          )}
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          {home.welcomeBody && (
            <Reveal as="p" className="text-lead text-plum-950/75">
              {home.welcomeBody}
            </Reveal>
          )}

          {home.scriptureText && (
            <Reveal as="figure" delay={0.1} className="mt-10 border-l-2 border-plum-200 pl-6">
              <blockquote>
                <p className="scripture text-display-sm leading-[1.15]! text-plum-800">
                  “{home.scriptureText}”
                </p>
              </blockquote>
              {home.scriptureReference && (
                <figcaption className="mt-4 text-sm font-semibold text-plum-600">
                  {home.scriptureReference}
                </figcaption>
              )}
            </Reveal>
          )}

          <Reveal delay={0.15} className="mt-10">
            <Button href="/about" variant="primary" icon="arrowRight">
              Discover our story
            </Button>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
