import { HorizontalScroll } from "@/components/animations/HorizontalScroll";
import { Container, Section } from "@/components/layout/Section";
import { MediaImage } from "@/components/media/MediaImage";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/States";
import type { MediaImage as MediaImageData } from "@/types/content";

/** Keep very tall or very wide photos within a pleasing range. */
function aspectRatio(photo: MediaImageData) {
  if (!photo.width || !photo.height) return 4 / 5;
  return Math.min(1.8, Math.max(0.62, photo.width / photo.height));
}

/**
 * An editorial photo story: photos keep their own proportions on a shared
 * baseline and travel sideways as you scroll (desktop) or swipe (mobile).
 * Each frame's size is set from the photo's dimensions, so nothing shifts as
 * images load.
 */
export function GalleryStory({ photos, sheet }: { photos: MediaImageData[]; sheet?: boolean }) {
  return (
    <Section tone="canvas" spaced={false} sheet={sheet} className="pt-[clamp(5rem,3rem+8vw,9.5rem)]">
      <Container>
        <SectionHeading
          eyebrow="Gallery"
          title="Moments from the family"
          action={
            <Button href="/gallery" variant="tinted" icon="arrowRight">
              View the gallery
            </Button>
          }
        />
      </Container>

      {photos.length ? (
        <HorizontalScroll
          label="Photos from church life"
          className="flex flex-col justify-center pt-12 pb-[clamp(5rem,3rem+8vw,9.5rem)] lg:min-h-svh lg:pt-0 lg:pb-0"
          trackClassName="items-end gap-4 px-[clamp(1rem,4.5vw,3rem)] md:gap-6"
        >
          {photos.map((photo, index) => (
            <figure key={`${photo.url}-${index}`} className="shrink-0 snap-start">
              <div
                className="squircle relative h-[62vw] max-h-[30rem] overflow-hidden rounded-media bg-plum-200 shadow-card sm:h-[44vw] lg:h-[58vh] lg:max-h-[38rem]"
                style={{ aspectRatio: aspectRatio(photo) }}
              >
                <div data-hscroll-parallax className="absolute inset-0">
                  <MediaImage
                    image={photo}
                    sizes="(min-width: 1024px) 60vh, (min-width: 640px) 60vw, 85vw"
                  />
                </div>
              </div>
              {photo.caption && (
                <figcaption className="mt-3 max-w-xs text-sm text-plum-950/65">{photo.caption}</figcaption>
              )}
            </figure>
          ))}
        </HorizontalScroll>
      ) : (
        <Container className="pt-12 pb-[clamp(5rem,3rem+8vw,9.5rem)]">
          <EmptyState
            icon="image"
            title="Photos are on the way"
            description="Pictures from services and events will appear here once they are added to the gallery."
          />
        </Container>
      )}
    </Section>
  );
}
