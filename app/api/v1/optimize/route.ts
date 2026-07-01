import { z } from "zod"
import { withApiKey, parseJson } from "@/lib/api-keys/handler"
import { optimizeStateless } from "@/lib/services/optimize-service"

export const runtime = "nodejs"

const StopSchema = z.object({
  id: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  serviceSeconds: z.number().int().nonnegative().optional(),
  quantity: z.number().int().nonnegative().optional(),
  windowStart: z.string().optional(),
  windowEnd: z.string().optional(),
})

const VehicleSchema = z.object({
  id: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  shiftStart: z.string().optional(),
  shiftEnd: z.string().optional(),
  returnToDepot: z.boolean().optional(),
})

const BodySchema = z.object({
  stops: z.array(StopSchema).min(1).max(1000),
  vehicles: z.array(VehicleSchema).max(100).optional(),
  depot: z.object({ lat: z.number(), lng: z.number() }).optional(),
  use2Opt: z.boolean().optional(),
})

/**
 * POST /api/v1/optimize
 * Stateless multi-vehicle route optimization. Send stops + vehicles (+ optional
 * depot) and receive sequenced routes. Nothing is persisted.
 */
export const POST = withApiKey(async (request, ctx) => {
  const body = await parseJson(request, BodySchema)
  return optimizeStateless(body, ctx.adminId)
})
