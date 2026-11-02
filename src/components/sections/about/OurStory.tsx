import { Parallax } from "@/components/animations/Parallax";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { Container, Section } from "@/components/layout/Section";
import { MediaImage } from "@/components/media/MediaImage";
import { RichText } from "@/components/ui/RichText";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { EmptyState } from "@/components/ui/States";
import type { AboutPage } from "@/types/content";

/** "Our story": large opening line, the editor's history, and up to three photos. */
export function OurStory({ about }: { about: AboutPage }) {
  const hasStory = Boolean(about.storyIntro || about.storyBody);

  return (
    <Section tone="white" sheet>
      <Container>
        <div className="flex items-center justify-between gap-4">
          <Reveal as="p" y={12} className="eyebrow text-plum-600">
            {about.storyHeading ?? "Our story"}
          </Reveal>
          <SampleBadge show={about.isSample} className="text-plum-600" />
        </div>

        {hasStory ? (
          <div className="mt-8 grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              {about.storyIntro && (
                <SplitText as="h2" className="text-display-md font-bold">
                  {about.storyIntro}
                </SplitText>
              )}
              {about.storyBody && (
                <Reveal className="mt-10 max-w-2xl text-lead text-plum-950/75">
                  <RichText text={about.storyBody} />
                </Reveal>
              )}
            </div>

            {about.storyImages.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:col-span-4 lg:col-start-9 lg:grid-cols-1">
                {about.storyImages.map((image, index) => (
                  <Parallax key={`${image.url}-${index}`} speed={index % 2 ? 6 : -6}>
                    <figure>
                      <div className="squircle relative aspect-[4/5] overflow-hidden rounded-media bg-plum-100 shadow-card">
                        <MediaImage image={image} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" />
                      </div>
                      {image.caption && (
                        <figcaption className="mt-3 text-sm text-plum-950/60">{image.caption}</figcaption>
                      )}
                    </figure>
                  </Parallax>
                ))}
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            icon="heart"
            title="Our story is being written"
            description="The history of the ministry will be shared here soon."
          />
        )}
      </Container>
    </Section>
  );
}
