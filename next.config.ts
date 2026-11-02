import path from "node:path";
import type { NextConfig } from "next";

/** The local development database (scripts/with-db.mjs) serves one process at a time. */
const localDatabase = /@(127\.0\.0\.1|localhost)[:/]/.test(process.env.DATABASE_URL ?? "");

const nextConfig: NextConfig = {
  // Next.js 16 rendering model: pages are prerendered into a static shell and
  // data functions opt into caching with "use cache" (see src/lib/content/index.ts).
  cacheComponents: true,
  partialPrefetching: true,
  // Local builds: a single build worker, so only one process uses the local database.
  ...(localDatabase ? { experimental: { cpus: 1 } } : {}),
  reactCompiler: true,
  turbopack: {
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Qualities used by MediaImage (80) and the gallery lightbox (85).
    qualities: [75, 80, 85],
    remotePatterns: [
      // Cloudinary (uploaded images)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // YouTube thumbnails
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "i1.ytimg.com" },
      { protocol: "https", hostname: "i2.ytimg.com" },
      { protocol: "https", hostname: "i3.ytimg.com" },
      { protocol: "https", hostname: "i4.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

export default nextConfig;
