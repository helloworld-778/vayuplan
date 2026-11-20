/**
 * Generic In-Memory TTL Cache with LRU/Oldest Eviction.
 *
 * Keeps memory bounded via `maxEntries` cap. Automatically expires items past their TTL.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private maxEntries: number;
  private defaultTtlMs: number;

  constructor(defaultTtlMs: number = 60000, maxEntries: number = 1000) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
  }

  /**
   * Retrieves an item if present and not expired.
   * If expired, deletes it and returns undefined.
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Refresh position for LRU semantics (delete and re-insert)
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value;
  }

  /**
   * Sets an item with an optional custom TTL in milliseconds.
   * Evicts oldest entry if maxEntries cap is reached.
   */
  set(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs !== undefined ? ttlMs : this.defaultTtlMs;
    const expiresAt = Date.now() + ttl;

    // Delete existing key if present to update order
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // Evict oldest entry (first item in Map iteration)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, { value, expiresAt });
  }

  /**
   * Deletes a key from cache. Returns true if key was present.
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clears all entries from cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Returns current count of valid unexpired items.
   */
  size(): number {
    const now = Date.now();
    let validCount = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      } else {
        validCount++;
      }
    }
    return validCount;
  }
}

// Global default singleton instance for convenience
const defaultCache = new MemoryCache<unknown>(60000, 1000);

export function get<T>(key: string): T | undefined {
  return defaultCache.get(key) as T | undefined;
}

export function set<T>(key: string, value: T, ttlMs?: number): void {
  defaultCache.set(key, value, ttlMs);
}

export function deleteKey(key: string): boolean {
  return defaultCache.delete(key);
}

export function clear(): void {
  defaultCache.clear();
}

export function size(): number {
  return defaultCache.size();
}
