import type { Metadata } from "next";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { getSiteSettings } from "@/lib/content";
import { buildRootMetadata } from "@/lib/seo";

/** Site-wide SEO defaults (title template, Open Graph…) built from the CMS. */
export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata(await getSiteSettings());
}

/** Layout for every public page. The Studio (/admin) sits outside this group. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome>{children}</SiteChrome>;
}
