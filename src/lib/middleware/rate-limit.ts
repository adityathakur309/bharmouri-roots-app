/**
 * In-memory rate limiter — suitable for single-instance deployments.
 * For production at scale, replace with Redis (e.g. @upstash/ratelimit).
 */
const store = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 100;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
