"use client";

/* eslint-disable @next/next/no-img-element -- admin previews show the original upload */

import { useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { thumbUrl } from "@/lib/admin/thumb";
import { uploadFile, UploadError, type UploadResult } from "@/lib/admin/upload-client";
import type { StoredImage } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";
import { FieldShell, inputClass } from "./fields";
import { useFieldError, useFormContext } from "./form-context";

const toImage = (result: UploadResult, alt = ""): StoredImage => ({
  url: result.url,
  alt,
  width: result.width,
  height: result.height,
  publicId: result.publicId,
});

const errorMessage = (error: unknown) =>
  error instanceof UploadError ? error.message : "The upload failed. Please try again.";

function UploadProgress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-plum-100" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
      <div className="h-full rounded-full bg-plum-600 transition-[width]" style={{ width: `${Math.max(4, value * 100)}%` }} />
    </div>
  );
}

type ImageFieldProps = {
  name: string;
  label: string;
  hint?: ReactNode;
  required?: boolean;
  defaultValue?: StoredImage | null;
  /** Preview shape, e.g. "aspect-[16/9]". */
  aspect?: string;
  /** Let the editor tap the photo to choose what stays in view when it's cropped. */
  focalPoint?: boolean;
  /** Also ask for a caption. */
  caption?: boolean;
  className?: string;
};

/**
 * One image: upload (or drag a file in), describe it for screen readers, and
 * optionally pick its focal point. Submits JSON in a hidden input.
 */
export function ImageField({
  name,
  label,
  hint,
  required,
  defaultValue,
  aspect = "aspect-[4/3]",
  focalPoint,
  caption,
  className,
}: ImageFieldProps) {
  const id = `${useId()}-${name}`;
  const fieldError = useFieldError(name);
  const { markDirty } = useFormContext();
  const [image, setImage] = useState<StoredImage | undefined>(defaultValue ?? undefined);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (next: StoredImage | undefined) => {
    setImage(next);
    markDirty();
  };

  async function upload(file: File) {
    setError(undefined);
    setProgress(0);
    try {
      const result = await uploadFile(file, "image", setProgress);
      update(toImage(result, image?.alt ?? ""));
    } catch (uploadError) {
      setError(errorMessage(uploadError));
    } finally {
      setProgress(null);
    }
  }

  const focal = image?.focalPoint;

  return (
    <FieldShell id={id} label={label} hint={hint} error={fieldError ?? error} required={required} className={className}>
      <input type="hidden" name={name} value={image ? JSON.stringify(image) : ""} />
      <input
        ref={fileRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.target.value = "";
        }}
      />

      {image ? (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-plum-950/10">
          <div className={cn("relative bg-plum-100", aspect)}>
            <img
              src={thumbUrl(image.url, 900)}
              alt=""
              className="absolute inset-0 size-full object-cover"
              style={focal ? { objectPosition: `${focal.x * 100}% ${focal.y * 100}%` } : undefined}
            />
            {focalPoint && (
              <button
                type="button"
                className="absolute inset-0 cursor-crosshair"
                aria-label="Tap the most important part of the photo to keep it in view when cropped"
                onClick={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  const x = Math.round(((event.clientX - box.left) / box.width) * 100) / 100;
                  const y = Math.round(((event.clientY - box.top) / box.height) * 100) / 100;
                  update({ ...image, focalPoint: { x, y } });
                }}
              >
                {focal && (
                  <span
                    className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-plum-600/60 shadow-card"
                    style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
                  />
                )}
              </button>
            )}
            {progress !== null && (
              <div className="absolute inset-x-4 bottom-4">
                <UploadProgress value={progress} />
              </div>
            )}
          </div>
          <div className="space-y-3 p-3.5">
            {focalPoint && (
              <p className="text-[0.8125rem] text-plum-950/55">Tap the photo on the most important part (e.g. a face) — it stays in view when the photo is cropped.</p>
            )}
            <div>
              <label htmlFor={`${id}-alt`} className="mb-1 block text-[0.8125rem] font-semibold text-plum-950">
                Describe the photo <span className="font-normal text-plum-950/55">(for people using screen readers)</span>
              </label>
              <input
                id={`${id}-alt`}
                value={image.alt}
                maxLength={300}
                onChange={(event) => update({ ...image, alt: event.target.value })}
                placeholder="e.g. The choir singing during Sunday service"
                className={inputClass}
              />
            </div>
            {caption && (
              <div>
                <label htmlFor={`${id}-caption`} className="mb-1 block text-[0.8125rem] font-semibold text-plum-950">
                  Caption <span className="font-normal text-plum-950/55">(optional, shown under the photo)</span>
                </label>
                <input
                  id={`${id}-caption`}
                  value={image.caption ?? ""}
                  maxLength={500}
                  onChange={(event) => update({ ...image, caption: event.target.value })}
                  className={inputClass}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-plum-100 px-4 text-sm font-semibold text-plum-800 hover:bg-plum-200">
                <Icon name="upload" size={15} /> Replace
              </button>
              <button type="button" onClick={() => update(undefined)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-danger-600 hover:bg-danger-50">
                <Icon name="trash" size={15} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) upload(file);
          }}
          data-invalid={fieldError ? true : undefined}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragging ? "border-plum-500 bg-plum-100" : "border-plum-950/15 bg-white hover:border-plum-400",
          )}
        >
          {progress !== null ? (
            <span className="w-full max-w-60 space-y-2">
              <span className="block text-sm font-semibold text-plum-800">Uploading…</span>
              <UploadProgress value={progress} />
            </span>
          ) : (
            <>
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-plum-100 text-plum-700">
                <Icon name="image" size={20} />
              </span>
              <span className="text-sm font-semibold text-plum-800">Upload a photo</span>
              <span className="text-[0.8125rem] text-plum-950/55">Tap to choose, or drag a JPG/PNG here</span>
            </>
          )}
        </button>
      )}
    </FieldShell>
  );
}

