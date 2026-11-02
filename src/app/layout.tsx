import type { Metadata, Viewport } from "next";
import { Cormorant, Mona_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Typography — two families:
 * - Mona Sans (GitHub's variable typeface): headlines use its wider widths for a
 *   cinematic, confident feel; body text uses the normal width for readability.
 * - Cormorant (italic): a royal Garamond-style serif reserved for scripture and
 *   moments of emphasis.
 * Both include the latin-ext + vietnamese subsets, which cover Yoruba/Igbo
 * diacritics (ẹ, ọ, ṣ…).
 */
const sans = Mona_Sans({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-mona",
  axes: ["wdth"],
  display: "swap",
});

const serif = Cormorant({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-cormorant",
  style: ["italic", "normal"],
  display: "swap",
});

/** Static defaults only. CMS-driven SEO lives in the (site) layout. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export const viewport: Viewport = {
  themeColor: "#1A0614",
  colorScheme: "light",
};

/**
 * Runs before first paint: enables entrance animations only when motion is
 * allowed, and removes the gate after 3s if the animation system never starts
 * (e.g. a script failed to load) so content is never left hidden.
 */
const MOTION_GATE = `(function(){var d=document.documentElement;if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('motion-ok');setTimeout(function(){if(!d.dataset.motionReady)d.classList.remove('motion-ok')},3000)}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_GATE }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
