import { Stagger } from "@/components/animations/Stagger";
import { Container, Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/States";
import { formatTimeRange, weekdayLabel } from "@/lib/utils/format";
import type { ServiceTime } from "@/types/content";

type ServiceTimesSectionProps = {
  services: ServiceTime[];
  /** Church address from Church Information, shown as the gathering place. */
  address?: string;
  mapUrl?: string;
  youtubeChannelUrl?: string;
  title?: string;
  /** Slide over the dark section above. */
  sheet?: boolean;
  tone?: "canvas" | "white";
};

/**
 * The weekly gathering schedule as an iOS-style grouped list. Times are the
 * church's local time (Africa/Lagos, WAT). Minimal motion: this is information
 * people need to read quickly.
 */
export function ServiceTimesSection({
  services,
  address,
  mapUrl,
  youtubeChannelUrl,
  title = "Join us this week, in person or online",
  sheet,
  tone = "canvas",
}: ServiceTimesSectionProps) {
  return (
    <Section tone={tone} sheet={sheet}>
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SectionHeading eyebrow="Gather with us" title={title} />
          <p className="mt-6 flex items-center gap-2 text-sm text-plum-950/60">
            <Icon name="clock" size={16} className="text-plum-400" />
            All times are West Africa Time (Lagos, WAT).
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {youtubeChannelUrl && (
              <Button href={youtubeChannelUrl} variant="primary" icon="arrowUpRight">
                Watch on YouTube
              </Button>
            )}
            {mapUrl && (
              <Button href={mapUrl} variant="tinted" icon="mapPin" iconFirst>
                Get directions
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          {services.length ? (
            <Stagger
              as="ul"
              y={20}
              className="squircle overflow-hidden rounded-card bg-white shadow-card"
            >
              {services.map((service) => (
                <li key={service.id} className="group relative">
                  <div className="flex items-start gap-4 px-5 py-5 md:px-6">
                    <span className="squircle grid size-14 shrink-0 place-items-center rounded-2xl bg-plum-100 text-plum-700">
                      <span className="text-[0.6875rem] leading-none font-bold tracking-wide uppercase">
                        {weekdayLabel(service.day).slice(0, 3)}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="text-[1.0625rem] font-semibold tracking-tight">
                          {service.title}
                        </h3>
                        <SampleBadge show={service.isSample} className="text-plum-600" />
                      </div>
                      <p className="mt-1 text-sm text-plum-950/70">
                        {weekdayLabel(service.day)} ·{" "}
                        {formatTimeRange(service.startTime, service.endTime)} WAT
                      </p>
                      {service.location && (
                        <p className="mt-0.5 text-sm text-plum-950/60">{service.location}</p>
                      )}
                      {service.description && (
                        <p className="mt-2 text-sm text-plum-950/60">{service.description}</p>
                      )}
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    className="absolute right-0 bottom-0 left-[5.5rem] h-px bg-plum-100 group-last:hidden"
                  />
                </li>
              ))}
              {address && (
                <li className="flex items-start gap-4 border-t border-plum-100 bg-plum-50/60 px-5 py-5 md:px-6">
                  <span className="squircle grid size-14 shrink-0 place-items-center rounded-2xl bg-plum-600 text-white">
                    <Icon name="mapPin" size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-plum-950/60">Where we gather</h3>
                    <address className="mt-1 font-semibold whitespace-pre-line not-italic">
                      {address}
                    </address>
                  </div>
                </li>
              )}
            </Stagger>
          ) : (
            <EmptyState
              icon="clock"
              title="Service times are being updated"
              description="Our gathering schedule will appear here shortly. In the meantime, join us on YouTube."
            />
          )}
        </div>
      </Container>
    </Section>
  );
}
