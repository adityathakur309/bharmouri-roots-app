import { withHandler, type AuthenticatedRequest } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { successResponse } from "@/lib/utils/api-response";
import { uploadPurposeSchema } from "@/lib/validators/upload.validator";
import {
  extractUploadFile,
  uploadImage,
} from "@/modules/media/upload.service";

export const runtime = "nodejs";

/**
 * Admin image upload — optimize in memory, store file on disk, save path in MongoDB.
 * Query `?purpose=product|category|banner|profile|general` (default general).
 */
export const POST = withHandler(
  async (request: AuthenticatedRequest) => {
    const { searchParams } = new URL(request.url);
    const purpose = uploadPurposeSchema.parse(
      searchParams.get("purpose") ?? "general"
    );

    const formData = await request.formData();
    const file = await extractUploadFile(formData);
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
  },
  { admin: true, rateLimit: RATE_LIMITS.upload }
);
