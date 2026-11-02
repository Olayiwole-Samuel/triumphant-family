import { Aurora } from "@/components/animations/Aurora";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { Container, Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import type { AboutPage } from "@/types/content";

/** The About page's closing invitation. */
export function Invitation({ about }: { about: AboutPage }) {
  return (
    <Section tone="canvas">
      <Container>
        <div className="squircle surface-dark relative isolate overflow-hidden rounded-[2.5rem] bg-plum-950 px-6 py-16 shadow-float sm:px-12 md:px-16 md:py-24">
          <Aurora />
          <SplitText as="h2" className="max-w-3xl text-display-md font-bold">
            {about.invitationHeading ?? "There is a place for you here"}
          </SplitText>
          <Reveal as="p" y={16} delay={0.15} className="mt-6 max-w-xl text-lead text-plum-200">
            {about.invitationBody ??
              "We would love to meet you — at a service, online, or over a conversation."}
          </Reveal>
          <Reveal y={16} delay={0.25} className="mt-10 flex flex-wrap gap-3">
            <Button href="/contact" variant="white" size="lg" icon="arrowRight" magnetic>
              Get in touch
            </Button>
            <Button href="/give" variant="glass" size="lg">
              Support the ministry
            </Button>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
