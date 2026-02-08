/**
 * Reference Data Cache
 *
 * Transparent in-memory cache for Bukku reference data (tax codes, currencies, etc.)
 * with 5-minute TTL per roadmap requirement LIST-02.
 *
 * Features:
 * - In-memory Map-based storage
 * - 5-minute TTL (configurable for testing)
 * - Lazy deletion: expired entries removed on access
 * - Cache key = reference data type name (e.g., "tax_codes", "currencies")
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class ReferenceDataCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs: number;

  /**
   * Create a new reference data cache
   * @param ttlMs Time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  /**
   * Get cached data by key
   * @param key Cache key (reference data type name)
   * @returns Cached data or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check expiration (lazy deletion)
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache with TTL
   * @param key Cache key (reference data type name)
   * @param data Data to cache
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Invalidate a specific cache entry
   * @param key Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }
}
