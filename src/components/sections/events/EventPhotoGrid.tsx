"use client";

import { useState } from "react";
import { MediaImage } from "@/components/media/MediaImage";
import { Icon } from "@/components/ui/Icon";
import type { MediaImage as MediaImageData } from "@/types/content";
import { Lightbox } from "../gallery/Lightbox";

const INITIAL = 12;

/** Event photos: a grid (12 at first, "show all" for the rest) that opens the gallery lightbox. */
export function EventPhotoGrid({ photos, title }: { photos: MediaImageData[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(photos.length <= INITIAL + 4);
  const visible = showAll ? photos : photos.slice(0, INITIAL);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {visible.map((photo, index) => (
          <li key={`${photo.url}-${index}`}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              className="squircle group relative block aspect-square w-full overflow-hidden rounded-2xl bg-plum-100"
            >
              <MediaImage
                image={photo}
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 31vw, 48vw"
                className="transition-transform duration-1000 ease-out-expo group-hover:scale-[1.04]"
              />
              <span className="sr-only">
                Open photo {index + 1} of {photos.length}
                {photo.alt ? `: ${photo.alt}` : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-plum-100 px-5 text-sm font-semibold text-plum-800 hover:bg-plum-200"
        >
          <Icon name="grid" size={16} /> Show all {photos.length} photos
        </button>
      )}
      {open !== null && (
        <Lightbox photos={photos} index={open} title={title} onIndexChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
