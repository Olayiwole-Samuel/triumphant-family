import { Suspense } from "react";
import { Container, Section } from "@/components/layout/Section";
import { PageIntro } from "@/components/layout/PageIntro";
import { SermonArchive, SermonArchiveSkeleton } from "@/components/sections/sermons/SermonArchive";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sermons",
  description:
    "Search and watch sermons from The Triumphant Family — by title, speaker, topic or scripture. Video and audio messages.",
  path: "/sermons",
});

/**
 * Sermon archive. The header is static; the archive reads the URL
 * (search/filter/page) and streams in behind a skeleton.
 */
export default function SermonsPage(props: PageProps<"/sermons">) {
  return (
    <>
      <PageIntro
        eyebrow="Sermons"
        title="Messages that build faith"
        intro="Search the library by title, speaker, topic or scripture — then watch or listen."
      />
      <Section tone="canvas" sheet>
        <Container>
          <Suspense fallback={<SermonArchiveSkeleton />}>
            <SermonArchive searchParams={props.searchParams} />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
