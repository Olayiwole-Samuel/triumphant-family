import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/animations/SmoothScroll";
import { Footer } from "@/components/footer/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { getSiteSettings } from "@/lib/content";

/**
 * Everything around the page content on the public site: smooth scrolling,
 * skip link, header and footer. Used by the (site) layout and the global
 * not-found page. (The admin at /admin has its own layout.)
 */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <SmoothScroll>
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-full bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-ink focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <Navbar
        churchName={settings.churchName}
        ministryName={settings.ministryName}
        logo={settings.logo}
        socialLinks={settings.socialLinks}
        contactEmail={settings.contactEmail}
      />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer settings={settings} />
    </SmoothScroll>
  );
}
