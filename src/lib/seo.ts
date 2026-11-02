import type { Metadata } from "next";
import type { SiteSettings } from "@/types/content";
import { SITE_URL } from "./site";

/**
 * SEO foundation. The root layout builds site-wide defaults from the CMS;
 * each page then only needs to export its own title/description:
 *
 *   export const metadata = pageMetadata({
 *     title: "Sermons",
 *     description: "…",
 *     path: "/sermons",
 *   });
 */
export function buildRootMetadata(settings: SiteSettings): Metadata {
  const title = settings.tagline
    ? `${settings.churchName} — ${settings.tagline}`
    : settings.churchName;
  const description =
    settings.description ??
    `${settings.churchName}${settings.ministryName ? ` — ${settings.ministryName}` : ""}.`;
  const shareImage = settings.shareImage?.url;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${settings.churchName}`,
    },
    description,
    applicationName: settings.churchName,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "en_NG",
      siteName: settings.churchName,
      title,
      description,
      url: "/",
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title,
      description,
      images: shareImage ? [shareImage] : undefined,
    },
    icons: settings.favicon?.url
      ? { icon: settings.favicon.url, apple: settings.favicon.url }
      : undefined,
  };
}

type PageMetadataInput = {
  title: string;
  description?: string;
  /** Path of the page, e.g. "/sermons". Used for the canonical URL. */
  path: string;
  image?: string;
};

export function pageMetadata({ title, description, path, image }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { title, description, images: image ? [image] : undefined },
  };
}