type ImageListFieldProps = {
  name: string;
  label: string;
  hint?: ReactNode;
  defaultValue?: StoredImage[];
  max?: number;
  className?: string;
};

/** Several images (e.g. story photos): upload many at once, reorder, describe, remove. */
export function ImageListField({ name, label, hint, defaultValue = [], max = 12, className }: ImageListFieldProps) {
  const id = `${useId()}-${name}`;
  const { markDirty } = useFormContext();
  const [images, setImages] = useState<StoredImage[]>(defaultValue);
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (next: StoredImage[]) => {
    setImages(next);
    markDirty();
  };

  async function uploadAll(files: File[]) {
    const room = max - images.length;
    const selected = files.slice(0, Math.max(0, room));
    if (!selected.length) return setError(`You can add up to ${max} photos here.`);
    setError(undefined);
    setBusy({ done: 0, total: selected.length });
    const added: StoredImage[] = [];
    const problems: string[] = [];
    for (const file of selected) {
      try {
        added.push(toImage(await uploadFile(file, "image")));
      } catch (uploadError) {
        problems.push(`${file.name}: ${errorMessage(uploadError)}`);
      }
      setBusy((current) => current && { ...current, done: current.done + 1 });
    }
    setImages((current) => [...current, ...added]);
    markDirty();
    setBusy(null);
    if (problems.length) setError(problems.join(" "));
  }

  const move = (index: number, by: number) => {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    update(next);
  };

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <input type="hidden" name={name} value={JSON.stringify(images)} />
      <input
        ref={fileRef}
        id={id}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) uploadAll(files);
          event.target.value = "";
        }}
      />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <li key={`${image.url}-${index}`} className="overflow-hidden rounded-2xl bg-white ring-1 ring-plum-950/10">
            <div className="relative aspect-square bg-plum-100">
              <img src={thumbUrl(image.url, 400)} alt="" className="absolute inset-0 size-full object-cover" />
            </div>
            <div className="space-y-2 p-2">
              <input
                value={image.alt}
                onChange={(event) => update(images.map((item, i) => (i === index ? { ...item, alt: event.target.value } : item)))}
                placeholder="Describe the photo"
                aria-label={`Description for photo ${index + 1}`}
                maxLength={300}
                className={cn(inputClass, "px-2.5 py-2 text-sm")}
              />
              <div className="flex justify-between">
                <span className="flex">
                  <IconButton label="Move earlier" icon="chevronLeft" disabled={index === 0} onClick={() => move(index, -1)} />
                  <IconButton label="Move later" icon="chevronRight" disabled={index === images.length - 1} onClick={() => move(index, 1)} />
                </span>
                <IconButton label="Remove photo" icon="trash" danger onClick={() => update(images.filter((_, i) => i !== index))} />
              </div>
            </div>
          </li>
        ))}
        {images.length < max && (
          <li>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={Boolean(busy)}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-plum-950/15 bg-white p-3 text-center hover:border-plum-400"
            >
              {busy ? (
                <span className="text-sm font-semibold text-plum-800">
                  Uploading {Math.min(busy.done + 1, busy.total)} of {busy.total}…
                </span>
              ) : (
                <>
                  <Icon name="plus" size={20} className="text-plum-700" />
                  <span className="text-sm font-semibold text-plum-800">Add photos</span>
                </>
              )}
            </button>
          </li>
        )}
      </ul>
    </FieldShell>
  );
}

