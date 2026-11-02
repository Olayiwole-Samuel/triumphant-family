import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin/session";
import { signUpload, type UploadKind } from "@/lib/cloudinary/server";
import { localUploadsAllowed, saveLocalUpload } from "@/lib/media/local";

/**
 * POST /api/admin/upload — signed-in admins only.
 *
 * JSON { kind } → how to upload:
 *   { mode: "cloudinary", uploadUrl, fields }  browser uploads straight to Cloudinary
 *   { mode: "local" }                          browser posts the file here (development)
 *   { mode: "unavailable", message }           no storage configured
 *
 * multipart (file, kind) → saves a local upload (development only).
 */

const KINDS: UploadKind[] = ["image", "audio"];

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Your session has ended — please sign in again." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { kind?: string };
    const kind = KINDS.find((k) => k === body.kind);
    if (!kind) return NextResponse.json({ error: "Unknown upload type." }, { status: 400 });

    const signed = signUpload(kind);
    if (signed) return NextResponse.json({ mode: "cloudinary", ...signed });
    if (localUploadsAllowed()) return NextResponse.json({ mode: "local" });
    return NextResponse.json({
      mode: "unavailable",
      message: "Uploads aren't set up yet: add the Cloudinary settings (see README → Images).",
    });
  }

  if (!localUploadsAllowed()) {
    return NextResponse.json({ error: "Uploads go to Cloudinary on the live site." }, { status: 400 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = KINDS.find((k) => k === form?.get("kind"));
  if (!(file instanceof File) || !kind) return NextResponse.json({ error: "No file received." }, { status: 400 });

  const saved = await saveLocalUpload(file, kind);
  if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });
  return NextResponse.json(saved);
}
