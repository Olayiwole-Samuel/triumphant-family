import "server-only";
import type { StoredImage } from "@/lib/db/schema";
import { failure, type FormState } from "./form-state";

/**
 * Reading and checking admin forms on the server.
 *
 * Every admin form posts to a server action; the action reads each field
 * through a FormReader, which trims values, enforces limits and collects
 * friendly error messages keyed by field name (shown next to the field).
 * Nothing from the browser is trusted without passing through here.
 */

export { failure, IDLE, success, type FormAction, type FormState } from "./form-state";

type TextOptions = { label: string; required?: boolean; max?: number };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidDate(value: string) {
  if (!DATE.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Uploaded images must come from our own storage (Cloudinary account or local uploads). */
export function isAllowedImageUrl(url: string) {
  if (url.startsWith("/uploads/") && !url.includes("..")) return true;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  return Boolean(cloud) && url.startsWith(`https://res.cloudinary.com/${cloud}/`);
}

export class FormReader {
  readonly errors: Record<string, string> = {};

  constructor(private readonly data: FormData) {}

  raw(name: string): string {
    const value = this.data.get(name);
    return typeof value === "string" ? value : "";
  }

  error(name: string, message: string) {
    if (!this.errors[name]) this.errors[name] = message;
  }

  get ok() {
    return Object.keys(this.errors).length === 0;
  }

  /** The error state to return when something needs fixing. */
  fail(message = "Please fix the highlighted fields."): FormState {
    return failure(message, this.errors);
  }

  text(name: string, { label, required, max = 500 }: TextOptions): string | undefined {
    const value = this.raw(name).replace(/\r\n?/g, "\n").trim();
    if (!value) {
      if (required) this.error(name, `${label} is required.`);
      return undefined;
    }
    if (value.length > max) {
      this.error(name, `${label} is too long (${value.length} characters — the limit is ${max}).`);
      return undefined;
    }
    return value;
  }

  /** A web link (https://…). `allowPath` also accepts links within the site such as /watch. */
  url(name: string, options: TextOptions & { allowPath?: boolean }): string | undefined {
    const value = this.text(name, { ...options, max: options.max ?? 2000 });
    if (!value) return undefined;
    if (options.allowPath && /^\/(?!\/)/.test(value)) return value;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch {
      // handled below
    }
    this.error(
      name,
      options.allowPath
        ? `${options.label} must be a full web address (https://…) or a page on this site (e.g. /watch).`
        : `${options.label} must be a full web address starting with https://`,
    );
    return undefined;
  }

  email(name: string, options: TextOptions): string | undefined {
    const value = this.text(name, { ...options, max: 254 });
    if (value && !EMAIL.test(value)) {
      this.error(name, `${options.label} doesn't look like an email address.`);
      return undefined;
    }
    return value?.toLowerCase();
  }

  date(name: string, options: TextOptions): string | undefined {
    const value = this.text(name, { ...options, max: 10 });
    if (value && !isValidDate(value)) {
      this.error(name, `${options.label} isn't a valid date.`);
      return undefined;
    }
    return value;
  }

  time(name: string, options: TextOptions): string | undefined {
    const value = this.text(name, { ...options, max: 5 });
    if (value && !TIME.test(value)) {
      this.error(name, `${options.label} must be a time like 09:30.`);
      return undefined;
    }
    return value;
  }

  bool(name: string): boolean {
    const value = this.raw(name);
    return value === "on" || value === "true" || value === "1";
  }

  int(name: string, { label, min, max }: { label: string; min?: number; max?: number }): number | undefined {
    const value = this.raw(name).trim();
    if (!value) return undefined;
    const number = Number(value);
    if (!Number.isInteger(number) || (min !== undefined && number < min) || (max !== undefined && number > max)) {
      this.error(name, `${label} must be a whole number${min !== undefined ? ` from ${min}` : ""}${max !== undefined ? ` to ${max}` : ""}.`);
      return undefined;
    }
    return number;
  }

  choice<T extends string>(name: string, options: readonly T[], fallback: T): T {
    const value = this.raw(name) as T;
    return options.includes(value) ? value : fallback;
  }

  /** A JSON value from a list editor's hidden input. Invalid JSON → fallback. */
  json<T>(name: string, fallback: T): T {
    const value = this.raw(name);
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  /** An image field (JSON from the uploader). Only our own storage URLs are accepted. */
  image(name: string, { label, required }: { label: string; required?: boolean }): StoredImage | undefined {
    const value = this.json<Partial<StoredImage> | null>(name, null);
    if (!value?.url) {
      if (required) this.error(name, `${label} is required.`);
      return undefined;
    }
    const image = sanitizeImage(value);
    if (!image) this.error(name, `${label} couldn't be saved — please upload it again.`);
    return image;
  }

  images(name: string, { max = 60 }: { max?: number } = {}): StoredImage[] {
    const list = this.json<unknown>(name, []);
    if (!Array.isArray(list)) return [];
    return list
      .slice(0, max)
      .map((item) => sanitizeImage(item as Partial<StoredImage>))
      .filter((image): image is StoredImage => Boolean(image));
  }
}

const cleanText = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

const cleanNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;

export function sanitizeImage(value: Partial<StoredImage> | null | undefined): StoredImage | undefined {
  if (!value || typeof value.url !== "string" || !isAllowedImageUrl(value.url)) return undefined;
  const focal = value.focalPoint;
  return {
    url: value.url,
    alt: cleanText(value.alt, 300) ?? "",
    caption: cleanText(value.caption, 500),
    width: cleanNumber(value.width),
    height: cleanNumber(value.height),
    publicId: cleanText(value.publicId, 300),
    focalPoint:
      focal && typeof focal.x === "number" && typeof focal.y === "number"
        ? { x: Math.min(1, Math.max(0, focal.x)), y: Math.min(1, Math.max(0, focal.y)) }
        : undefined,
  };
}

/** A list of short strings (topics, scriptures…): trimmed, de-duplicated, bounded. */
export function cleanStringList(value: unknown, { max = 30, maxLength = 120 } = {}): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    const text = cleanText(item, maxLength);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    result.push(text);
    if (result.length >= max) break;
  }
  return result;
}

export { cleanText, DATE, TIME };
