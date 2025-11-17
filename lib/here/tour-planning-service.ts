// Centralized HERE Tour Planning API service with usage tracking and rate limiting

import { optimizeWithHereTourPlanning } from "./tour-planning"
import { logHereApiUsage, checkDailyTourPlanningLimit } from "./usage-tracker"
import type { OptimizedTour } from "./tour-planning"

interface TourPlanningRequest {
  problem: any
  jobPlaceById: Map<string, { lat: number; lng: number }>
  maxSeconds?: number
  adminId?: string
  metadata?: Record<string, any> // For logging context (route_id, batch_index, etc.)
}

interface TourPlanningResponse {
  success: boolean
  tours?: OptimizedTour[]
  error?: string
  limitReached?: boolean
  usageInfo?: {
    used: number
    limit: number
  }
}

/**
 * Centralized HERE Tour Planning API caller with:
 * - Daily usage cap enforcement
 * - Automatic usage logging
 * - Error handling and tracking
 * 
 * This is the ONLY function that should call the HERE Tour Planning API
 */
export async function callHereTourPlanning(request: TourPlanningRequest): Promise<TourPlanningResponse> {
  const startTime = Date.now()
  const ordersCount = request.problem?.plan?.jobs?.length || 0

  console.log(`[v0] [HERE_SERVICE] Tour planning request for ${ordersCount} orders`)

  // Check daily limit BEFORE making the API call
  const limitCheck = await checkDailyTourPlanningLimit(request.adminId)

  if (!limitCheck.allowed) {
    console.warn(`[v0] [HERE_SERVICE] Daily limit reached: ${limitCheck.used}/${limitCheck.limit}`)

    // Log the blocked attempt
    await logHereApiUsage({
      adminId: request.adminId,
      apiType: "tour_planning",
      ordersCount,
      success: false,
      errorMessage: "Daily limit reached",
      metadata: {
        ...request.metadata,
        limit_reached: true,
        used: limitCheck.used,
        limit: limitCheck.limit,
      },
    })

    return {
      success: false,
      limitReached: true,
      error: limitCheck.message,
      usageInfo: {
        used: limitCheck.used,
        limit: limitCheck.limit,
      },
    }
  }

  // Make the API call
  try {
    const tours = await optimizeWithHereTourPlanning(
      request.problem,
      request.jobPlaceById,
      request.maxSeconds || 120
    )

    const responseTime = Date.now() - startTime

    // Log successful call
    await logHereApiUsage({
      adminId: request.adminId,
      apiType: "tour_planning",
      ordersCount,
      success: true,
      responseTimeMs: responseTime,
      metadata: {
        ...request.metadata,
        tours_count: tours.length,
        total_stops: tours.reduce((sum, t) => sum + t.orderedStopIds.length, 0),
      },
    })

    console.log(
      `[v0] [HERE_SERVICE] Success: ${tours.length} tours, ${responseTime}ms, usage: ${limitCheck.used + 1}/${limitCheck.limit}`
    )

    return {
      success: true,
      tours,
      usageInfo: {
        used: limitCheck.used + 1,
        limit: limitCheck.limit,
      },
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Log failed call
    await logHereApiUsage({
      adminId: request.adminId,
      apiType: "tour_planning",
      ordersCount,
      success: false,
      errorMessage,
      responseTimeMs: responseTime,
      metadata: request.metadata,
    })

    console.error(`[v0] [HERE_SERVICE] Failed after ${responseTime}ms:`, errorMessage)

    return {
      success: false,
      error: errorMessage,
      usageInfo: {
        used: limitCheck.used,
        limit: limitCheck.limit,
      },
    }
  }
}
