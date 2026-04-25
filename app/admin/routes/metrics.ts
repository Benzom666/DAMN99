"use server"

import { createClient } from "@/lib/supabase/server"
import { getRoutePolylineInOrder } from "@/lib/here/routing"

interface RouteMetrics {
  distance_km: number
  duration_sec: number
  drive_time_sec: number
  service_time_sec: number
}

export async function recalcRouteMetrics(
  routeId: string,
  options: { serviceTimePerStopSec?: number } = {},
): Promise<RouteMetrics | null> {
  const serviceTimePerStopSec = options.serviceTimePerStopSec || 90

  console.log("[v0] [METRICS] Calculating metrics for route:", routeId)
  console.log("[v0] [METRICS] Service time per stop:", serviceTimePerStopSec, "seconds")

  const supabase = await createClient()

  // Load ordered stops for the route
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, latitude, longitude, stop_sequence")
    .eq("route_id", routeId)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("stop_sequence", { ascending: true })

  if (ordersError) {
    console.error("[v0] [METRICS] Error loading orders:", ordersError)
    return null
  }

  if (!orders || orders.length < 2) {
    console.log("[v0] [METRICS] Route has fewer than 2 stops, setting metrics to 0")

    // Update with zero metrics
    await supabase
      .from("routes")
      .update({
        distance_km: 0,
        duration_sec: 0,
        drive_time_sec: 0,
        service_time_sec: 0,
        metrics_updated_at: new Date().toISOString(),
      })
      .eq("id", routeId)

    return {
      distance_km: 0,
      duration_sec: 0,
      drive_time_sec: 0,
      service_time_sec: 0,
    }
  }

  // Check if any stops are missing coordinates
  const missingCoords = orders.filter((o) => !o.latitude || !o.longitude)
  if (missingCoords.length > 0) {
    console.error("[v0] [METRICS] Some stops missing coordinates:", missingCoords.length)
    return null
  }

  console.log("[v0] [METRICS] Processing", orders.length, "stops")

  // Build coordinates array
  const coords = orders.map((o) => ({
    lat: Number(o.latitude),
    lng: Number(o.longitude),
  }))

  const useHereRouting = process.env.HERE_ROUTING_METRICS_ENABLED === "true"
  const routingResult = useHereRouting ? await getRoutePolylineInOrder(coords) : null

  if (useHereRouting && !routingResult) {
    console.warn("[v0] [METRICS] HERE Routing API failed, falling back to straight-line estimate")
  }

  // Calculate metrics
  const straightLineKm = coords.slice(1).reduce((sum, coord, index) => {
    const prev = coords[index]
    const r = 6371
    const dLat = ((coord.lat - prev.lat) * Math.PI) / 180
    const dLng = ((coord.lng - prev.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((prev.lat * Math.PI) / 180) * Math.cos((coord.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return sum + 2 * r * Math.asin(Math.sqrt(a))
  }, 0)
  const distance_km = routingResult ? routingResult.totalDistance / 1000 : straightLineKm * 1.25
  const averageKmh = Number(process.env.ROUTE_METRICS_FALLBACK_SPEED_KMH || 35)
  const drive_time_sec = routingResult ? routingResult.totalDuration : Math.round((distance_km / averageKmh) * 3600)
  const service_time_sec = orders.length * serviceTimePerStopSec
  const duration_sec = drive_time_sec + service_time_sec

  console.log("[v0] [METRICS] Calculated metrics:")
  console.log("[v0] [METRICS] - Distance:", distance_km.toFixed(2), "km")
  console.log("[v0] [METRICS] - Drive time:", drive_time_sec, "seconds")
  console.log("[v0] [METRICS] - Service time:", service_time_sec, "seconds")
  console.log("[v0] [METRICS] - Total duration:", duration_sec, "seconds")

  // Update routes table
  const { error: updateError } = await supabase
    .from("routes")
    .update({
      distance_km,
      duration_sec,
      drive_time_sec,
      service_time_sec,
      metrics_updated_at: new Date().toISOString(),
    })
    .eq("id", routeId)

  if (updateError) {
    console.error("[v0] [METRICS] Error updating route:", updateError)
    return null
  }

  console.log("[v0] [METRICS] ✓ Metrics updated successfully for route:", routeId)

  return {
    distance_km,
    duration_sec,
    drive_time_sec,
    service_time_sec,
  }
}
