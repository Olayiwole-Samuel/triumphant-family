/**
 * Uploading from the admin (runs in the browser).
 *
 * 1. Images are shrunk to at most 2400px on the longest side before upload
 *    (phone photos are often 4000px+ and 8 MB+), keeping uploads fast.
 * 2. The server says where to upload (/api/admin/upload): straight to
 *    Cloudinary with a signature, or to the local development store.
 */

export type UploadResult = {
  url: string;
  width?: number;
  height?: number;
  publicId?: string;
  mime?: string;
};

const MAX_SIDE = 2400;
const IMAGE_TYPES = /^image\/(jpeg|png|webp|gif|avif)$/;
const AUDIO_TYPES = /^audio\/(mpeg|mp3|mp4|x-m4a|m4a|aac|wav|x-wav|ogg)$/;
export const MAX_AUDIO_MB = 100;

export class UploadError extends Error {}

async function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  if (!IMAGE_TYPES.test(file.type)) {
    throw new UploadError(
      file.type === "image/heic" || /\.heic$/i.test(file.name)
        ? "iPhone HEIC photos can't be used directly — please export the photo as JPG first (or set your iPhone camera to “Most Compatible”)."
        : "Please choose a JPG, PNG, WebP or GIF image.",
    );
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new UploadError("This image couldn't be opened. Try saving it as JPG and uploading again.");
  }
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));

  // Small enough already (and animated GIFs must keep their frames).
  if (file.type === "image/gif" || (scale === 1 && file.size <= 2.5 * 1024 * 1024)) {
    bitmap.close();
    return { blob: file, width, height };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // PNG/WebP may have transparency (logos) → WebP; photos → JPEG.
  const type = file.type === "image/png" || file.type === "image/webp" ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
  if (!blob) throw new UploadError("This image couldn't be prepared for upload.");
  return { blob, width: canvas.width, height: canvas.height };
}

function post(url: string, body: FormData, onProgress?: (fraction: number) => void): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    request.onload = () => {
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(request.responseText);
      } catch {
        // handled below
      }
      if (request.status >= 200 && request.status < 300) resolve(json);
      else {
        const message =
          (typeof json.error === "string" && json.error) ||
          (typeof (json.error as { message?: string })?.message === "string" && (json.error as { message: string }).message) ||
          "The upload failed. Please try again.";
        reject(new UploadError(message));
      }
    };
    request.onerror = () => reject(new UploadError("The upload failed — check your internet connection and try again."));
    request.send(body);
  });
}

export async function uploadFile(
  file: File,
  kind: "image" | "audio",
  onProgress?: (fraction: number) => void,
): Promise<UploadResult> {
  let blob: Blob = file;
  let width: number | undefined;
  let height: number | undefined;

  if (kind === "image") {
    ({ blob, width, height } = await prepareImage(file));
  } else {
    if (!AUDIO_TYPES.test(file.type) && !/\.(mp3|m4a|aac|wav|ogg)$/i.test(file.name)) {
      throw new UploadError("Please choose an MP3 or M4A audio file.");
    }
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      throw new UploadError(`That recording is larger than ${MAX_AUDIO_MB} MB. Export it at a lower quality (e.g. 96 kbps MP3) and try again.`);
    }
  }

  const planResponse = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  const plan = (await planResponse.json().catch(() => ({}))) as {
    mode?: string;
    uploadUrl?: string;
    fields?: Record<string, string>;
    message?: string;
    error?: string;
  };
  if (!planResponse.ok) throw new UploadError(plan.error ?? "Uploads aren't available right now.");

  const name = file.name.replace(/\.[^.]+$/, "") || "upload";

  if (plan.mode === "cloudinary" && plan.uploadUrl && plan.fields) {
    const form = new FormData();
    for (const [key, value] of Object.entries(plan.fields)) form.append(key, value);
    form.append("file", blob, name);
    const result = await post(plan.uploadUrl, form, onProgress);
    return {
      url: String(result.secure_url),
      width: typeof result.width === "number" ? result.width : width,
      height: typeof result.height === "number" ? result.height : height,
      publicId: typeof result.public_id === "string" ? result.public_id : undefined,
      mime: kind === "audio" ? file.type || "audio/mpeg" : undefined,
    };
  }

  if (plan.mode === "local") {
    const form = new FormData();
    form.append("kind", kind);
    form.append("file", blob, name);
    const result = await post("/api/admin/upload", form, onProgress);
    return { url: String(result.url), width, height, mime: typeof result.mime === "string" ? result.mime : undefined };
  }

  throw new UploadError(plan.message ?? "Uploads aren't set up yet.");
}
