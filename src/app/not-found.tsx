import { Aurora } from "@/components/animations/Aurora";
import { Reveal } from "@/components/animations/Reveal";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Page not found | The Triumphant Family",
  robots: { index: false },
};

/**
 * Global 404. Renders the full site chrome itself because unmatched URLs are
 * rendered outside the (site) layout.
 */
export default function NotFound() {
  return (
    <SiteChrome>
      <section className="surface-dark relative isolate flex min-h-svh items-center overflow-hidden bg-plum-950 pt-24 pb-[calc(4rem+var(--radius-sheet))]">
        <Aurora />
        <div className="container-site">
          <Reveal trigger="load">
            <p className="eyebrow mb-5 text-plum-300">Error 404</p>
            <h1 className="text-display-lg max-w-4xl font-bold">This page could not be found</h1>
            <p className="mt-8 max-w-xl text-lead text-plum-200">
              The link may be old, or the page may have moved. Let’s get you back home.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/" variant="white" icon="arrowRight">
                Go to the home page
              </Button>
              <Button href="/contact" variant="glass">
                Contact us
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteChrome>
  );
}
