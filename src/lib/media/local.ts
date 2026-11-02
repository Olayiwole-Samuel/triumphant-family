import "server-only";
import { isLocalDatabaseUrl } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local uploads — for development only, when Cloudinary isn't set up.
 *
 * Files are saved in .data/uploads (next to the local database) and served by
 * src/app/uploads/[...path]/route.ts. Only allowed while the site runs on the
 * local database, because hosted servers don't keep files written at runtime.
 */

export const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 100 * 1024 * 1024;

export function localUploadsAllowed() {
  return isLocalDatabaseUrl();
}

type Detected = { kind: "image" | "audio"; ext: string; mime: string };

/** Identifies a file from its first bytes (the browser's claimed type isn't trusted). */
export function detectFileType(bytes: Uint8Array): Detected | undefined {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { kind: "image", ext: "jpg", mime: "image/jpeg" };
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return { kind: "image", ext: "png", mime: "image/png" };
  if (ascii(0, 4) === "GIF8") return { kind: "image", ext: "gif", mime: "image/gif" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { kind: "image", ext: "webp", mime: "image/webp" };
  if (ascii(4, 8) === "ftyp" && /avif|avis/.test(ascii(8, 12))) return { kind: "image", ext: "avif", mime: "image/avif" };
  if (ascii(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return { kind: "audio", ext: "mp3", mime: "audio/mpeg" };
  if (ascii(4, 8) === "ftyp" && /M4A|mp4|isom/i.test(ascii(8, 12))) return { kind: "audio", ext: "m4a", mime: "audio/mp4" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return { kind: "audio", ext: "wav", mime: "audio/wav" };
  if (ascii(0, 4) === "OggS") return { kind: "audio", ext: "ogg", mime: "audio/ogg" };
  return undefined;
}

export async function saveLocalUpload(file: File, expected: "image" | "audio") {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectFileType(bytes);
  if (!type || type.kind !== expected) {
    return { error: expected === "image" ? "Please choose a JPG, PNG, WebP or GIF image." : "Please choose an MP3 or M4A audio file." } as const;
  }
  const limit = expected === "image" ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (bytes.byteLength > limit) return { error: `That file is too large (limit ${limit / 1024 / 1024} MB).` } as const;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${type.ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), bytes);
  return { url: `/uploads/${name}`, mime: type.mime } as const;
}

const SAFE_NAME = /^[a-z0-9]+-[a-f0-9]{12}\.(jpg|png|gif|webp|avif|mp3|m4a|wav|ogg)$/;

export async function readLocalUpload(name: string) {
  if (!SAFE_NAME.test(name)) return undefined;
  const file = path.join(UPLOAD_DIR, name);
  try {
    const info = await stat(file);
    const bytes = await readFile(file);
    return { bytes, size: info.size, type: detectFileType(bytes.subarray(0, 16)) };
  } catch {
    return undefined;
  }
}
