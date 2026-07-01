import { z } from "zod"
import { withApiKey, parseJson } from "@/lib/api-keys/handler"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { listRoutes, createRouteCore, createMultipleRoutesCore } from "@/lib/services/route-service"

export const runtime = "nodejs"

const OptionsSchema = z.object({
  use2Opt: z.boolean().optional(),
  returnToDepot: z.boolean().optional(),
  capacity: z.number().int().positive().optional(),
  shiftStart: z.string().optional(),
  shiftEnd: z.string().optional(),
})

const CreateSchema = z.object({
  name: z.string().optional(),
  orderIds: z.array(z.string()).min(1).max(1000),
  driverId: z.string().nullable().optional(),
  driverIds: z.array(z.string()).optional(),
  numberOfRoutes: z.number().int().positive().optional(),
  options: OptionsSchema.optional(),
})

/** GET /api/v1/routes — list the admin's routes (active by default). */
export const GET = withApiKey(async (request, ctx) => {
  const q = new URL(request.url).searchParams
  const supabase = createServiceRoleClient()
  return listRoutes(supabase, ctx.adminId, {
    status: q.get("status") || undefined,
    includeArchived: q.get("includeArchived") === "true",
    limit: q.get("limit") ? Number(q.get("limit")) : undefined,
    offset: q.get("offset") ? Number(q.get("offset")) : undefined,
  })
})

/**
 * POST /api/v1/routes — optimize + persist route(s) from order ids.
 * Provide `numberOfRoutes` (or multiple `driverIds`) to split into a fleet;
 * otherwise a single route is created.
 */
export const POST = withApiKey(async (request, ctx) => {
  const body = await parseJson(request, CreateSchema)
  const supabase = createServiceRoleClient()
  const options = body.options ?? {}

  const wantsMultiple = (body.numberOfRoutes ?? 0) > 1 || (body.driverIds?.length ?? 0) > 1

  if (wantsMultiple) {
    const routeIds = await createMultipleRoutesCore(
      supabase,
      ctx.adminId,
      body.orderIds,
      body.driverIds ?? [],
      body.numberOfRoutes ?? body.driverIds?.length ?? 1,
      options,
    )
    return new Response(JSON.stringify({ routeIds }), {
      status: 201,
      headers: { "content-type": "application/json" },
    })
  }

  const routeId = await createRouteCore(
    supabase,
    ctx.adminId,
    body.name || "API Route",
    body.orderIds,
    body.driverId ?? body.driverIds?.[0] ?? null,
    options,
  )
  return new Response(JSON.stringify({ routeId }), {
    status: 201,
    headers: { "content-type": "application/json" },
  })
})
