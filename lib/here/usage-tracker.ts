// Centralized HERE API usage tracking and daily cap enforcement

import { createClient } from "@/lib/supabase/server"

export type HereApiType = "tour_planning" | "routing" | "geocoding"

interface UsageLogParams {
  adminId?: string
  apiType: HereApiType
  ordersCount?: number
  success: boolean
  errorMessage?: string
  responseTimeMs?: number
  metadata?: Record<string, any>
}

/**
 * Log HERE API usage to database for monitoring and cost tracking
 */
export async function logHereApiUsage(params: UsageLogParams): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.from("here_api_usage").insert({
      admin_id: params.adminId || null,
      api_type: params.apiType,
      orders_count: params.ordersCount || null,
      success: params.success,
      error_message: params.errorMessage || null,
      response_time_ms: params.responseTimeMs || null,
      metadata: params.metadata || null,
    })

    if (error) {
      console.error("[v0] [HERE_USAGE] Failed to log usage:", error)
    }
  } catch (error) {
    // Don't throw - logging failures shouldn't break the main flow
    console.error("[v0] [HERE_USAGE] Exception logging usage:", error)
  }
}

/**
 * Check if daily HERE Tour Planning API limit has been reached
 * @returns { allowed: boolean, used: number, limit: number }
 */
export async function checkDailyTourPlanningLimit(adminId?: string): Promise<{
  allowed: boolean
  used: number
  limit: number
  message?: string
}> {
  try {
    const dailyLimit = Number(process.env.HERE_DAILY_LIMIT) || 100
    const supabase = await createClient()

    // Get today's date range (UTC)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    // Count today's tour planning API calls
    let query = supabase
      .from("here_api_usage")
      .select("id", { count: "exact", head: true })
      .eq("api_type", "tour_planning")
      .eq("success", true)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())

    // If adminId provided, filter by admin (for per-admin limits if needed)
    // For now, use global limit across all admins
    // if (adminId) {
    //   query = query.eq("admin_id", adminId)
    // }

    const { count, error } = await query

    if (error) {
      console.error("[v0] [HERE_USAGE] Error checking daily limit:", error)
      // On error, allow the request (fail open)
      return { allowed: true, used: 0, limit: dailyLimit }
    }

    const used = count || 0
    const allowed = used < dailyLimit

    console.log(`[v0] [HERE_USAGE] Daily limit check: ${used}/${dailyLimit} tour planning calls used today`)

    if (!allowed) {
      return {
        allowed: false,
        used,
        limit: dailyLimit,
        message: `Daily HERE Tour Planning limit reached (${used}/${dailyLimit}). Please try again tomorrow or contact support to increase your limit.`,
      }
    }

    return { allowed: true, used, limit: dailyLimit }
  } catch (error) {
    console.error("[v0] [HERE_USAGE] Exception checking limit:", error)
    // On exception, fail open to avoid blocking users
    return { allowed: true, used: 0, limit: 100 }
  }
}

/**
 * Get usage statistics for an admin
 */
export async function getUsageStats(adminId: string, days = 7): Promise<{
  tourPlanning: number
  routing: number
  geocoding: number
  total: number
}> {
  try {
    const supabase = await createClient()
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await supabase
      .from("here_api_usage")
      .select("api_type")
      .eq("admin_id", adminId)
      .eq("success", true)
      .gte("created_at", since.toISOString())

    if (error) {
      console.error("[v0] [HERE_USAGE] Error fetching stats:", error)
      return { tourPlanning: 0, routing: 0, geocoding: 0, total: 0 }
    }

    const stats = {
      tourPlanning: data?.filter((r) => r.api_type === "tour_planning").length || 0,
      routing: data?.filter((r) => r.api_type === "routing").length || 0,
      geocoding: data?.filter((r) => r.api_type === "geocoding").length || 0,
      total: data?.length || 0,
    }

    return stats
  } catch (error) {
    console.error("[v0] [HERE_USAGE] Exception fetching stats:", error)
    return { tourPlanning: 0, routing: 0, geocoding: 0, total: 0 }
  }
}
