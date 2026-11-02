import { Stagger } from "@/components/animations/Stagger";
import { Container, Section } from "@/components/layout/Section";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/States";
import type { Belief } from "@/types/content";

/** "What we believe", in the order set in the Studio. */
export function BeliefsSection({ beliefs, isSample }: { beliefs: Belief[]; isSample?: boolean }) {
  return (
    <Section tone="canvas" sheet>
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading eyebrow="What we believe" title="The foundations of our faith" />
          <SampleBadge show={isSample} className="self-start text-plum-600 md:self-end" />
        </div>

        {beliefs.length ? (
          <Stagger as="ol" variant="tilt" className="mt-14 grid gap-4 md:mt-20 md:grid-cols-2">
            {beliefs.map((belief, index) => (
              <li
                key={`${belief.title}-${index}`}
                className="squircle flex gap-5 rounded-card bg-white p-6 shadow-card md:p-8"
              >
                <span
                  aria-hidden="true"
                  className="scripture shrink-0 text-5xl leading-none text-plum-300 tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{belief.title}</h3>
                  {belief.description && (
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-plum-950/70">
                      {belief.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            className="mt-14"
            icon="heart"
            title="Our statement of faith is coming soon"
            description="The core beliefs of the ministry will be listed here."
          />
        )}
      </Container>
    </Section>
  );
}
