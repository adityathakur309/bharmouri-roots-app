import { withHandler } from "@/lib/middleware/with-handler";
import { addressController } from "@/modules/address/address.controller";

export const PATCH = withHandler(
  (req, ctx) => addressController.update(req, ctx!),
  { auth: true }
);

export const DELETE = withHandler(
  (req, ctx) => addressController.remove(req, ctx!),
  { auth: true }
);
