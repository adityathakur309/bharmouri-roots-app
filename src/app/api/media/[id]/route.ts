import { connectDB } from "@/lib/db/connect";
import { Media } from "@/lib/db/models/media.model";
import { toBuffer } from "@/lib/utils/mongo-buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id || !/^[a-f0-9]{24}$/i.test(id)) {
    return new Response(null, { status: 404 });
  }

  await connectDB();
  const media = await Media.findById(id).select("data mimeType").lean();

  if (!media) {
    return new Response(null, { status: 404 });
  }

  const buffer = toBuffer(media.data);
  if (!buffer?.length) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": media.mimeType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
