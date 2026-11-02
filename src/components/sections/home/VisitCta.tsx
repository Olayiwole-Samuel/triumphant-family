import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { Container, Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatTime, weekdayLabel } from "@/lib/utils/format";
import type { ServiceTime, SiteSettings } from "@/types/content";

/**
 * The closing invitation for new visitors. Shows the location and first
 * service only when they are configured in the Studio.
 */
export function VisitCta({ settings, service }: { settings: SiteSettings; service?: ServiceTime }) {
  return (
    <Section tone="canvas">
      <Container className="grid gap-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <Reveal as="p" y={12} className="eyebrow mb-4 text-plum-600">
            Your first visit
          </Reveal>
          <SplitText as="h2" className="text-display-lg font-bold">
            Come as you are. Leave as family.
          </SplitText>
          <Reveal as="p" y={16} delay={0.15} className="mt-6 max-w-xl text-lead text-plum-950/70">
            Whether it’s your first Sunday or you’re joining online from another city, we’d
            love to meet you, pray with you and help you find your place.
          </Reveal>
          <Reveal y={16} delay={0.25} className="mt-10 flex flex-wrap gap-3">
            <Button href="/contact" variant="primary" size="lg" icon="arrowRight" magnetic>
              Plan your visit
            </Button>
            {settings.mapUrl && (
              <Button href={settings.mapUrl} variant="tinted" size="lg" icon="mapPin" iconFirst>
                Get directions
              </Button>
            )}
          </Reveal>
        </div>

        {(settings.address || service) && (
          <Reveal delay={0.2} className="lg:col-span-4 lg:col-start-9">
            <dl className="squircle space-y-5 rounded-card bg-white p-6 shadow-card md:p-8">
              {service && (
                <div className="flex gap-4">
                  <Icon name="clock" size={20} className="mt-0.5 shrink-0 text-plum-500" />
                  <div>
                    <dt className="text-sm text-plum-950/60">{service.title}</dt>
                    <dd className="mt-0.5 font-semibold">
                      {weekdayLabel(service.day)}s · {formatTime(service.startTime)} WAT
                    </dd>
                  </div>
                </div>
              )}
              {settings.address && (
                <div className="flex gap-4">
                  <Icon name="mapPin" size={20} className="mt-0.5 shrink-0 text-plum-500" />
                  <div>
                    <dt className="text-sm text-plum-950/60">Where we gather</dt>
                    <dd className="mt-0.5 font-semibold whitespace-pre-line">{settings.address}</dd>
                  </div>
                </div>
              )}
            </dl>
          </Reveal>
        )}
      </Container>
    </Section>
  );
}
