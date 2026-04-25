export interface GeocodingResult {
  latitude: number
  longitude: number
  formattedAddress?: string
}

import { assertHereBudget, normalizeAddressKey, recordHereUsage } from "@/lib/here/cost-control"

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const geocodeCache = new Map<string, GeocodingResult | null>()

async function geocodeSingle(
  address: string,
  city?: string,
  state?: string,
  zip?: string,
  retries = 2,
  context: { adminId?: string | null; userId?: string | null; orderId?: string | null } = {},
): Promise<GeocodingResult | null> {
  const fullAddress = [address, city, state, zip].filter(Boolean).join(", ")
  const cacheKey = normalizeAddressKey([address, city, state, zip])
  const apiKey = process.env.HERE_SERVER_API_KEY ?? process.env.HERE_API_KEY

  if (!apiKey) {
    console.error("[v0] HERE API key not configured")
    return null
  }

  if (geocodeCache.has(cacheKey)) {
    await recordHereUsage({
      service: "geocoding",
      operation: "geocode_single",
      ...context,
      requestCount: 0,
      unitCount: 0,
      status: "cache_hit",
      cacheHit: true,
      metadata: { source: "memory" },
    })
    return geocodeCache.get(cacheKey) ?? null
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await assertHereBudget({
        service: "geocoding",
        operation: "geocode_single",
        ...context,
        projectedRequests: 1,
      })

      const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(fullAddress)}&apiKey=${apiKey}`
      const response = await fetch(url, { cache: "no-store" })

      if (response.status === 429) {
        await recordHereUsage({
          service: "geocoding",
          operation: "geocode_single",
          ...context,
          status: "error",
          httpStatus: response.status,
          errorMessage: "HERE geocoding rate limited",
        })
        const backoff = Math.min(1000 * Math.pow(2, attempt), 8000)
        console.warn(`[v0] Rate limited, waiting ${backoff}ms...`)
        await sleep(backoff)
        continue
      }

      if (response.status >= 500 && attempt < retries) {
        const backoff = 500 * Math.pow(2, attempt)
        console.warn(`[v0] Server error ${response.status}, retrying in ${backoff}ms...`)
        await sleep(backoff)
        continue
      }

      if (!response.ok) {
        console.error(`[v0] Geocoding error ${response.status} for: ${fullAddress}`)
        await recordHereUsage({
          service: "geocoding",
          operation: "geocode_single",
          ...context,
          status: "error",
          httpStatus: response.status,
          errorMessage: `HERE geocoding error ${response.status}`,
        })
        return null
      }

      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        console.warn(`[v0] No geocoding results for: ${fullAddress}`)
        geocodeCache.set(cacheKey, null)
        await recordHereUsage({
          service: "geocoding",
          operation: "geocode_single",
          ...context,
          status: "success",
          httpStatus: response.status,
          metadata: { resultCount: 0 },
        })
        return null
      }

      const result = data.items[0]
      const geocoded = {
        latitude: result.position.lat,
        longitude: result.position.lng,
        formattedAddress: result.address?.label || fullAddress,
      }
      geocodeCache.set(cacheKey, geocoded)
      await recordHereUsage({
        service: "geocoding",
        operation: "geocode_single",
        ...context,
        status: "success",
        httpStatus: response.status,
        metadata: { resultType: result.resultType },
      })
      return geocoded
    } catch (error) {
      if (attempt === retries) {
        console.error(`[v0] Geocoding failed after ${retries + 1} attempts:`, error)
        await recordHereUsage({
          service: "geocoding",
          operation: "geocode_single",
          ...context,
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Geocoding failed",
        })
        return null
      }
      await sleep(500 * Math.pow(2, attempt))
    }
  }

  return null
}

export async function geocodeAddress(
  address: string,
  city?: string,
  state?: string,
  zip?: string,
  context?: { adminId?: string | null; userId?: string | null; orderId?: string | null },
): Promise<GeocodingResult | null> {
  return geocodeSingle(address, city, state, zip, 2, context)
}

export async function geocodeBatch(
  addresses: Array<{ address: string; city?: string; state?: string; zip?: string }>,
  batchSize = Number(process.env.HERE_GEOCODING_BATCH_SIZE || 5),
  context: { adminId?: string | null; userId?: string | null } = {},
): Promise<Array<GeocodingResult | null>> {
  const results: Array<GeocodingResult | null> = []
  const effectiveBatchSize = Math.max(1, Math.min(batchSize, 10))

  for (let i = 0; i < addresses.length; i += effectiveBatchSize) {
    const batch = addresses.slice(i, i + effectiveBatchSize)
    console.log(
      `[v0] Geocoding batch ${Math.floor(i / effectiveBatchSize) + 1}/${Math.ceil(addresses.length / effectiveBatchSize)}...`,
    )

    const batchResults = await Promise.all(
      batch.map((addr) => geocodeSingle(addr.address, addr.city, addr.state, addr.zip, 1, context)),
    )

    results.push(...batchResults)

    if (i + effectiveBatchSize < addresses.length) {
      await sleep(Number(process.env.HERE_GEOCODING_BATCH_DELAY_MS || 1000))
    }
  }

  return results
}
