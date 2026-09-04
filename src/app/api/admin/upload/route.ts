import { withHandler, type AuthenticatedRequest } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { successResponse } from "@/lib/utils/api-response";
import { isAppError, ValidationError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { uploadPurposeSchema } from "@/lib/validators/upload.validator";
import {
  extractUploadFile,
  uploadImage,
} from "@/modules/media/upload.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Admin image upload — optimize in memory, then store:
 * - Disk (`public/uploads`) on local/VPS
 * - MongoDB binary + `/api/media/:id` on Vercel (read-only filesystem)
 * Query `?purpose=product|category|banner|profile|general` (default general).
 */
export const POST = withHandler(
  async (request: AuthenticatedRequest) => {
    const { searchParams } = new URL(request.url);
    const purpose = uploadPurposeSchema.parse(
      searchParams.get("purpose") ?? "general"
    );

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ValidationError(
        "Invalid image upload. Send a multipart file in the `file` field."
      );
    }
    const file = await extractUploadFile(formData);
    try {
      const result = await uploadImage(file, { purpose });
      return successResponse(
        {
          url: result.url,
          filename: result.filename,
          id: result.id,
          mimeType: result.mimeType,
          size: result.size,
        },
        { message: "Image uploaded", status: 201 }
      );
    } catch (error) {
      if (isAppError(error)) throw error;
      logger.error("Upload handler failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw new ValidationError(
        "Could not upload image. Please try a JPEG, PNG, or WebP under 5MB."
      );
    }
  },
  { admin: true, rateLimit: RATE_LIMITS.upload }
);
