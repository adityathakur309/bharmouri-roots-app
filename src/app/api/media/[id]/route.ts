import { readFile } from "fs/promises";
import { connectDB } from "@/lib/db/connect";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { mediaRepository } from "@/modules/media/media.repository";
import { fileExists, resolveAbsolutePath } from "@/lib/storage/local-media";
import { toBuffer } from "@/lib/utils/mongo-buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Backward-compatible media URL for older product images stored as /api/media/:id.
 * New uploads use static /uploads/... paths (served directly by Next.js).
 */
export async function GET(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  const limited = checkRateLimit(`${ip}:/api/media`, RATE_LIMITS.media);
  if (!limited.allowed) {
    return new Response(null, {
      status: 429,
      headers: {
        "Retry-After": String(
          Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 1000))
        ),
      },
    });
  }

  const { id } = await context.params;

  if (!id || !/^[a-f0-9]{24}$/i.test(id)) {
    return new Response(null, { status: 404 });
  }

  await connectDB();
  const media = await mediaRepository.findByIdForServe(id);

  if (!media) {
    return new Response(null, { status: 404 });
  }

  // Preferred: file on disk → redirect to static URL (browser cache / Next static)
  if (media.path && (await fileExists(media.path))) {
    const location = media.url || `/${media.path.replace(/^\/+/, "")}`;
    return Response.redirect(new URL(location, request.url), 302);
  }

  // Legacy: binary still in MongoDB
  const buffer = toBuffer(media.data);
  if (buffer?.length) {
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": media.mimeType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // Path recorded but file missing — try absolute read once more for debugging path issues
  if (media.path) {
    try {
      const bytes = await readFile(resolveAbsolutePath(media.path));
      return new Response(new Uint8Array(bytes), {
        headers: {
          "Content-Type": media.mimeType || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  }

  return new Response(null, { status: 404 });
}
