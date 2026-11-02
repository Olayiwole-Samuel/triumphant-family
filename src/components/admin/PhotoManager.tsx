"use client";

/* eslint-disable @next/next/no-img-element -- admin previews show the original upload */

import { useRef, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { thumbUrl } from "@/lib/admin/thumb";
import { uploadFile, UploadError } from "@/lib/admin/upload-client";
import type { StoredImage } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";
import { inputClass } from "./fields";
import { IconButton } from "./media-fields";

type Photo = { id: string; image: StoredImage };

type PhotoManagerProps = {
  albumId: string | null;
  photos: Photo[];
  coverPhotoId?: string | null;
  /** Creates the album on first upload (event photos). */
  ensureAlbum?: () => Promise<string>;
  actions: {
    addPhotos: (albumId: string, images: StoredImage[]) => Promise<Photo[]>;
    describePhoto: (photoId: string, alt: string, caption: string) => Promise<void>;
    deletePhoto: (photoId: string) => Promise<void>;
    reorderPhotos: (albumId: string, ids: string[]) => Promise<void>;
    setCoverPhoto: (albumId: string, photoId: string) => Promise<void>;
  };
};

/**
 * Upload many photos at once; describe, reorder, choose the cover, delete.
 * Every change is saved immediately (no Save button needed).
 */
export function PhotoManager({ albumId: initialAlbumId, photos: initial, coverPhotoId, ensureAlbum, actions }: PhotoManagerProps) {
  const [albumId, setAlbumId] = useState(initialAlbumId);
  const [photos, setPhotos] = useState(initial);
  const [cover, setCover] = useState(coverPhotoId ?? null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [armed, setArmed] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadAll(files: File[]) {
    setProblems([]);
    setProgress({ done: 0, total: files.length });
    let id = albumId;
    try {
      if (!id && ensureAlbum) {
        id = await ensureAlbum();
        setAlbumId(id);
      }
    } catch {
      setProgress(null);
      return setProblems(["The photo album couldn't be created. Please try again."]);
    }
    if (!id) return setProgress(null);

    const failed: string[] = [];
    // Upload in small batches and save each batch, so a long upload is never lost.
    for (let index = 0; index < files.length; index += 4) {
      const batch = files.slice(index, index + 4);
      const uploaded = await Promise.all(
        batch.map(async (file): Promise<StoredImage | null> => {
          try {
            const result = await uploadFile(file, "image");
            return { url: result.url, alt: "", width: result.width, height: result.height, publicId: result.publicId };
          } catch (error) {
            failed.push(`${file.name}: ${error instanceof UploadError ? error.message : "upload failed"}`);
            return null;
          } finally {
            setProgress((current) => current && { ...current, done: current.done + 1 });
          }
        }),
      );
      const images = uploaded.filter((image): image is StoredImage => Boolean(image));
      if (images.length) {
        const saved = await actions.addPhotos(id, images);
        setPhotos((current) => [...current, ...saved]);
      }
    }
    setProgress(null);
    setProblems(failed);
    setStatus(`${files.length - failed.length} photo${files.length - failed.length === 1 ? "" : "s"} added.`);
  }

  function move(index: number, by: number) {
    const next = [...photos];
    const [photo] = next.splice(index, 1);
    next.splice(index + by, 0, photo);
    setPhotos(next);
    if (albumId) startTransition(() => actions.reorderPhotos(albumId, next.map((p) => p.id)));
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        aria-label="Choose photos to upload"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) uploadAll(files);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={Boolean(progress)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-plum-600 px-5 text-sm font-semibold text-white hover:bg-plum-700 disabled:opacity-60"
        >
          <Icon name="upload" size={16} />
          {progress ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : "Upload photos"}
        </button>
        <p className="text-sm text-plum-950/55" aria-live="polite">
          {progress ? "Keep this page open until the upload finishes." : status || `${photos.length} photo${photos.length === 1 ? "" : "s"}`}
        </p>
      </div>
      {progress && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-plum-100">
          <div className="h-full rounded-full bg-plum-600 transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
      )}
      {problems.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-200">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      {photos.length > 0 ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => {
            const isCover = cover ? cover === photo.id : index === 0;
            return (
              <li key={photo.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-plum-950/10">
                <div className="relative aspect-square bg-plum-100">
                  <img src={thumbUrl(photo.image.url, 400)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                  {isCover && <span className="absolute top-2 left-2 rounded-full bg-plum-950/75 px-2.5 py-1 text-xs font-semibold text-white">Cover</span>}
                </div>
                <div className="space-y-2 p-2">
                  <input
                    defaultValue={photo.image.alt}
                    placeholder="Describe the photo"
                    aria-label={`Description for photo ${index + 1}`}
                    maxLength={300}
                    onBlur={(event) => {
                      const alt = event.target.value;
                      if (alt === photo.image.alt) return;
                      setPhotos((current) => current.map((p) => (p.id === photo.id ? { ...p, image: { ...p.image, alt } } : p)));
                      startTransition(() => actions.describePhoto(photo.id, alt, photo.image.caption ?? ""));
                      setStatus("Description saved.");
                    }}
                    className={cn(inputClass, "px-2.5 py-2 text-sm")}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-y-1">
                    <span className="flex">
                      <IconButton label="Move earlier" icon="chevronLeft" disabled={index === 0} onClick={() => move(index, -1)} />
                      <IconButton label="Move later" icon="chevronRight" disabled={index === photos.length - 1} onClick={() => move(index, 1)} />
                      {!isCover && albumId && (
                        <IconButton
                          label="Use as cover"
                          icon="image"
                          onClick={() => {
                            setCover(photo.id);
                            startTransition(() => actions.setCoverPhoto(albumId, photo.id));
                            setStatus("Cover photo changed.");
                          }}
                        />
                      )}
                    </span>
                    {armed === photo.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotos((current) => current.filter((p) => p.id !== photo.id));
                          setArmed(null);
                          startTransition(() => actions.deletePhoto(photo.id));
                          setStatus("Photo deleted.");
                        }}
                        className="min-h-9 rounded-full bg-danger-600 px-3 text-xs font-semibold text-white"
                      >
                        Delete?
                      </button>
                    ) : (
                      <IconButton label="Delete photo" icon="trash" danger onClick={() => setArmed(photo.id)} />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        !progress && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-5 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-plum-950/15 bg-white px-4 py-10 text-center hover:border-plum-400"
          >
            <Icon name="image" size={22} className="text-plum-600" />
            <span className="text-sm font-semibold text-plum-800">No photos yet — tap to upload</span>
            <span className="text-[0.8125rem] text-plum-950/55">You can choose many photos at once.</span>
          </button>
        )
      )}
    </div>
  );
}
