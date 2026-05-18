import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { errorResponse } from "@/lib/utils/api-response";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { requireAuth } from "./auth.middleware";
import { requireAdmin } from "./admin.middleware";
import type { SessionUser } from "@/types/auth";

export type RouteContext = {
  params: Promise<Record<string, string>>;
};

export type AuthenticatedRequest = NextRequest & {
  user: SessionUser;
};

type HandlerFn = (
  request: NextRequest,
  context?: RouteContext
) => Promise<Response>;

type HandlerWithUserFn = (
  request: AuthenticatedRequest,
  context?: RouteContext
) => Promise<Response>;

interface BaseHandlerOptions {
  rateLimit?: { maxRequests?: number; windowMs?: number } | false;
}

interface PublicHandlerOptions extends BaseHandlerOptions {
  auth?: false;
  admin?: false;
}

interface AuthHandlerOptions extends BaseHandlerOptions {
  auth: true;
  admin?: false;
}

interface AdminHandlerOptions extends BaseHandlerOptions {
  admin: true;
}

export function withHandler(
  handler: HandlerWithUserFn,
  options: AuthHandlerOptions | AdminHandlerOptions
): (request: NextRequest, context?: RouteContext) => Promise<Response>;

export function withHandler(
  handler: HandlerFn,
  options?: PublicHandlerOptions
): (request: NextRequest, context?: RouteContext) => Promise<Response>;

export function withHandler(
  handler: HandlerFn | HandlerWithUserFn,
  options: PublicHandlerOptions | AuthHandlerOptions | AdminHandlerOptions = {}
) {
  return async (request: NextRequest, context?: RouteContext): Promise<Response> => {
    try {
      if (options.rateLimit !== false) {
        const ip = getClientIp(request);
        const path = new URL(request.url).pathname;
        const limit = checkRateLimit(`${ip}:${path}`, options.rateLimit);
        if (!limit.allowed) {
          const { AppError } = await import("@/lib/utils/errors");
          throw new AppError("Too many requests", 429, "RATE_LIMIT");
        }
      }

      await connectDB();

      if (options.admin) {
        const user = await requireAdmin(request);
        const authedRequest = request as AuthenticatedRequest;
        authedRequest.user = user;
        return await (handler as HandlerWithUserFn)(authedRequest, context);
      }

      if (options.auth) {
        const user = await requireAuth(request);
        const authedRequest = request as AuthenticatedRequest;
        authedRequest.user = user;
        return await (handler as HandlerWithUserFn)(authedRequest, context);
      }

      return await (handler as HandlerFn)(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function parseJsonBody<T>(request: NextRequest): Promise<T> {
  return request.json() as Promise<T>;
}
