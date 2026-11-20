/**
 * In-Memory Sliding-Window Rate Limiter.
 *
 * Tracks request timestamps per client identifier (IP / token).
 * Automatically cleans up expired windows to keep memory footprint low.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface ClientRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private clients = new Map<string, ClientRecord>();
  private defaultLimit: number;
  private windowMs: number;

  constructor(defaultLimit: number = 60, windowMs: number = 60000) {
    this.defaultLimit = defaultLimit;
    this.windowMs = windowMs;
  }

  /**
   * Checks whether a request with clientKey is allowed under the rate limit.
   */
  check(
    clientKey: string,
    limit: number = this.defaultLimit,
    windowMs: number = this.windowMs
  ): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.clients.get(clientKey);
    if (!record) {
      record = { timestamps: [] };
      this.clients.set(clientKey, record);
    }

    // Filter out timestamps outside the active window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      const oldestInWindow = record.timestamps[0];
      const retryAfterMs = oldestInWindow + windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    // Record this request
    record.timestamps.push(now);
    const remaining = Math.max(0, limit - record.timestamps.length);

    return {
      allowed: true,
      remaining,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Resets rate limit for a specific client key.
   */
  reset(clientKey: string): void {
    this.clients.delete(clientKey);
  }

  /**
   * Clears all client records.
   */
  clear(): void {
    this.clients.clear();
  }
}

// Global default rate limiter singleton
export const globalRateLimiter = new SlidingWindowRateLimiter();

/**
 * Extracts a client identifier from Request headers (x-forwarded-for, x-real-ip)
 * with a fallback to 'anonymous'.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  return "anonymous";
}

/**
 * Helper to check rate limits with a default or custom sliding window.
 */
export function checkRateLimit(
  clientKey: string,
  limit: number = 60,
  windowMs: number = 60000
): RateLimitResult {
  return globalRateLimiter.check(clientKey, limit, windowMs);
}
