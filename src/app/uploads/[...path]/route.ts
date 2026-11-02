import { connection } from "next/server";
import { localUploadsAllowed, readLocalUpload } from "@/lib/media/local";

/**
 * GET /uploads/<file> — serves files uploaded in the admin during local
 * development (stored in .data/uploads). On the live site uploads are served
 * by Cloudinary instead and this route returns 404.
 */
export async function GET(_request: Request, { params }: RouteContext<"/uploads/[...path]">) {
  await connection();
  const { path } = await params;
  if (!localUploadsAllowed() || path.length !== 1) return new Response("Not found", { status: 404 });

  const file = await readLocalUpload(path[0]);
  if (!file?.type) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.type.mime,
      "Content-Length": String(file.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
