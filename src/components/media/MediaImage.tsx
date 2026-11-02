"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaImage as MediaImageData } from "@/types/content";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils/cn";
import { MediaPlaceholder } from "./MediaPlaceholder";

type MediaImageProps = {
  image?: MediaImageData;
  /** Responsive `sizes` hint — be accurate, it controls the download size. */
  sizes: string;
  /** Only for the largest above-the-fold image on a page. */
  priority?: boolean;
  quality?: number;
  className?: string;
  /** Caption for the placeholder shown when no image exists yet. */
  placeholderLabel?: string;
  placeholderTone?: "deep" | "plum" | "soft";
};

/**
 * Renders a CMS image filling its (positioned, sized) parent, honouring the
 * editor's focal point. Falls back to a branded placeholder when there is no
 * image, or when the image fails to load.
 *
 * Cloudinary images are resized by Cloudinary's CDN (width, quality and
 * automatic WebP/AVIF in the URL); other images (local uploads during
 * development, YouTube thumbnails) go through the Next.js optimiser.
 *
 * The parent must be `relative` with a defined size or aspect ratio.
 */
export function MediaImage({
  image,
  sizes,
  priority = false,
  quality = 80,
  className,
  placeholderLabel,
  placeholderTone,
}: MediaImageProps) {
  // Remember which URL failed, so a new image (e.g. after navigation) gets a fresh try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!image || failedUrl === image.url) {
    return (
      <MediaPlaceholder
        label={image ? "Photo unavailable" : placeholderLabel}
        tone={placeholderTone}
        className={className}
      />
    );
  }

  const objectPosition = image.focalPoint
    ? `${image.focalPoint.x * 100}% ${image.focalPoint.y * 100}%`
    : undefined;

  return (
    <Image
      src={image.url}
      alt={image.alt}
      fill
      sizes={sizes}
      quality={quality}
      preload={priority}
      loader={isCloudinaryUrl(image.url) ? cloudinaryLoader : undefined}
      placeholder={image.blurDataUrl ? "blur" : "empty"}
      blurDataURL={image.blurDataUrl}
      className={cn("object-cover", className)}
      style={{ objectPosition }}
      onError={() => setFailedUrl(image.url)}
    />
  );
}
