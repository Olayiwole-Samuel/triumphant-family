import "server-only";
import { createHash } from "node:crypto";

/**
 * Cloudinary uploads (server only — needs the API secret).
 *
 * The admin asks our server for a short-lived signature, then the browser
 * uploads the file straight to Cloudinary. Large files (sermon MP3s) never
 * pass through our server, so hosting upload limits don't apply, and the
 * secret never leaves the server.
 *
 * Settings: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 */

export type UploadKind = "image" | "audio";

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

const FORMATS: Record<UploadKind, string> = {
  image: "jpg,jpeg,png,webp,gif,avif",
  audio: "mp3,m4a,aac,wav,ogg",
};

/** Parameters for one direct browser → Cloudinary upload (valid for about an hour). */
export function signUpload(kind: UploadKind) {
  const config = cloudinaryConfig();
  if (!config) return null;
  const params: Record<string, string> = {
    allowed_formats: FORMATS[kind],
    folder: kind === "image" ? "tfam/images" : "tfam/audio",
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + config.apiSecret).digest("hex");
  return {
    // Cloudinary stores audio under its "video" resource type.
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/${kind === "image" ? "image" : "video"}/upload`,
    fields: { ...params, api_key: config.apiKey, signature },
  };
}
