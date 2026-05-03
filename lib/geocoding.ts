export interface GeocodingResult {
  latitude: number
  longitude: number
  formattedAddress?: string
}

import { assertHereBudget, normalizeAddressKey, recordHereUsage } from "@/lib/here/cost-control"
import { createServiceRoleClient } from "@/lib/supabase/server"

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const geocodeCache = new Map<string, GeocodingResult | null>()

function canUsePersistentCache(): boolean {
  return (
    process.env.HERE_GEOCODING_PERSISTENT_CACHE !== "false" &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}

async function readPersistentCache(cacheKey: string): Promise<{ hit: boolean; result: GeocodingResult | null }> {
  if (!canUsePersistentCache()) return { hit: false, result: null }

  try {
    const supabase = createServiceRoleClient() as any
    const { data, error } = await supabase
      .from("here_geocode_cache")
      .select("latitude, longitude, formatted_address, result_found")
      .eq("cache_key", cacheKey)
      .maybeSingle()

    if (error || !data) return { hit: false, result: null }

    await supabase
      .from("here_geocode_cache")
      .update({ last_hit_at: new Date().toISOString() })
      .eq("cache_key", cacheKey)

    if (!data.result_found || data.latitude == null || data.longitude == null) {
      return { hit: true, result: null }
    }

    return {
      hit: true,
      result: {
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        formattedAddress: data.formatted_address || undefined,
      },
    }
  } catch {
    return { hit: false, result: null }
  }
}

async function writePersistentCache(
  cacheKey: string,
  query: string,
  result: GeocodingResult | null,
): Promise<void> {
  if (!canUsePersistentCache()) return

  try {
    const supabase = createServiceRoleClient() as any
    await supabase.from("here_geocode_cache").upsert({
      cache_key: cacheKey,
      query,
      latitude: result?.latitude ?? null,
      longitude: result?.longitude ?? null,
      formatted_address: result?.formattedAddress ?? null,
      result_found: Boolean(result),
      updated_at: new Date().toISOString(),
    })
  } catch {
    // Cache failures must never block order entry.
  }
}

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
  const apiKey = process.env.HERE_API_KEY

  if (!apiKey) {
    console.error("[v0] HERE_API_KEY not configured")
    return null
  }

  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey) ?? null
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
    return cached
  }

  const persistentCached = await readPersistentCache(cacheKey)
  if (persistentCached.hit) {
    geocodeCache.set(cacheKey, persistentCached.result)
    await recordHereUsage({
      service: "geocoding",
      operation: "geocode_single",
      ...context,
      requestCount: 0,
      unitCount: 0,
      status: "cache_hit",
      cacheHit: true,
      metadata: { source: "persistent" },
    })
    return persistentCached.result
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
        // Rate limited - exponential backoff
        const backoff = Math.min(1000 * Math.pow(2, attempt), 8000)
        console.warn(`[v0] Rate limited, waiting ${backoff}ms...`)
        await sleep(backoff)
        continue
      }

      if (response.status >= 500 && attempt < retries) {
        // Server error - retry with backoff
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
        await writePersistentCache(cacheKey, fullAddress, null)
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
      await writePersistentCache(cacheKey, fullAddress, geocoded)
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
  const results: Array<GeocodingResult | null> = new Array(addresses.length).fill(null)
  const effectiveBatchSize = Math.max(1, Math.min(batchSize, 10))
  const unique = new Map<string, { address: string; city?: string; state?: string; zip?: string; indexes: number[] }>()

  addresses.forEach((addr, index) => {
    const cacheKey = normalizeAddressKey([addr.address, addr.city, addr.state, addr.zip])
    const existing = unique.get(cacheKey)
    if (existing) {
      existing.indexes.push(index)
    } else {
      unique.set(cacheKey, { ...addr, indexes: [index] })
    }
  })

  const uniqueAddresses = Array.from(unique.values())

  for (let i = 0; i < uniqueAddresses.length; i += effectiveBatchSize) {
    const batch = uniqueAddresses.slice(i, i + effectiveBatchSize)
    console.log(
      `[v0] Geocoding batch ${Math.floor(i / effectiveBatchSize) + 1}/${Math.ceil(uniqueAddresses.length / effectiveBatchSize)}...`,
    )

    const batchResults = await Promise.all(
      batch.map((addr) => geocodeSingle(addr.address, addr.city, addr.state, addr.zip, 1, context)),
    )

    batchResults.forEach((result, batchIndex) => {
      for (const originalIndex of batch[batchIndex].indexes) {
        results[originalIndex] = result
      }
    })

    // Rate limiting between batches
    if (i + effectiveBatchSize < uniqueAddresses.length) {
      await sleep(Number(process.env.HERE_GEOCODING_BATCH_DELAY_MS || 1000))
    }
  }

  return results
}
