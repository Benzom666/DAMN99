import { z } from "zod"
import { withApiKey, parseJson } from "@/lib/api-keys/handler"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { listOrders, createOrderCore } from "@/lib/services/order-service"

export const runtime = "nodejs"

const CreateSchema = z.object({
  customer_name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  customer_email: z.string().email().optional(),
  order_number: z.string().optional(),
})

/** GET /api/v1/orders — list the admin's orders (active manifest by default). */
export const GET = withApiKey(async (request, ctx) => {
  const url = new URL(request.url)
  const q = url.searchParams
  const supabase = createServiceRoleClient()
  return listOrders(supabase, ctx.adminId, {
    status: q.get("status") || undefined,
    routeId: q.get("routeId") || undefined,
    includeArchived: q.get("includeArchived") === "true",
    limit: q.get("limit") ? Number(q.get("limit")) : undefined,
    offset: q.get("offset") ? Number(q.get("offset")) : undefined,
  })
})

/** POST /api/v1/orders — create + geocode an order. */
export const POST = withApiKey(async (request, ctx) => {
  const input = await parseJson(request, CreateSchema)
  const supabase = createServiceRoleClient()
  const order = await createOrderCore(supabase, ctx.adminId, input)
  return new Response(JSON.stringify({ order }), {
    status: 201,
    headers: { "content-type": "application/json" },
  })
})
