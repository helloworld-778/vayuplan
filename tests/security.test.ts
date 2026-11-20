import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryCache } from "@/lib/security/cache";
import { SlidingWindowRateLimiter, checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { sanitizeString } from "@/lib/security/sanitize";

describe("Security & Caching Layer", () => {
  // ─── TTL Cache Tests ────────────────────────────────────────────────
  describe("MemoryCache", () => {
    it("stores and retrieves items within TTL", () => {
      const cache = new MemoryCache<string>(5000, 10);
      cache.set("key1", "value1");

      expect(cache.get("key1")).toBe("value1");
      expect(cache.size()).toBe(1);
    });

    it("expires items after TTL passes", () => {
      vi.useFakeTimers();
      const cache = new MemoryCache<string>(1000, 10);
      cache.set("short_lived", "data", 500); // 500ms TTL

      expect(cache.get("short_lived")).toBe("data");

      // Advance time by 600ms
      vi.advanceTimersByTime(600);

      expect(cache.get("short_lived")).toBeUndefined();
      expect(cache.size()).toBe(0);
      vi.useRealTimers();
    });

    it("evicts oldest entry when maxEntries cap is reached", () => {
      const cache = new MemoryCache<number>(60000, 3); // Max 3 items
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      expect(cache.size()).toBe(3);

      // Inserting 4th item should evict oldest ("a")
      cache.set("d", 4);

      expect(cache.size()).toBe(3);
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBe(2);
      expect(cache.get("c")).toBe(3);
      expect(cache.get("d")).toBe(4);
    });

    it("supports delete and clear methods", () => {
      const cache = new MemoryCache<string>(60000, 10);
      cache.set("k1", "v1");
      cache.set("k2", "v2");

      expect(cache.delete("k1")).toBe(true);
      expect(cache.get("k1")).toBeUndefined();
      expect(cache.size()).toBe(1);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  // ─── Rate Limiter Tests ─────────────────────────────────────────────
  describe("SlidingWindowRateLimiter", () => {
    let limiter: SlidingWindowRateLimiter;

    beforeEach(() => {
      limiter = new SlidingWindowRateLimiter(3, 1000); // 3 req per 1000ms
    });

    it("allows requests under the limit", () => {
      const res1 = limiter.check("client1", 3, 1000);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = limiter.check("client1", 3, 1000);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = limiter.check("client1", 3, 1000);
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it("blocks requests that exceed the limit with retryAfterSeconds", () => {
      limiter.check("client1", 3, 1000);
      limiter.check("client1", 3, 1000);
      limiter.check("client1", 3, 1000);

      const blocked = limiter.check("client1", 3, 1000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("resets limits when window passes", () => {
      vi.useFakeTimers();
      const timedLimiter = new SlidingWindowRateLimiter(2, 1000);

      timedLimiter.check("client_timer", 2, 1000);
      timedLimiter.check("client_timer", 2, 1000);

      expect(timedLimiter.check("client_timer", 2, 1000).allowed).toBe(false);

      // Advance past window (1100ms)
      vi.advanceTimersByTime(1100);

      const resAfter = timedLimiter.check("client_timer", 2, 1000);
      expect(resAfter.allowed).toBe(true);
      expect(resAfter.remaining).toBe(1);

      vi.useRealTimers();
    });

    it("extracts client IP from x-forwarded-for and x-real-ip headers", () => {
      const req1 = new Request("http://localhost", {
        headers: { "x-forwarded-for": "103.21.244.2, 192.168.1.1" },
      });
      expect(getClientIp(req1)).toBe("103.21.244.2");

      const req2 = new Request("http://localhost", {
        headers: { "x-real-ip": "115.112.55.10" },
      });
      expect(getClientIp(req2)).toBe("115.112.55.10");

      const req3 = new Request("http://localhost");
      expect(getClientIp(req3)).toBe("anonymous");
    });
  });

  // ─── Input Sanitization Tests ───────────────────────────────────────
  describe("sanitizeString", () => {
    it("strips ASCII control characters but preserves printable text", () => {
      const dirty = "Delhi \x00\x08Air\x1F Quality\x7F";
      expect(sanitizeString(dirty)).toBe("Delhi Air Quality");
    });

    it("trims outer whitespace", () => {
      expect(sanitizeString("   Mumbai Metro   ")).toBe("Mumbai Metro");
    });

    it("enforces max string length", () => {
      const longInput = "a".repeat(150);
      const sanitized = sanitizeString(longInput, 100);
      expect(sanitized.length).toBe(100);
    });

    it("handles non-string inputs safely without throwing", () => {
      expect(sanitizeString(null)).toBe("");
      expect(sanitizeString(undefined)).toBe("");
      expect(sanitizeString(12345)).toBe("");
      expect(sanitizeString({})).toBe("");
    });
  });
});
