import { z } from "zod"
import { withApiKey, parseJson, ApiErrors } from "@/lib/api-keys/handler"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getOrder, updateOrderCore, deleteOrderCore } from "@/lib/services/order-service"

export const runtime = "nodejs"

const UpdateSchema = z
  .object({
    customer_name: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
    customer_email: z.string().email().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "At least one field is required" })

/** GET /api/v1/orders/:id */
export const GET = withApiKey(async (_request, ctx, routeCtx) => {
  const { id } = await routeCtx.params
  const supabase = createServiceRoleClient()
  const order = await getOrder(supabase, ctx.adminId, id)
  if (!order) throw ApiErrors.notFound("Order not found")
  return { order }
})

/** PATCH /api/v1/orders/:id */
export const PATCH = withApiKey(async (request, ctx, routeCtx) => {
  const { id } = await routeCtx.params
  const patch = await parseJson(request, UpdateSchema)
  const supabase = createServiceRoleClient()
  const order = await updateOrderCore(supabase, ctx.adminId, id, patch)
  if (!order) throw ApiErrors.notFound("Order not found")
  return { order }
})

/** DELETE /api/v1/orders/:id */
export const DELETE = withApiKey(async (_request, ctx, routeCtx) => {
  const { id } = await routeCtx.params
  const supabase = createServiceRoleClient()
  const deleted = await deleteOrderCore(supabase, ctx.adminId, id)
  if (!deleted) throw ApiErrors.notFound("Order not found")
  return { deleted: true }
})
