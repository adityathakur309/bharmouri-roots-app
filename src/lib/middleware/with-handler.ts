import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { errorResponse } from "@/lib/utils/api-response";
import { ValidationError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "./rate-limit";
import { requireAuth, requireAdmin } from "./auth.middleware";
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

function rateLimitResponse(result: {
  resetAt: number;
  limit: number;
}): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    {
      success: false,
      message: "Too many requests",
      code: "RATE_LIMIT",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
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
        const policy = options.rateLimit ?? RATE_LIMITS.default;
        const limit = checkRateLimit(`${ip}:${path}`, policy);
        if (!limit.allowed) {
          logger.warn("Rate limit exceeded", { ip, path, limit: limit.limit });
          return rateLimitResponse(limit);
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
  try {
    return (await request.json()) as T;
  } catch {
    throw new ValidationError("Invalid JSON body");
  }
}
