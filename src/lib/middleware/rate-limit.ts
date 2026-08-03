/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-instance / small deployments.
 * For multi-instance production scale, swap the store for Redis (e.g. Upstash).
 */

const store = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 10_000;

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/** Preset policies for sensitive and public surfaces */
export const RATE_LIMITS = {
  /** Login / register — brute-force protection */
  auth: { maxRequests: 10, windowMs: 15 * 60_000 },
  /** Admin image uploads */
  upload: { maxRequests: 20, windowMs: 60_000 },
  /** Public catalog / shipping reads */
  public: { maxRequests: 60, windowMs: 60_000 },
  /** Binary media serving */
  media: { maxRequests: 120, windowMs: 60_000 },
  /** Authenticated / admin JSON APIs */
  default: { maxRequests: 100, windowMs: 60_000 },
} as const;

function pruneExpired(now: number) {
  if (store.size < MAX_KEYS) return;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
  // Hard cap if still oversized (memory safety)
  if (store.size >= MAX_KEYS) {
    const excess = store.size - Math.floor(MAX_KEYS * 0.8);
    let removed = 0;
    for (const key of store.keys()) {
      store.delete(key);
      removed += 1;
      if (removed >= excess) break;
    }
  }
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const windowMs = options.windowMs ?? RATE_LIMITS.default.windowMs;
  const maxRequests = options.maxRequests ?? RATE_LIMITS.default.maxRequests;
  const now = Date.now();

  pruneExpired(now);

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
      limit: maxRequests,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: maxRequests,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
    limit: maxRequests,
  };
}

/**
 * Prefer platform identity headers; then left-most forwarded hop.
 * Spoof mitigation still requires a trusted reverse proxy stripping client XFF.
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelForwarded) {
    return vercelForwarded.split(",")[0]?.trim() || "unknown";
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return "unknown";
}
