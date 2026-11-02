"use client";

import { useRef, useState } from "react";
import { Stagger } from "@/components/animations/Stagger";
import { MediaImage } from "@/components/media/MediaImage";
import { Icon } from "@/components/ui/Icon";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { GalleryAlbum } from "@/types/content";
import { Lightbox } from "./Lightbox";

const ratio = (width?: number, height?: number) =>
  width && height ? Math.min(1.9, Math.max(0.55, width / height)) : 4 / 5;

/**
 * Albums as editorial "chapters": a header, then a masonry of photos that
 * keep their own proportions (space is reserved from each photo's
 * dimensions, so nothing jumps while loading). Photos open in the lightbox.
 * Category chips appear only when albums use at least two categories.
 */
export function GalleryBrowser({ albums }: { albums: GalleryAlbum[] }) {
  const categories = [...new Set(albums.map((album) => album.category?.trim()).filter(Boolean))] as string[];
  const [category, setCategory] = useState<string | null>(null);
  const [open, setOpen] = useState<{ albumId: string; index: number } | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  /** The photo button that opened the lightbox — focus returns here on close. */
  const opener = useRef<string | null>(null);

  const visible = category ? albums.filter((album) => album.category?.trim() === category) : albums;
  const openAlbum = open ? albums.find((album) => album.id === open.albumId) : undefined;

  const close = () => {
    const key = opener.current;
    setOpen(null);
    requestAnimationFrame(() => (key ? triggers.current.get(key)?.focus() : undefined));
  };

  return (
    <>
      {categories.length >= 2 && (
        <div role="group" aria-label="Filter by category" className="mb-12 flex flex-wrap gap-2">
          {[null, ...categories].map((value) => (
            <button
              key={value ?? "all"}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={cn(
                "h-11 rounded-full px-5 text-sm font-semibold transition-colors",
                category === value ? "bg-plum-600 text-white" : "bg-white text-plum-950 shadow-card hover:bg-plum-100",
              )}
            >
              {value ?? "All photos"}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-20 md:space-y-28">
        {visible.map((album) => {
          const meta = [
            album.date ? formatDate(album.date) : null,
            album.category,
            album.eventTitle,
            `${album.imageCount} ${album.imageCount === 1 ? "photo" : "photos"}`,
          ].filter(Boolean);
          return (
            <section key={album.id} id={`album-${album.slug}`} aria-labelledby={`album-title-${album.id}`} className="scroll-mt-28">
              <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <h2 id={`album-title-${album.id}`} className="text-display-sm font-bold">
                    {album.title}
                  </h2>
                  <p className="mt-2 text-sm text-plum-950/60">{meta.join("  ·  ")}</p>
                  {album.description && <p className="mt-3 text-plum-950/75">{album.description}</p>}
                </div>
                <SampleBadge show={album.isSample} className="self-start text-plum-600" />
              </div>

              <Stagger y={32} className="columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4">
                {album.images.map((photo, index) => (
                  <figure key={`${photo.url}-${index}`} className="mb-3 break-inside-avoid sm:mb-4">
                    <button
                      type="button"
                      ref={(element) => {
                        const key = `${album.id}:${index}`;
                        if (element) triggers.current.set(key, element);
                        else triggers.current.delete(key);
                      }}
                      onClick={() => {
                        opener.current = `${album.id}:${index}`;
                        setOpen({ albumId: album.id, index });
                      }}
                      className="squircle group relative block w-full overflow-hidden rounded-2xl bg-plum-100"
                      style={{ aspectRatio: ratio(photo.width, photo.height) }}
                    >
                      <MediaImage
                        image={photo}
                        sizes="(min-width: 1280px) 22vw, (min-width: 768px) 31vw, 48vw"
                        className="transition-transform duration-1000 ease-out-expo group-hover:scale-[1.04]"
                      />
                      <span className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-plum-950/60 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        <Icon name="expand" size={16} />
                      </span>
                      <span className="sr-only">
                        Open photo {index + 1} of {album.images.length}
                        {photo.alt ? `: ${photo.alt}` : ""}
                      </span>
                    </button>
                    {photo.caption && (
                      <figcaption className="mt-1.5 text-xs text-plum-950/60">{photo.caption}</figcaption>
                    )}
                  </figure>
                ))}
              </Stagger>
            </section>
          );
        })}
      </div>

      {open && openAlbum && (
        <Lightbox
          photos={openAlbum.images}
          index={open.index}
          title={openAlbum.title}
          onIndexChange={(index) => setOpen({ albumId: openAlbum.id, index })}
          onClose={close}
        />
      )}
    </>
  );
}
