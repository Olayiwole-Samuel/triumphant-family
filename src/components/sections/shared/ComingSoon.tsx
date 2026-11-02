import { Reveal } from "@/components/animations/Reveal";
import { Container, Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { GleamTile } from "@/components/ui/Gleam";

type ComingSoonProps = {
  message: string;
  youtubeChannelUrl?: string;
};

/** Holding panel for pages whose full experience arrives in a later phase. */
export function ComingSoon({ message, youtubeChannelUrl }: ComingSoonProps) {
  return (
    <Section tone="canvas" sheet>
      <Container>
        <Reveal className="squircle max-w-3xl rounded-card bg-white p-8 shadow-card md:p-12">
          <GleamTile className="size-12" />
          <p className="mt-6 text-sm font-semibold text-plum-600">Coming soon</p>
          <p className="mt-2 text-display-sm font-bold">{message}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            {youtubeChannelUrl && (
              <Button href={youtubeChannelUrl} variant="primary" icon="arrowUpRight">
                Watch on YouTube
              </Button>
            )}
            <Button href="/" variant="tinted">
              Back to home
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
