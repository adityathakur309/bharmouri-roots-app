import { withHandler } from "@/lib/middleware/with-handler";
import { categoryController } from "@/modules/category/category.controller";

export const GET = withHandler((req) => categoryController.listAdmin(req), {
  admin: true,
});

export const POST = withHandler((req) => categoryController.create(req), {
  admin: true,
});

export const DELETE = withHandler((req) => categoryController.removeAll(req), {
  admin: true,
});
