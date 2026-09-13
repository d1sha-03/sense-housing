const PREFIX = "sense:cache:v1:";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Thin wrapper around localStorage for caching address-keyed API responses
 * in the browser. Nominatim rate-limits to ~1 req/sec and Overpass can be
 * slow, so re-fetching the same address on every search is wasteful.
 */
export function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      window.localStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T, ttlMs: number): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — caching is a
    // convenience, so fail silently rather than breaking the search.
  }
}

/** Collapses whitespace/case differences so "123 Main St" and " 123 main st " share a cache entry. */
export function normalizeAddressKey(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}
