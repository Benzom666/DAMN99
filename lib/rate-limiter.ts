"use server"

/**
 * HERE API Rate Limiter
 * Prevents runaway API calls that rack up charges
 * Simple in-memory rate limiting with sliding window
 */

type RateLimitKey = string

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limiting (per-instance, non-persistent)
const rateLimitStore = new Map<RateLimitKey, RateLimitEntry>()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number // milliseconds
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  error?: string
}

/**
 * Check if a request is within rate limits
 * @param key - Unique identifier for the operation (e.g., 'here_routing')
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status
 */
export function checkRateLimit(key: RateLimitKey, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const resetAt = now + config.windowMs

  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetAt <= now) {
      rateLimitStore.delete(k)
    }
  }

  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    // First request or expired window
    rateLimitStore.set(key, {
      count: 1,
      resetAt,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    }
  }

  if (current.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      error: `Rate limit exceeded. Try again after ${new Date(current.resetAt).toLocaleTimeString()}`,
    }
  }

  // Increment count
  current.count++
  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetAt: current.resetAt,
  }
}

// HERE API specific rate limits (conservative to prevent high bills)
export const HERE_RATE_LIMITS = {
  // Tour Planning: expensive, limit to 10 per minute
  TOUR_PLANNING: { maxRequests: 10, windowMs: 60 * 1000 },

  // Routing v8: also expensive, limit to 20 per minute
  ROUTING: { maxRequests: 20, windowMs: 60 * 1000 },

  // Geocoding: cheaper but still billable, limit to 60 per minute
  GEOCODING: { maxRequests: 60, windowMs: 60 * 1000 },
} as const

/**
 * Helper to check HERE Tour Planning rate limit
 */
export function checkTourPlanningRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`here_tour_planning_${userId}`, HERE_RATE_LIMITS.TOUR_PLANNING)
}

/**
 * Helper to check HERE Routing rate limit
 */
export function checkRoutingRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`here_routing_${userId}`, HERE_RATE_LIMITS.ROUTING)
}

/**
 * Helper to check HERE Geocoding rate limit
 */
export function checkGeocodingRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`here_geocoding_${userId}`, HERE_RATE_LIMITS.GEOCODING)
}
