"use client";

import Image from "next/image";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/States";
import { lockScroll } from "@/lib/animations/lenis";
import type { MediaImage } from "@/types/content";

type LightboxProps = {
  photos: MediaImage[];
  index: number;
  /** Album title, used as the dialog's accessible name. */
  title: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

/**
 * Accessible photo lightbox built on the native modal <dialog>:
 * the page behind becomes inert, focus stays inside, Escape closes.
 * Keyboard: ← / → to move between photos. Touch: swipe left/right.
 * Only the current photo is loaded (no eager loading of the whole album).
 */
export function Lightbox({ photos, index, title, onIndexChange, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerStart = useRef<number | null>(null);
  const [status, setStatus] = useState<Record<string, "loaded" | "error">>({});
  const photo = photos[index];
  const count = photos.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    lockScroll(true);
    return () => {
      lockScroll(false);
      if (dialog.open) dialog.close();
    };
  }, []);

  const go = (delta: number) => {
    if (count > 1) onIndexChange((index + delta + count) % count);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") pointerStart.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
  };

  const state = photo ? status[photo.url] : "error";
  const isCloudinary = photo ? isCloudinaryUrl(photo.url) : false;

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${title} — photo viewer`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(1);
        if (event.key === "ArrowLeft") go(-1);
      }}
      onClick={(event) => {
        // A click on the dark backdrop (outside the photo frame) closes.
        if (event.target === event.currentTarget) onClose();
      }}
      data-lenis-prevent
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white backdrop:bg-plum-950/95 motion-safe:animate-[tf-fade-in_250ms_ease-out]"
    >
      <div className="flex h-full flex-col" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="flex items-center justify-between gap-4 px-4 pt-4 sm:px-6">
          <p className="text-sm font-semibold tabular-nums" aria-live="polite">
            {title} · {index + 1} of {count}
          </p>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="grid size-12 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <Icon name="close" size={22} />
            <span className="sr-only">Close photo viewer</span>
          </button>
        </div>

        <div
          className="relative mx-auto my-4 w-full max-w-6xl flex-1 touch-pan-y px-4 sm:px-16"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {photo && state !== "error" && (
            <Image
              key={photo.url}
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(min-width: 1280px) 1152px, 100vw"
              quality={85}
              loader={isCloudinary ? cloudinaryLoader : undefined}
              onLoad={() => setStatus((s) => ({ ...s, [photo.url]: "loaded" }))}
              onError={() => setStatus((s) => ({ ...s, [photo.url]: "error" }))}
              className="object-contain motion-safe:animate-[tf-fade-in_300ms_ease-out]"
              draggable={false}
            />
          )}
          {photo && !state && (
            <div role="status" className="absolute inset-0 grid place-items-center">
              <Spinner />
              <span className="sr-only">Loading photo…</span>
            </div>
          )}
          {state === "error" && (
            <div role="alert" className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <Icon name="image" size={32} className="mx-auto text-plum-300" />
                <p className="mt-3 font-semibold">This photo couldn’t be loaded</p>
                {count > 1 && <p className="mt-1 text-sm text-plum-200">Try the next one.</p>}
              </div>
            </div>
          )}

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute top-1/2 left-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-plum-950/70 transition-colors hover:bg-plum-800 sm:left-0"
              >
                <Icon name="chevronLeft" size={22} />
                <span className="sr-only">Previous photo</span>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute top-1/2 right-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-plum-950/70 transition-colors hover:bg-plum-800 sm:right-0"
              >
                <Icon name="chevronRight" size={22} />
                <span className="sr-only">Next photo</span>
              </button>
            </>
          )}
        </div>

        <div className="min-h-16 px-4 pb-6 text-center sm:px-6">
          {photo?.caption && <p className="mx-auto max-w-2xl text-sm text-plum-100">{photo.caption}</p>}
          {count > 1 && (
            <p className="mt-2 text-xs text-plum-300 sm:hidden">Swipe to see more photos</p>
          )}
        </div>
      </div>
    </dialog>
  );
}
