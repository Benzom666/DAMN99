// lib/geocode-here.ts
// Global geocoding with HERE API - uses free-text queries with country bias

"use server"

import { assertHereBudget, normalizeAddressKey, recordHereUsage } from "@/lib/here/cost-control"
import { createServiceRoleClient } from "@/lib/supabase/server"

export interface GeocodeResult {
  lat: number
  lng: number
  label?: string
  quality?: string
}

/**
 * Normalize address string (fix smart quotes, trim)
 */
function normalizeAddr(s: string): string {
  return s
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes → straight
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes → straight
    .trim()
}

const geocodeCache = new Map<string, GeocodeResult | null>()

function canUsePersistentCache(): boolean {
  return (
    process.env.HERE_GEOCODING_PERSISTENT_CACHE !== "false" &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}

async function readPersistentCache(cacheKey: string): Promise<{ hit: boolean; result: GeocodeResult | null }> {
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
        lat: Number(data.latitude),
        lng: Number(data.longitude),
        label: data.formatted_address || undefined,
        quality: "cache",
      },
    }
  } catch {
    return { hit: false, result: null }
  }
}

async function writePersistentCache(cacheKey: string, query: string, result: GeocodeResult | null): Promise<void> {
  if (!canUsePersistentCache()) return

  try {
    const supabase = createServiceRoleClient() as any
    await supabase.from("here_geocode_cache").upsert({
      cache_key: cacheKey,
      query,
      latitude: result?.lat ?? null,
      longitude: result?.lng ?? null,
      formatted_address: result?.label ?? null,
      result_found: Boolean(result),
      updated_at: new Date().toISOString(),
    })
  } catch {
    // Cache failures must never block routing.
  }
}

/**
 * Geocode a single address using HERE Geocoding API v1 with free-text query
 * Biased to Ottawa, Canada for delivery precision
 */
export async function geocodeAddress(
  fullAddress: string,
  apiKey: string,
  bias?: { lat: number; lng: number },
  context: { adminId?: string | null; userId?: string | null; orderId?: string | null; operation?: string } = {},
): Promise<GeocodeResult | null> {
  if (!apiKey) {
    console.error("[v0] HERE_API_KEY not configured")
    return null
  }

  if (!fullAddress || fullAddress.trim().length === 0) {
    console.warn("[v0] Empty address provided for geocoding")
    return null
  }

  try {
    const q = normalizeAddr(fullAddress)
    const cacheKey = normalizeAddressKey([q, bias ? `${bias.lat},${bias.lng}` : null])

    if (geocodeCache.has(cacheKey)) {
      await recordHereUsage({
        service: "geocoding",
        operation: context.operation || "geocode_address",
        ...context,
        requestCount: 0,
        unitCount: 0,
        status: "cache_hit",
        cacheHit: true,
        metadata: { source: "memory" },
      })
      return geocodeCache.get(cacheKey) ?? null
    }

    const persistentCached = await readPersistentCache(cacheKey)
    if (persistentCached.hit) {
      geocodeCache.set(cacheKey, persistentCached.result)
      await recordHereUsage({
        service: "geocoding",
        operation: context.operation || "geocode_address",
        ...context,
        requestCount: 0,
        unitCount: 0,
        status: "cache_hit",
        cacheHit: true,
        metadata: { source: "persistent" },
      })
      return persistentCached.result
    }

    await assertHereBudget({
      service: "geocoding",
      operation: context.operation || "geocode_address",
      ...context,
      projectedRequests: 1,
    })

    const url = new URL("https://geocode.search.hereapi.com/v1/geocode")
    url.searchParams.set("q", q)
    url.searchParams.set("apiKey", apiKey)

    url.searchParams.set("in", "countryCode:CAN")
    if (bias) {
      url.searchParams.set("at", `${bias.lat},${bias.lng}`)
    }

    const response = await fetch(url.toString(), { cache: "no-store" })

    if (!response.ok) {
      await recordHereUsage({
        service: "geocoding",
        operation: context.operation || "geocode_address",
        ...context,
        status: "error",
        httpStatus: response.status,
        errorMessage: `HERE geocoding error ${response.status}`,
      })
      if (response.status === 429) {
        console.warn("[v0] Rate limit exceeded (429) - too many requests")
        throw new Error("RATE_LIMIT_EXCEEDED")
      }
      console.error(`[v0] Geocoding error ${response.status}`)
      return null
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.error("[v0] Non-JSON response from geocoding API:", text.substring(0, 100))
      await recordHereUsage({
        service: "geocoding",
        operation: context.operation || "geocode_address",
        ...context,
        status: "error",
        httpStatus: response.status,
        errorMessage: "HERE geocoding returned non-JSON response",
      })
      return null
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      console.warn("[v0] No geocoding results found for:", q)
      geocodeCache.set(cacheKey, null)
      await writePersistentCache(cacheKey, q, null)
      await recordHereUsage({
        service: "geocoding",
        operation: context.operation || "geocode_address",
        ...context,
        status: "success",
        httpStatus: response.status,
        metadata: { resultCount: 0 },
      })
      return null
    }

    const result = data.items[0]
    const best = result.access?.[0] ?? result.route?.[0] ?? result.position

    if (!best || !Number.isFinite(best.lat) || !Number.isFinite(best.lng)) {
      console.warn("[v0] Invalid coordinates in geocoding result:", result)
      await recordHereUsage({
        service: "geocoding",
        operation: context.operation || "geocode_address",
        ...context,
        status: "error",
        httpStatus: response.status,
        errorMessage: "HERE geocoding returned invalid coordinates",
      })
      return null
    }

    const geocoded = {
      lat: best.lat,
      lng: best.lng,
      label: result.address?.label ?? q,
      quality: result.resultType,
    }
    geocodeCache.set(cacheKey, geocoded)
    await writePersistentCache(cacheKey, q, geocoded)
    await recordHereUsage({
      service: "geocoding",
      operation: context.operation || "geocode_address",
      ...context,
      status: "success",
      httpStatus: response.status,
      metadata: { resultType: result.resultType },
    })
    return geocoded
  } catch (error) {
    console.error("[v0] Geocoding error:", error)
    if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
      throw error
    }
    return null
  }
}

