import { authController } from "@/modules/auth/auth.controller";

export async function GET(req: Request) {
  return authController.googleStart(req as never);
}
