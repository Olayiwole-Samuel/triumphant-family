import { Stagger } from "@/components/animations/Stagger";
import { Container, Section } from "@/components/layout/Section";
import { MediaImage } from "@/components/media/MediaImage";
import { Button } from "@/components/ui/Button";
import { Gleam } from "@/components/ui/Gleam";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/utils/cn";
import type { Leader } from "@/types/content";

/**
 * A leader. With a photo: portrait card. Without one (no photo uploaded, or
 * "Show photo" switched off): a deliberate text-first card — never an empty
 * frame or an automatic placeholder portrait.
 */
export function LeaderCard({ leader, fullBio = false }: { leader: Leader; fullBio?: boolean }) {
  return (
    <article className="squircle group flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card">
      {leader.photo ? (
        <div className="relative aspect-[4/5] overflow-hidden bg-plum-100">
          <MediaImage
            image={leader.photo}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="transition-transform duration-1000 ease-out-expo group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div className="px-6 pt-7 md:px-7">
          <Gleam className="size-6 text-plum-300" />
        </div>
      )}
      <div className={cn("flex flex-1 flex-col px-6 pb-7 md:px-7", leader.photo ? "pt-6" : "pt-5")}>
        <p className="text-sm font-semibold text-plum-600">{leader.role}</p>
        <h3 className={cn("mt-1 font-bold tracking-tight", leader.photo ? "text-xl" : "text-2xl")}>
          {leader.name}
        </h3>
        {leader.bio && (
          <p className={cn("mt-3 text-[0.9375rem] leading-relaxed text-plum-950/70", !fullBio && "line-clamp-4")}>
            {leader.bio}
          </p>
        )}
        <SampleBadge show={leader.isSample} className="mt-5 self-start text-plum-950/60" />
      </div>
    </article>
  );
}

type LeadershipSectionProps = {
  leaders: Leader[];
  /** Preview (home): first three leaders + link to /about. Full (about): everyone. */
  variant?: "preview" | "full";
  tone?: "white" | "canvas";
  sheet?: boolean;
};

export function LeadershipSection({
  leaders,
  variant = "preview",
  tone = "white",
  sheet,
}: LeadershipSectionProps) {
  const isPreview = variant === "preview";
  const shown = isPreview ? leaders.slice(0, 3) : leaders;

  return (
    <Section tone={tone} sheet={sheet}>
      <Container>
        <SectionHeading
          eyebrow="Leadership"
          title={isPreview ? "Shepherds of the family" : "The people who serve this family"}
          intro={
            isPreview
              ? undefined
              : "Called to serve, teach and care — meet the leaders of the ministry."
          }
          action={
            isPreview && leaders.length > 0 ? (
              <Button href="/about" variant="tinted" icon="arrowRight">
                Meet our leaders
              </Button>
            ) : undefined
          }
        />

        {shown.length ? (
          <Stagger
            as="ul"
            variant="tilt"
            className="mt-14 grid gap-4 sm:grid-cols-2 md:mt-20 lg:grid-cols-3"
          >
            {shown.map((leader) => (
              <li key={leader.id}>
                <LeaderCard leader={leader} fullBio={!isPreview} />
              </li>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            className="mt-14"
            icon="users"
            title="Leadership profiles are coming soon"
            description="Introductions to the people who lead the ministry will appear here."
          />
        )}
      </Container>
    </Section>
  );
}
