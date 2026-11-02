import type { ImageLoaderProps } from "next/image";

/**
 * Cloudinary image delivery (safe to import anywhere).
 *
 * Uploaded images are stored by URL. Cloudinary URLs are resized on
 * Cloudinary's CDN — width, quality and automatic WebP/AVIF are added to the
 * URL — so the Next.js optimiser isn't needed for them. Uploading (which needs
 * the API secret) lives in ./server.ts.
 */

const UPLOAD_SEGMENT = "/image/upload/";

export function isCloudinaryUrl(url: string) {
  return url.startsWith("https://res.cloudinary.com/") && url.includes(UPLOAD_SEGMENT);
}

/** next/image loader for Cloudinary URLs. */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps) {
  const transforms = `f_auto,q_${quality ?? "auto"},c_limit,w_${width}`;
  return src.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transforms}/`);
}
