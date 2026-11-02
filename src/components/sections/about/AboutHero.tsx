import { Aurora } from "@/components/animations/Aurora";
import { ImageReveal } from "@/components/animations/ImageReveal";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { MediaImage } from "@/components/media/MediaImage";
import { Gleam } from "@/components/ui/Gleam";
import type { AboutPage } from "@/types/content";

/** About page opening: headline + introduction beside a portrait photo (or the gleam). */
export function AboutHero({ about }: { about: AboutPage }) {
  return (
    <header className="surface-dark relative isolate overflow-hidden bg-plum-950 pt-36 pb-[calc(5rem+var(--radius-sheet))] md:pt-44 md:pb-[calc(7rem+var(--radius-sheet))]">
      <Aurora />
      <div className="container-site grid items-end gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal as="p" trigger="load" y={12} className="eyebrow mb-5 text-plum-300">
            About us
          </Reveal>
          <SplitText as="h1" trigger="load" delay={0.1} className="text-display-lg font-bold">
            {about.heroTitle}
          </SplitText>
          {about.heroIntro && (
            <Reveal trigger="load" delay={0.5} y={20} as="p" className="mt-8 max-w-xl text-lead text-plum-200">
              {about.heroIntro}
            </Reveal>
          )}
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          {about.heroImage ? (
            <ImageReveal trigger="load" delay={0.4} className="relative aspect-[4/5] shadow-float">
              <MediaImage image={about.heroImage} sizes="(min-width: 1024px) 32vw, 100vw" priority />
            </ImageReveal>
          ) : (
            <Reveal
              trigger="load"
              delay={0.4}
              className="material-dark squircle hidden aspect-[4/5] place-items-center rounded-media lg:grid"
            >
              <Gleam className="size-28 text-plum-200" />
            </Reveal>
          )}
        </div>
      </div>
    </header>
  );
}
