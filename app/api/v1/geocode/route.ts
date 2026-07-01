import { z } from "zod"
import { withApiKey, parseJson } from "@/lib/api-keys/handler"
import { geocodeAddresses } from "@/lib/services/geocode-service"

export const runtime = "nodejs"

const BodySchema = z.object({
  addresses: z
    .array(
      z.object({
        address: z.string().min(1),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
      }),
    )
    .min(1)
    .max(100),
})

/**
 * POST /api/v1/geocode
 * Geocode a batch of addresses to coordinates (cache-backed, cost-tracked).
 */
export const POST = withApiKey(async (request, ctx) => {
  const { addresses } = await parseJson(request, BodySchema)
  const results = await geocodeAddresses(ctx.adminId, addresses, ctx.apiKeyId)
  return { results }
})
