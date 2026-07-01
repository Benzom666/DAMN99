import { withApiKey, ApiErrors } from "@/lib/api-keys/handler"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getRouteWithStops } from "@/lib/services/route-service"

export const runtime = "nodejs"

/** GET /api/v1/routes/:id — route + ordered stops. */
export const GET = withApiKey(async (_request, ctx, routeCtx) => {
  const { id } = await routeCtx.params
  const supabase = createServiceRoleClient()
  const result = await getRouteWithStops(supabase, ctx.adminId, id)
  if (!result) throw ApiErrors.notFound("Route not found")
  return result
})
