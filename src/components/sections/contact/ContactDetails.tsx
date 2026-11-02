import { Icon, SocialIcon, SOCIAL_LABELS, type IconName } from "@/components/ui/Icon";
import type { SiteSettings } from "@/types/content";

type DetailRow = { icon: IconName; label: string; value: string; href?: string; external?: boolean };

/**
 * Contact information from Church Information, as iOS-style grouped rows.
 * Only details that have been entered in the Studio are shown — nothing is
 * invented.
 */
export function ContactDetails({ settings }: { settings: SiteSettings }) {
  const rows: DetailRow[] = [];
  if (settings.contactEmail) {
    rows.push({ icon: "mail", label: "Email", value: settings.contactEmail, href: `mailto:${settings.contactEmail}` });
  }
  if (settings.phone) {
    rows.push({ icon: "phone", label: "Phone", value: settings.phone, href: `tel:${settings.phone.replace(/[^\d+]/g, "")}` });
  }
  if (settings.address) {
    rows.push({ icon: "mapPin", label: "Address", value: settings.address, href: settings.mapUrl, external: true });
  }
  if (settings.officeHours) {
    rows.push({ icon: "clock", label: "Office hours", value: settings.officeHours });
  }

  return (
    <div className="space-y-8">
      {rows.length > 0 ? (
        <ul className="squircle overflow-hidden rounded-card bg-white shadow-card">
          {rows.map((row) => {
            const content = (
              <>
                <span className="squircle grid size-11 shrink-0 place-items-center rounded-xl bg-plum-600 text-white">
                  <Icon name={row.icon} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-plum-950/60">{row.label}</span>
                  <span className="mt-0.5 block font-semibold break-words whitespace-pre-line">{row.value}</span>
                </span>
                {row.href && <Icon name="arrowUpRight" size={18} className="shrink-0 text-plum-300" />}
              </>
            );
            const rowClass = "flex items-center gap-4 px-5 py-4 md:px-6";
            return (
              <li key={row.label} className="group relative">
                {row.href ? (
                  <a
                    href={row.href}
                    className={`${rowClass} transition-colors duration-300 hover:bg-plum-50 active:bg-plum-100`}
                    {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {content}
                    {row.external && <span className="sr-only">(opens map in a new tab)</span>}
                  </a>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
                <span aria-hidden="true" className="absolute right-0 bottom-0 left-[4.75rem] h-px bg-plum-100 group-last:hidden" />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="squircle rounded-card bg-white p-6 shadow-card md:p-8">
          <p className="font-semibold">Contact details are being updated</p>
          <p className="mt-2 text-sm text-plum-950/65">
            {settings.isSample
              ? "Preview mode: add the email, phone, address and office hours in the Studio (Church Information → Contact)."
              : "Please use the form to send us a message — we’ll reply by email."}
          </p>
        </div>
      )}

      {settings.socialLinks.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-plum-950/60">Follow along</h3>
          <ul className="flex flex-wrap gap-2">
            {settings.socialLinks.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-card transition-[background-color,scale] hover:bg-plum-100 active:scale-95"
                >
                  <SocialIcon platform={link.platform} size={18} className="text-plum-600" />
                  {link.label || SOCIAL_LABELS[link.platform]}
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
