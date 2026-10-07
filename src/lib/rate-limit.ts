const MAX_ENTRIES = 5000;
const store = new Map<string, { count: number; resetAt: number }>();

function cleanupExpired(now: number) {
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) {
      store.delete(key);
    }
  }
}

export function rateLimit(ip: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();

  // Run cleanup when the store exceeds size threshold
  if (store.size >= MAX_ENTRIES) {
    cleanupExpired(now);
    // If still at capacity, evict the oldest entry to prevent unbounded memory growth
    if (store.size >= MAX_ENTRIES) {
      const oldestKey = store.keys().next().value;
      if (oldestKey) store.delete(oldestKey);
    }
  }

  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count++;
  return entry.count <= limit;
}

export function getClientIp(request: Request): string {
  // Check trusted proxy headers in order of specificity
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim().slice(0, 45);

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim().slice(0, 45);

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Leftmost is client IP if upstream proxy appends correctly
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp.slice(0, 45);
  }

  return 'unknown';
}

/**
 * Resets the in-memory store. Intended for unit testing.
 */
export function _resetRateLimitStore(): void {
  store.clear();
}