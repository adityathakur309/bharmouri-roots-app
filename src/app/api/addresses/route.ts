import { withHandler } from "@/lib/middleware/with-handler";
import { addressController } from "@/modules/address/address.controller";

export const GET = withHandler((req) => addressController.list(req), { auth: true });
export const POST = withHandler((req) => addressController.create(req), { auth: true });
