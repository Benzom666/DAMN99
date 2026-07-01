import "server-only"
import { geocodeBatch, type GeocodingResult } from "@/lib/geocoding"

export interface GeocodeAddressInput {
  address: string
  city?: string
  state?: string
  zip?: string
}

export interface GeocodeAddressResult {
  query: GeocodeAddressInput
  found: boolean
  latitude: number | null
  longitude: number | null
  formattedAddress: string | null
}

const MAX_ADDRESSES = 100

/**
 * Geocode a batch of addresses for an admin. Reuses the shared, cost-tracked,
 * cache-backed `geocodeBatch` so API calls benefit from the same memory +
 * persistent cache and daily-budget guards as the dashboard.
 */
export async function geocodeAddresses(
  adminId: string,
  addresses: GeocodeAddressInput[],
  apiKeyId?: string,
): Promise<GeocodeAddressResult[]> {
  if (addresses.length > MAX_ADDRESSES) {
    throw new Error(`Maximum ${MAX_ADDRESSES} addresses per request`)
  }

  const results = await geocodeBatch(addresses, undefined, { adminId, userId: adminId, apiKeyId })

  return addresses.map((query, i) => {
    const r: GeocodingResult | null = results[i]
    return {
      query,
      found: Boolean(r),
      latitude: r?.latitude ?? null,
      longitude: r?.longitude ?? null,
      formattedAddress: r?.formattedAddress ?? null,
    }
  })
}
