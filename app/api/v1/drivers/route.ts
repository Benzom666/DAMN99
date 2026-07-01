import { withApiKey } from "@/lib/api-keys/handler"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { listDrivers } from "@/lib/services/driver-service"

export const runtime = "nodejs"

/** GET /api/v1/drivers — list the admin's drivers. */
export const GET = withApiKey(async (request, ctx) => {
  const activeOnly = new URL(request.url).searchParams.get("activeOnly") === "true"
  const supabase = createServiceRoleClient()
  const drivers = await listDrivers(supabase, ctx.adminId, { activeOnly })
  return { drivers }
})
