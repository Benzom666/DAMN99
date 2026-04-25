// HERE Routing v8 API for polylines and ETAs
import { checkRoutingRateLimit } from "@/lib/rate-limiter"
import { assertHereBudget, recordHereUsage } from "@/lib/here/cost-control"

interface RouteCoordinate {
  lat: number
  lng: number
}

interface RoutePolyline {
  polyline: string // Flexible polyline encoded string
  distance: number // meters
  duration: number // seconds
}

interface RouteSection {
  distance: number
  duration: number
  summary?: string
}

interface RoutingResult {
  polylines: RoutePolyline[]
  sections: RouteSection[]
  totalDistance: number
  totalDuration: number
}

// Simple cache for route results (in-memory, per-instance)
const routeCache = new Map<string, { result: RoutingResult; timestamp: number }>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(coords: RouteCoordinate[]): string {
  return coords.map((c) => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`).join(";")
}

export async function getRoutePolylineInOrder(
  coords: RouteCoordinate[],
  userId?: string,
): Promise<RoutingResult | null> {
  try {
    const apiKey = process.env.HERE_API_KEY

    if (!apiKey) {
      console.error("HERE_API_KEY not configured")
      return null
    }

    if (coords.length < 2) {
      return null
    }

    // Check cache first
    const cacheKey = getCacheKey(coords)
    const cached = routeCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log("[v0] [ROUTING] Using cached route result")
      await recordHereUsage({
        service: "routing",
        operation: "route_polyline_in_order",
        userId,
        requestCount: 0,
        unitCount: 0,
        status: "cache_hit",
        cacheHit: true,
        metadata: { points: coords.length },
      })
      return cached.result
    }

    // Check rate limit before making expensive API call
    if (userId) {
      const rateLimit = checkRoutingRateLimit(userId)
      if (!rateLimit.allowed) {
        console.warn(`[v0] [ROUTING] Rate limit exceeded for user ${userId}`)
        // Return cached result even if stale, rather than failing
        if (cached) {
          console.log("[v0] [ROUTING] Returning stale cached result due to rate limit")
          await recordHereUsage({
            service: "routing",
            operation: "route_polyline_in_order",
            userId,
            requestCount: 0,
            unitCount: 0,
            status: "cache_hit",
            cacheHit: true,
            metadata: { source: "stale", points: coords.length },
          })
          return cached.result
        }
        throw new Error(`HERE Routing rate limit: ${rateLimit.error}`)
      }
    }

    await assertHereBudget({
      service: "routing",
      operation: "route_polyline_in_order",
      userId,
      projectedRequests: 1,
    })

    // Build origin, destination, and via points
    const origin = `${coords[0].lat},${coords[0].lng}`
    const destination = `${coords[coords.length - 1].lat},${coords[coords.length - 1].lng}`

    // Via points are all intermediate stops
    const viaPoints = coords.slice(1, -1).map((c) => `${c.lat},${c.lng}`)

    // Build URL
    const url = new URL("https://router.hereapi.com/v8/routes")
    url.searchParams.set("transportMode", "car")
    url.searchParams.set("origin", origin)
    url.searchParams.set("destination", destination)

    // Add via points
    viaPoints.forEach((via) => {
      url.searchParams.append("via", via)
    })

    url.searchParams.set("return", "polyline,summary,actions")
    url.searchParams.set("apiKey", apiKey)

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error(`HERE Routing API error: ${response.status}`)
      await recordHereUsage({
        service: "routing",
        operation: "route_polyline_in_order",
        userId,
        status: "error",
        httpStatus: response.status,
        errorMessage: `HERE Routing API error ${response.status}`,
        metadata: { points: coords.length },
      })
      return null
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      return null
    }

    const route = data.routes[0]
    const polylines: RoutePolyline[] = []
    const sections: RouteSection[] = []
    let totalDistance = 0
    let totalDuration = 0

    // Extract sections and polylines
    if (route.sections) {
      for (const section of route.sections) {
        polylines.push({
          polyline: section.polyline,
          distance: section.summary?.length || 0,
          duration: section.summary?.duration || 0,
        })

        sections.push({
          distance: section.summary?.length || 0,
          duration: section.summary?.duration || 0,
          summary: section.summary?.text,
        })

        totalDistance += section.summary?.length || 0
        totalDuration += section.summary?.duration || 0
      }
    }

    const result = {
      polylines,
      sections,
      totalDistance,
      totalDuration,
    }

    // Cache the result
    routeCache.set(cacheKey, { result, timestamp: Date.now() })
    console.log("[v0] [ROUTING] Cached new route result")
    await recordHereUsage({
      service: "routing",
      operation: "route_polyline_in_order",
      userId,
      status: "success",
      httpStatus: response.status,
      metadata: { points: coords.length, sections: sections.length },
    })

    return result
  } catch (error) {
    console.error("HERE Routing error:", error)
    await recordHereUsage({
      service: "routing",
      operation: "route_polyline_in_order",
      userId,
      status: "error",
      errorMessage: error instanceof Error ? error.message : "HERE Routing error",
      metadata: { points: coords.length },
    })
    return null
  }
}

/**
 * Clear the route cache (useful for testing or memory management)
 */
export function clearRouteCache(): void {
  routeCache.clear()
  console.log("[v0] [ROUTING] Route cache cleared")
}

// Decode flexible polyline (simplified - for production use HERE's official decoder)
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  // This is a placeholder - in production, use HERE's official flexible polyline decoder
  // or include the @here/flexible-polyline package
  // For now, return empty array - the map will still show markers
  console.warn("Polyline decoding not implemented - install @here/flexible-polyline")
  return []
}
