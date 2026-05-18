import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { withHandler } from "@/lib/middleware/with-handler";
import { successResponse } from "@/lib/utils/api-response";
import { ValidationError } from "@/lib/utils/errors";
import type { AuthenticatedRequest } from "@/lib/middleware/with-handler";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const POST = withHandler(
  async (request: AuthenticatedRequest) => {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new ValidationError("No file uploaded");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError("Only JPEG, PNG, WebP, and GIF images are allowed");
    }

    if (file.size > MAX_SIZE) {
      throw new ValidationError("File must be under 5MB");
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const filename = `${randomUUID()}.${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;

    return successResponse({ url, filename }, { message: "Image uploaded", status: 201 });
  },
  { admin: true }
);
