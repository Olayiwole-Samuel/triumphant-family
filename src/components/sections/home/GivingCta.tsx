import { Aurora } from "@/components/animations/Aurora";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { Container, Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Gleam } from "@/components/ui/Gleam";
import type { GivingSettings } from "@/types/content";

const DEFAULT_COPY =
  "Every gift helps us worship, teach the Word and care for our family and community — online and in person.";

/**
 * A warm invitation to give, visually distinct from the rest of the page (a
 * deep plum panel with a soft glow). Links to /give — no payment happens here.
 */
export function GivingCta({ giving }: { giving: GivingSettings }) {
  if (!giving.active) return null;

  return (
    <Section tone="white">
      <Container>
        <div className="squircle surface-dark relative isolate overflow-hidden rounded-[2.5rem] bg-plum-900 px-6 py-16 text-center shadow-float sm:px-12 md:py-24">
          <Aurora className="opacity-80" />
          <Reveal y={16}>
            <Gleam className="mx-auto size-10 text-plum-200" />
          </Reveal>
          <SplitText as="h2" className="mx-auto mt-8 max-w-3xl text-display-md font-bold">
            {giving.heading ?? "Partner with what God is doing"}
          </SplitText>
          <Reveal y={16} delay={0.15} as="p" className="mx-auto mt-6 max-w-xl text-lead text-plum-200">
            {giving.introduction ?? DEFAULT_COPY}
          </Reveal>
          <Reveal y={16} delay={0.25} className="mt-10 flex justify-center">
            <Button href="/give" variant="white" size="lg" icon="heart" iconFirst magnetic>
              Ways to give
            </Button>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
