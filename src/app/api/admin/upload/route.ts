import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { Media } from "@/lib/db/models/media.model";
import { withHandler } from "@/lib/middleware/with-handler";
import { successResponse } from "@/lib/utils/api-response";
import { ValidationError } from "@/lib/utils/errors";
import type { AuthenticatedRequest } from "@/lib/middleware/with-handler";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

function resolveMimeType(file: File): string {
  if (file.type && ALLOWED_TYPES.includes(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  const byExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return ext ? (byExt[ext] ?? "") : "";
}

/** Serverless hosts (e.g. Vercel) have ephemeral disk — store uploads in MongoDB. */
function useMongoUploadStorage(): boolean {
  return (
    process.env.UPLOAD_STORAGE === "mongodb" ||
    Boolean(process.env.VERCEL) ||
    process.env.NODE_ENV === "production"
  );
}

export const POST = withHandler(
  async (request: AuthenticatedRequest) => {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new ValidationError("No file uploaded");
    }

    const mimeType = resolveMimeType(file);
    if (!mimeType) {
      throw new ValidationError("Only JPEG, PNG, WebP, and GIF images are allowed");
    }

    if (file.size > MAX_SIZE) {
      throw new ValidationError("File must be under 5MB");
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const filename = `${randomUUID()}.${safeExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (useMongoUploadStorage()) {
      const media = await Media.create({
        filename,
        mimeType,
        size: file.size,
        data: buffer,
      });
      const url = `/api/media/${media._id.toString()}`;
      return successResponse({ url, filename }, { message: "Image uploaded", status: 201 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    const url = `/uploads/${filename}`;

    return successResponse({ url, filename }, { message: "Image uploaded", status: 201 });
  },
  { admin: true }
);
