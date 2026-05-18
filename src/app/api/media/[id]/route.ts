import { connectDB } from "@/lib/db/connect";
import { Media } from "@/lib/db/models/media.model";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id || !/^[a-f0-9]{24}$/i.test(id)) {
    return new Response(null, { status: 404 });
  }

  await connectDB();
  const media = await Media.findById(id).select("data mimeType").lean();

  if (!media?.data) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
