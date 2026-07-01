import "server-only"
import { createServiceRoleClient } from "@/lib/supabase/server"

export type HereApiService = "geocoding" | "routing" | "tour_planning" | "maps_js" | "unknown"
export type HereUsageStatus = "success" | "error" | "blocked" | "cache_hit"

type HereUsageInput = {
  service: HereApiService
  operation: string
  adminId?: string | null
  userId?: string | null
  apiKeyId?: string | null
  routeId?: string | null
  orderId?: string | null
  requestCount?: number
  unitCount?: number
  status?: HereUsageStatus
  httpStatus?: number | null
  cacheHit?: boolean
  usedOwnKey?: boolean
  metadata?: Record<string, unknown>
  errorMessage?: string
}

type BudgetCheckInput = {
  service: HereApiService
  operation: string
  adminId?: string | null
  userId?: string | null
  projectedRequests?: number
}

function centsFromEnv(name: string): number {
  const raw = process.env[name]
  if (!raw) return 0
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function serviceRatePerThousandCents(service: HereApiService): number {
  switch (service) {
    case "geocoding":
      return centsFromEnv("HERE_GEOCODING_COST_PER_1000_CENTS")
    case "routing":
      return centsFromEnv("HERE_ROUTING_COST_PER_1000_CENTS")
    case "tour_planning":
      return centsFromEnv("HERE_TOUR_PLANNING_COST_PER_1000_CENTS")
    case "maps_js":
      return centsFromEnv("HERE_MAPS_JS_COST_PER_1000_CENTS")
    default:
      return 0
  }
}

export function estimateHereCostCents(service: HereApiService, unitCount = 1): number {
  const rate = serviceRatePerThousandCents(service)
  if (!rate || unitCount <= 0) return 0
  return (rate / 1000) * unitCount
}

function getDailyBudgetCents(service: HereApiService): number {
  const specific = centsFromEnv(`HERE_${service.toUpperCase()}_DAILY_BUDGET_CENTS`)
  if (specific > 0) return specific
  return centsFromEnv("HERE_DAILY_BUDGET_CENTS")
}

function getDailyRequestLimit(service: HereApiService): number {
  const raw = process.env[`HERE_${service.toUpperCase()}_DAILY_REQUEST_LIMIT`]
  const parsed = raw ? Number(raw) : 0
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function canUseServiceRole(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function assertHereBudget(input: BudgetCheckInput): Promise<void> {
  const projectedRequests = input.projectedRequests ?? 1
  const requestLimit = getDailyRequestLimit(input.service)
  const budgetCents = getDailyBudgetCents(input.service)

  if ((!requestLimit && !budgetCents) || !canUseServiceRole()) return

  try {
    const supabase = createServiceRoleClient() as any
    const start = `${todayIsoDate()}T00:00:00.000Z`

    const { data, error } = await supabase
      .from("here_api_usage")
      .select("request_count, estimated_cost_cents")
      .eq("service", input.service)
      .gte("created_at", start)

    if (error) return

    const totals = (data || []).reduce(
      (acc: { requests: number; cost: number }, row: any) => {
        acc.requests += Number(row.request_count || 0)
        acc.cost += Number(row.estimated_cost_cents || 0)
        return acc
      },
      { requests: 0, cost: 0 },
    )

    if (requestLimit && totals.requests + projectedRequests > requestLimit) {
      await recordHereUsage({
        ...input,
        requestCount: 0,
        unitCount: projectedRequests,
        status: "blocked",
        errorMessage: `Daily ${input.service} request limit exceeded`,
      })
      throw new Error(`HERE ${input.service} daily request limit exceeded`)
    }

    const projectedCost = estimateHereCostCents(input.service, projectedRequests)
    if (budgetCents && totals.cost + projectedCost > budgetCents) {
      await recordHereUsage({
        ...input,
        requestCount: 0,
        unitCount: projectedRequests,
        status: "blocked",
        errorMessage: `Daily ${input.service} budget exceeded`,
      })
      throw new Error(`HERE ${input.service} daily budget exceeded`)
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("HERE ")) throw error
  }
}

export async function recordHereUsage(input: HereUsageInput): Promise<void> {
  if (!canUseServiceRole()) return

  const requestCount = input.requestCount ?? 1
  const unitCount = input.unitCount ?? requestCount
  const status = input.status ?? (input.cacheHit ? "cache_hit" : "success")

  try {
    const supabase = createServiceRoleClient() as any
    await supabase.from("here_api_usage").insert({
      service: input.service,
      operation: input.operation,
      admin_id: input.adminId || null,
      user_id: input.userId || null,
      api_key_id: input.apiKeyId || null,
      route_id: input.routeId || null,
      order_id: input.orderId || null,
      request_count: requestCount,
      unit_count: unitCount,
      estimated_cost_cents: estimateHereCostCents(input.service, unitCount),
      status,
      http_status: input.httpStatus || null,
      cache_hit: Boolean(input.cacheHit),
      used_own_key: Boolean(input.usedOwnKey),
      metadata: input.metadata || {},
      error_message: input.errorMessage || null,
    })
  } catch {
    // Telemetry must never make delivery workflows fail.
  }
}

export function normalizeAddressKey(parts: Array<string | null | undefined>): string {
  return parts
    .filter(Boolean)
    .join(", ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}
