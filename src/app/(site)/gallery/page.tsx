import { Aurora } from "@/components/animations/Aurora";
import { ImageReveal } from "@/components/animations/ImageReveal";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { Container, Section } from "@/components/layout/Section";
import { MediaImage } from "@/components/media/MediaImage";
import { GalleryBrowser } from "@/components/sections/gallery/GalleryBrowser";
import { EmptyState } from "@/components/ui/States";
import { getGalleryAlbums } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Gallery",
  description:
    "Photos from worship services, gatherings and events at The Triumphant Family.",
  path: "/gallery",
});

/** Gallery: compact hero → featured photo → album chapters with a lightbox. */
export default async function GalleryPage() {
  const albums = (await getGalleryAlbums(24, 60)).filter((album) => album.images.length > 0);
  const featured = albums.find((album) => album.featured) ?? albums[0];

  return (
    <>
      <header className="surface-dark relative isolate overflow-hidden bg-plum-950 pt-32 pb-[calc(3rem+var(--radius-sheet))] md:pt-40 md:pb-[calc(4rem+var(--radius-sheet))]">
        <Aurora />
        <div className="container-site">
          <Reveal as="p" trigger="load" y={12} className="eyebrow mb-4 text-plum-300">
            Gallery
          </Reveal>
          <SplitText as="h1" trigger="load" delay={0.1} className="text-display-lg max-w-4xl font-bold">
            Moments from the family
          </SplitText>
          <Reveal as="p" trigger="load" delay={0.4} y={16} className="mt-5 max-w-xl text-lead text-plum-200">
            Worship, celebration and fellowship — the people and moments that make us a family.
          </Reveal>
        </div>
      </header>

      <Section tone="canvas" sheet className="pt-[calc(var(--radius-sheet)+1.5rem)]!">
        <Container>
          {albums.length === 0 ? (
            <EmptyState
              icon="image"
              title="Photos are on the way"
              description="Pictures from services and events will be shared here soon."
            />
          ) : (
            <>
              {featured?.coverImage && (
                <a href={`#album-${featured.slug}`} className="group mb-20 block">
                  <ImageReveal className="relative aspect-[16/9] shadow-float md:aspect-[21/9]">
                    <MediaImage
                      image={featured.coverImage}
                      sizes="(min-width: 1408px) 1340px, 100vw"
                      priority
                      className="transition-transform duration-1000 ease-out-expo group-hover:scale-[1.02]"
                    />
                  </ImageReveal>
                  <p className="mt-4 flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold">{featured.title}</span>
                    <span className="text-plum-600">View album ↓</span>
                  </p>
                </a>
              )}
              <GalleryBrowser albums={albums} />
            </>
          )}
        </Container>
      </Section>
    </>
  );
}
