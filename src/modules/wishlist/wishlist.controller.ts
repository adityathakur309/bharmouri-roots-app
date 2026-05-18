import { successResponse } from "@/lib/utils/api-response";
import { wishlistToggleSchema } from "@/lib/validators/cart.validator";
import { parseJsonBody, type AuthenticatedRequest } from "@/lib/middleware/with-handler";
import { wishlistService } from "./wishlist.service";

export class WishlistController {
  async get(request: AuthenticatedRequest) {
    const products = await wishlistService.get(request.user.id);
    return successResponse(products);
  }

  async toggle(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const { productId } = wishlistToggleSchema.parse(body);
    const result = await wishlistService.toggle(request.user.id, productId);
    return successResponse(result, {
      message: result.added ? "Added to wishlist" : "Removed from wishlist",
    });
  }
}

export const wishlistController = new WishlistController();
