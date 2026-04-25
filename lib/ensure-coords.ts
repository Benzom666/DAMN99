// lib/ensure-coords.ts
// Ensure orders have coordinates before optimization

"use server"

import { createClient } from "@/lib/supabase/server"
import { geocodeAddress } from "@/lib/geocode-here"

export interface OrderWithCoords {
  id: string
  latitude: number
  longitude: number
  [key: string]: any
}

/**
 * Ensure all orders have coordinates, geocoding missing ones
 * Returns updated orders array with geocoded coordinates
 * Mutates the input orders array to update coordinates in-place
 */
export async function ensureOrderCoordinates(orders: any[]): Promise<{
  orders: OrderWithCoords[]
  failed: Array<{ orderId: string; error: string }>
}> {
  const supabase = await createClient()
  const apiKey = process.env.HERE_API_KEY

  if (!apiKey) {
    throw new Error("HERE_API_KEY not configured")
  }

  const failed: Array<{ orderId: string; error: string }> = []

  const looksGridy = (v: number) => {
    if (!Number.isFinite(v)) return false
    const decimal = Math.abs(v - Math.floor(v))
    const lastDigit = Math.round((decimal * 100000) % 10)
    return lastDigit === 0
  }

  const needsRefresh = (o: any) =>
    !Number.isFinite(o.latitude) || !Number.isFinite(o.longitude) || looksGridy(o.latitude) || looksGridy(o.longitude)

  const ordersToGeocode = orders.filter(needsRefresh)

  if (ordersToGeocode.length === 0) {
    console.log("[v0] All orders already have valid coordinates")
    return { orders: orders as OrderWithCoords[], failed: [] }
  }

  console.log(
    `[v0] Geocoding ${ordersToGeocode.length} orders (including ${ordersToGeocode.filter((o) => looksGridy(o.latitude)).length} legacy grid coords)...`,
  )

  const ottawaBias = { lat: 45.4215, lng: -75.6972 }

  const BATCH_SIZE = Math.max(1, Math.min(Number(process.env.HERE_GEOCODING_BATCH_SIZE || 5), 10))
  const DELAY_BETWEEN_BATCHES = Number(process.env.HERE_GEOCODING_BATCH_DELAY_MS || 1000)
  const DELAY_BETWEEN_REQUESTS = Number(process.env.HERE_GEOCODING_REQUEST_DELAY_MS || 250)
  const MAX_RETRIES = Math.max(0, Math.min(Number(process.env.HERE_GEOCODING_RETRIES || 1), 2))

  for (let i = 0; i < ordersToGeocode.length; i += BATCH_SIZE) {
    const batch = ordersToGeocode.slice(i, i + BATCH_SIZE)
    console.log(
      `[v0] Processing geocoding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ordersToGeocode.length / BATCH_SIZE)}...`,
    )

    for (const o of batch) {
      const fullAddress =
        o.full_address ||
        o.delivery_address ||
        [o.address_line1 || o.address, o.city, o.state_province || o.state, o.postal_code || o.zip, o.country]
          .filter(Boolean)
          .join(", ")

      if (!fullAddress || fullAddress.trim().length === 0) {
        const error = "No address to geocode"
        failed.push({ orderId: o.id, error })
        console.warn(`[v0] ${error}:`, o.id)
        continue
      }

      // Retry logic with exponential backoff
      let g = null
      let lastError = ""

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          g = await geocodeAddress(fullAddress, apiKey, ottawaBias, {
            adminId: o.admin_id,
            orderId: o.id,
            operation: "ensure_order_coordinates",
          })
          if (g) break // Success!

          lastError = "Geocoding failed - no results"
        } catch (error) {
          if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
            lastError = "Rate limit exceeded"
            const backoffDelay = 2000 * Math.pow(2, attempt) // 2s, 4s, 8s
            console.warn(`[v0] Rate limit hit, waiting ${backoffDelay}ms before retry ${attempt + 1}/${MAX_RETRIES + 1}`)
            await new Promise((resolve) => setTimeout(resolve, backoffDelay))
            continue
          }
          lastError = error instanceof Error ? error.message : "Geocoding failed"
        }

        // If not rate limited, wait a bit before retry
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      if (!g) {
        failed.push({ orderId: o.id, error: lastError })
        console.warn(`[v0] ${lastError}:`, o.id, fullAddress)
        continue
      }

      o.latitude = g.lat
      o.longitude = g.lng

      try {
        const { error: dbError } = await supabase
          .from("orders")
          .update({
            latitude: g.lat,
            longitude: g.lng,
            geocode_at: new Date().toISOString(),
            geocode_label: g.label || null,
            geocode_status: "success",
            geocode_error: null,
          })
          .eq("id", o.id)

        if (dbError) {
          console.warn(`[v0] DB update failed (non-fatal):`, o.id, dbError.message)
        }
      } catch (e) {
        console.warn(`[v0] DB update exception (non-fatal):`, o.id, String(e))
      }

      console.log(`[v0] Geocoded ${o.id}: ${g.lat.toFixed(5)}, ${g.lng.toFixed(5)} - ${g.label}`)

      // Delay between individual requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
    }

    // Delay between batches
    if (i + BATCH_SIZE < ordersToGeocode.length) {
      console.log(`[v0] Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`)
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  console.log(
    "[v0] First 3 geocoded coords:",
    orders
      .slice(0, 3)
      .map((o) => `${o.id.slice(0, 8)}: ${o.latitude?.toFixed(5)}, ${o.longitude?.toFixed(5)}`)
      .join(" | "),
  )

  const stillMissing = orders.filter((o) => !Number.isFinite(o.latitude) || !Number.isFinite(o.longitude))
  if (stillMissing.length > 0) {
    console.warn(
      `[v0] ${stillMissing.length} orders still lack geocoded coords after geocoding (will be excluded from routes)`,
    )
  }

  if (failed.length > 0) {
    console.warn(`[v0] Failed to geocode ${failed.length} orders:`, JSON.stringify(failed))
  }

  return {
    orders: orders.filter((o) => Number.isFinite(o.latitude) && Number.isFinite(o.longitude)) as OrderWithCoords[],
    failed,
  }
}