export function IconButton({
  label,
  icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30",
        danger ? "text-danger-600 hover:bg-danger-50" : "text-plum-700 hover:bg-plum-100",
      )}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

/** Sermon audio: upload an MP3, or paste a link to one. Submits `${name}` (URL) and `${name}Type`. */
export function AudioField({
  name,
  label,
  hint,
  defaultValue,
  defaultMime,
  className,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  defaultValue?: string | null;
  defaultMime?: string | null;
  className?: string;
}) {
  const id = `${useId()}-${name}`;
  const fieldError = useFieldError(name);
  const { markDirty } = useFormContext();
  const [url, setUrl] = useState(defaultValue ?? "");
  const [mime, setMime] = useState(defaultMime ?? "");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(undefined);
    setProgress(0);
    try {
      const result = await uploadFile(file, "audio", setProgress);
      setUrl(result.url);
      setMime(result.mime ?? "");
      markDirty();
    } catch (uploadError) {
      setError(errorMessage(uploadError));
    } finally {
      setProgress(null);
    }
  }

  return (
    <FieldShell id={id} label={label} hint={hint} error={fieldError ?? error} className={className}>
      <input type="hidden" name={`${name}Type`} value={mime} />
      <input
        ref={fileRef}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/ogg,.mp3,.m4a"
        className="sr-only"
        aria-label={`Upload ${label}`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.target.value = "";
        }}
      />
      <div className="space-y-3 rounded-2xl bg-white p-3.5 ring-1 ring-plum-950/10">
        {url && (
          <audio controls preload="none" src={url} className="w-full">
            Your browser can&apos;t play this audio.
          </audio>
        )}
        {progress !== null && <UploadProgress value={progress} />}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={progress !== null}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-plum-100 px-4 text-sm font-semibold text-plum-800 hover:bg-plum-200"
          >
            <Icon name="upload" size={15} /> {url ? "Upload a different file" : "Upload MP3"}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setMime("");
                markDirty();
              }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-danger-600 hover:bg-danger-50"
            >
              <Icon name="trash" size={15} /> Remove audio
            </button>
          )}
        </div>
        <div>
          <label htmlFor={id} className="mb-1 block text-[0.8125rem] font-semibold text-plum-950">
            …or paste a link to an MP3
          </label>
          <input
            id={id}
            name={name}
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setMime("");
            }}
            placeholder="https://…/sermon.mp3"
            className={inputClass}
            aria-invalid={fieldError ? true : undefined}
          />
        </div>
      </div>
    </FieldShell>
  );
}
