import { AUTH_CONFIG } from './config';

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

const LIMITS = {
  login: { max: 10, windowMs: 15 * 60 * 1000 },
  register: { max: 5, windowMs: 60 * 60 * 1000 },
  forgotPassword: { max: 5, windowMs: 60 * 60 * 1000 },
  resetPassword: { max: 10, windowMs: 15 * 60 * 1000 },
  changePassword: { max: 5, windowMs: 15 * 60 * 1000 },
} as const;

export type RateLimitAction = keyof typeof LIMITS;

export function checkRateLimit(
  action: RateLimitAction,
  identifier: string
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const { max, windowMs } = LIMITS[action];
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function rateLimitResponse(retryAfterSec: number) {
  return {
    message: `Too many attempts. Please try again in ${retryAfterSec} seconds.`,
    status: 429 as const,
  };
}

// Exported for tests
export function _resetRateLimits(): void {
  buckets.clear();
}

export { AUTH_CONFIG };
