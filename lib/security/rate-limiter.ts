// Rate limiting utility to prevent abuse
import { NextRequest } from "next/server"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const rateLimitStore: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

export function rateLimit(request: NextRequest, options: RateLimitOptions): { allowed: boolean; remaining: number } {
  const identifier = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const key = `${identifier}-${request.nextUrl.pathname}`
  const now = Date.now()

  if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + options.windowMs,
    }
    return { allowed: true, remaining: options.maxRequests - 1 }
  }

  rateLimitStore[key].count++

  if (rateLimitStore[key].count > options.maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: options.maxRequests - rateLimitStore[key].count }
}
