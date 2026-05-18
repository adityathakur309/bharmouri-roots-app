import { withHandler } from "@/lib/middleware/with-handler";
import { wishlistController } from "@/modules/wishlist/wishlist.controller";

export const GET = withHandler((req) => wishlistController.get(req), { auth: true });
export const POST = withHandler((req) => wishlistController.toggle(req), { auth: true });