/**
 * Geocode a single address with API key from environment
 * Convenience wrapper around geocodeAddress
 */
export async function geocodeHere(fullAddress: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.HERE_API_KEY
  if (!apiKey) {
    console.error("[v0] HERE_API_KEY not configured")
    return null
  }

  // Default Ottawa bias for depot geocoding
  const ottawaBias = { lat: 45.4215, lng: -75.6972 }

  return geocodeAddress(fullAddress, apiKey, ottawaBias, { operation: "geocode_depot" })
}

/**
 * Geocode multiple addresses with retry and rate limiting
 */
export async function geocodeBatch(
  addresses: string[],
  apiKey: string,
  options: {
    batchSize?: number
    retries?: number
    bias?: { lat: number; lng: number }
    adminId?: string | null
    userId?: string | null
  } = {},
): Promise<Array<{ result: GeocodeResult | null; error?: string }>> {
  const { batchSize = Number(process.env.HERE_GEOCODING_BATCH_SIZE || 5), retries = 1, bias } = options
  const effectiveBatchSize = Math.max(1, Math.min(batchSize, 10))
  const results: Array<{ result: GeocodeResult | null; error?: string }> = new Array(addresses.length).fill({
    result: null,
  })
  const unique = new Map<string, { address: string; indexes: number[] }>()

  addresses.forEach((address, index) => {
    const q = normalizeAddr(address)
    const cacheKey = normalizeAddressKey([q, bias ? `${bias.lat},${bias.lng}` : null])
    const existing = unique.get(cacheKey)
    if (existing) {
      existing.indexes.push(index)
    } else {
      unique.set(cacheKey, { address, indexes: [index] })
    }
  })

  const uniqueAddresses = Array.from(unique.values())

  for (let i = 0; i < uniqueAddresses.length; i += effectiveBatchSize) {
    const batch = uniqueAddresses.slice(i, i + effectiveBatchSize)
    console.log(
      `[v0] Geocoding batch ${Math.floor(i / effectiveBatchSize) + 1}/${Math.ceil(uniqueAddresses.length / effectiveBatchSize)}...`,
    )

    const batchResults = await Promise.all(
      batch.map(async ({ address: addr }) => {
        let lastError: string | undefined

        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const result = await geocodeAddress(addr, apiKey, bias, {
              adminId: options.adminId,
              userId: options.userId,
              operation: "geocode_batch",
            })
            if (result) {
              return { result, error: undefined }
            }
            lastError = "No results found"
          } catch (error) {
            lastError = error instanceof Error ? error.message : "Geocoding failed"
            if (attempt < retries) {
              await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)))
            }
          }
        }

        return { result: null, error: lastError || "Geocoding failed" }
      }),
    )

    batchResults.forEach((result, batchIndex) => {
      for (const originalIndex of batch[batchIndex].indexes) {
        results[originalIndex] = result
      }
    })

    // Rate limiting between batches
    if (i + effectiveBatchSize < uniqueAddresses.length) {
      await new Promise((resolve) => setTimeout(resolve, Number(process.env.HERE_GEOCODING_BATCH_DELAY_MS || 1000)))
    }
  }

  return results
}
