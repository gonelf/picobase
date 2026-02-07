/**
 * In-memory sliding window rate limiter.
 *
 * Each key (API key ID or IP) gets a fixed-size window. Requests are counted
 * within the window and rejected with 429 when the limit is exceeded.
 *
 * This is per-process — if you run multiple instances behind a load balancer,
 * each process has its own counters. For a single-process Next.js deployment
 * (Vercel, Railway) this is fine.
 */

interface RateLimitEntry {
  /** Timestamps of requests within the current window */
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    // Remove entries with no recent requests
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 60_000) {
      store.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetMs: number
}

/**
 * Check if a request is allowed under the rate limit.
 *
 * @param key - Unique identifier (API key ID, IP address, etc.)
 * @param limit - Max requests per window. Default: 100.
 * @param windowMs - Window size in ms. Default: 60_000 (1 minute).
 */
export function checkRateLimit(
  key: string,
  limit = 100,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart)

  if (entry.timestamps.length >= limit) {
    // Find when the earliest request in the window will expire
    const resetMs = entry.timestamps[0] + windowMs - now
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
    }
  }

  entry.timestamps.push(now)

  return {
    allowed: true,
    limit,
    remaining: limit - entry.timestamps.length,
    resetMs: entry.timestamps[0] + windowMs - now,
  }
}
