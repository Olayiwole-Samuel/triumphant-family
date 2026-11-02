import Link from "next/link";
import { cacheLife } from "next/cache";
import { Reveal } from "@/components/animations/Reveal";
import { Button } from "@/components/ui/Button";
import { Icon, SocialIcon, SOCIAL_LABELS } from "@/components/ui/Icon";
import { getServiceTimes } from "@/lib/content";
import { NAV_ITEMS } from "@/lib/site";
import { formatTimeRange, weekdayLabel } from "@/lib/utils/format";
import type { SiteSettings } from "@/types/content";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export async function Footer({ settings }: { settings: SiteSettings }) {
  const services = await getServiceTimes();

  return (
    <footer
      id="site-footer"
      className="surface-dark sheet relative isolate overflow-hidden bg-plum-950 pt-24 pb-10"
    >
      <div
        aria-hidden="true"
        className="absolute -bottom-1/2 left-1/2 -z-10 h-[40rem] w-[80rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(123_45_94/0.55),transparent)]"
      />

      <div className="container-site">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <Reveal y={24}>
            <p className="eyebrow mb-5 text-plum-300">{settings.ministryName ?? "Welcome home"}</p>
            <p className="text-display-lg max-w-4xl font-bold">{settings.churchName}</p>
          </Reveal>
          <div className="flex flex-wrap gap-3">
            <Button href="/give" variant="white" icon="heart" iconFirst>
              Give
            </Button>
            <Button href="/contact" variant="glass">
              Get in touch
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-12 border-t border-white/10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="eyebrow mb-5 text-plum-300">Gather with us</h2>
            {services.length ? (
              <ul className="space-y-4">
                {services.map((service) => (
                  <li key={service.id}>
                    <p className="font-medium">{service.title}</p>
                    <p className="text-sm text-white/60">
                      {weekdayLabel(service.day)} · {formatTimeRange(service.startTime, service.endTime)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/60">Service times coming soon.</p>
            )}
          </div>

          <div>
            <h2 className="eyebrow mb-5 text-plum-300">Visit</h2>
            {settings.address ? (
              <address className="text-sm leading-relaxed whitespace-pre-line text-white/80 not-italic">
                {settings.address}
              </address>
            ) : (
              <p className="text-sm text-white/60">Address coming soon.</p>
            )}
            {settings.mapUrl && (
              <a
                href={settings.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
              >
                <Icon name="mapPin" size={16} /> Get directions
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>

          <div>
            <h2 className="eyebrow mb-5 text-plum-300">Connect</h2>
            <ul className="space-y-3 text-sm">
              {settings.contactEmail && (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} className="inline-flex items-center gap-2 hover:underline">
                    <Icon name="mail" size={16} /> {settings.contactEmail}
                  </a>
                </li>
              )}
              {settings.phone && (
                <li>
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:underline">
                    <Icon name="phone" size={16} /> {settings.phone}
                  </a>
                </li>
              )}
            </ul>
            {settings.socialLinks.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {settings.socialLinks.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${link.label || SOCIAL_LABELS[link.platform]} (opens in a new tab)`}
                      className="grid size-11 place-items-center rounded-full bg-white/10 transition-[background-color,scale] duration-300 hover:bg-white/20 active:scale-90"
                    >
                      <SocialIcon platform={link.platform} size={18} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Footer">
            <h2 className="eyebrow mb-5 text-plum-300">Explore</h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-white/80 hover:text-white hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-20 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>
            © <CopyrightYear /> {settings.churchName}. All rights reserved.
          </p>
          {settings.tagline && <p>{settings.tagline}</p>}
        </div>
      </div>
    </footer>
  );
}
