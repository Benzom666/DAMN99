import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { optimizeRouteWithDepot } from "@/lib/routing"
import { optimizeWithHereTourPlanning } from "@/lib/here/tour-planning"
import { buildHereProblemV3, buildMultiVehicleProblemV3 } from "@/lib/here/build-problem-v3"
import type { Order, VehicleConfig, Depot } from "@/lib/here/build-problem-v3"
import { clusterIntoRoutes } from "@/lib/clustering"
import { ensureOrderCoordinates } from "@/lib/ensure-coords"
import { env } from "@/lib/env"

const hereTourPlanningEnabled = () => process.env.HERE_TOUR_PLANNING_ENABLED === "true"

/**
 * Admin-controlled optimization constraints. All optional — anything omitted
 * falls back to the driver profile or a sane default.
 */
export interface RouteOptions {
  use2Opt?: boolean
  returnToDepot?: boolean
  capacity?: number
  shiftStart?: string
  shiftEnd?: string
}

/** Convert an "HH:MM" clock time into an ISO-Z timestamp for today. */
function shiftIso(hhmm?: string): string | undefined {
  if (!hhmm) return undefined
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return undefined
  const hh = m[1].padStart(2, "0")
  const today = new Date().toISOString().split("T")[0]
  return `${today}T${hh}:${m[2]}:00Z`
}

// ============================================================================
// READ HELPERS
// ============================================================================

export interface ListRoutesParams {
  status?: string
  includeArchived?: boolean
  limit?: number
  offset?: number
}

export async function listRoutes(supabase: SupabaseClient, adminId: string, params: ListRoutesParams = {}) {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200)
  const offset = Math.max(params.offset ?? 0, 0)

  let query = supabase
    .from("routes")
    .select("*, driver:profiles!driver_id(display_name, email)", { count: "exact" })
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.status) query = query.eq("status", params.status)
  if (!params.includeArchived) query = query.is("archived_at", null)

  const { data, error, count } = await query
  if (error) throw error
  return { routes: data ?? [], total: count ?? 0, limit, offset }
}

export async function getRouteWithStops(supabase: SupabaseClient, adminId: string, routeId: string) {
  const { data: route, error } = await supabase
    .from("routes")
    .select("*, driver:profiles!driver_id(display_name, email)")
    .eq("id", routeId)
    .eq("admin_id", adminId)
    .maybeSingle()
  if (error) throw error
  if (!route) return null

  const { data: stops } = await supabase
    .from("orders")
    .select("*")
    .eq("route_id", routeId)
    .eq("admin_id", adminId)
    .order("stop_sequence", { ascending: true })

  return { route, stops: stops ?? [] }
}

// ============================================================================
// CREATE (optimize + persist)
// ============================================================================

/**
 * Optimize + persist a single route from a set of order ids. Tenant scoping is
 * explicit (`admin_id`) so this is safe under both the cookie-session client and
 * the service-role client used by the public API. No cache revalidation here —
 * the calling server action does that.
 */
export async function createRouteCore(
  supabase: SupabaseClient,
  adminId: string,
  name: string,
  orderIds: string[],
  driverId: string | null,
  options: RouteOptions = {},
): Promise<string> {
  const use2Opt = options.use2Opt ?? false

  if (orderIds.length === 0) throw new Error("No orders selected")

  const { data: fetchedOrders, error: fetchError } = await supabase.from("orders").select("*").in("id", orderIds)
  if (fetchError) throw fetchError
  if (!fetchedOrders || fetchedOrders.length === 0) {
    throw new Error("No orders found. Please ensure orders have been imported.")
  }

  const ordersNeedingAdminId = fetchedOrders.filter((o: any) => !o.admin_id)
  const validOrders = fetchedOrders.filter((o: any) => !o.admin_id || o.admin_id === adminId)
  if (validOrders.length === 0) {
    throw new Error("No orders available. All selected orders belong to other admins.")
  }

  if (ordersNeedingAdminId.length > 0) {
    await supabase
      .from("orders")
      .update({ admin_id: adminId })
      .in("id", ordersNeedingAdminId.map((o: any) => o.id))
  }

  const { orders } = await ensureOrderCoordinates(validOrders, adminId)
  const validOrdersWithCoords = orders.filter((o: any) => o.latitude && o.longitude)
  if (validOrdersWithCoords.length === 0) throw new Error("No orders with valid coordinates")

  let depot: Depot | null = null
  let vehicleConfig: VehicleConfig = { id: driverId || "vehicle-1", capacity: 50, returnToDepot: true }

  if (driverId) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", driverId).single()
    if (profile) {
      if (profile.depot_lat && profile.depot_lng) depot = { lat: profile.depot_lat, lng: profile.depot_lng }
      vehicleConfig = {
        id: profile.id,
        capacity: profile.vehicle_capacity || 50,
        shiftStart: profile.shift_start ? `${new Date().toISOString().split("T")[0]}T${profile.shift_start}Z` : undefined,
        shiftEnd: profile.shift_end ? `${new Date().toISOString().split("T")[0]}T${profile.shift_end}Z` : undefined,
        returnToDepot: true,
      }
    }
  }

  if (options.capacity && options.capacity > 0) vehicleConfig.capacity = options.capacity
  if (options.returnToDepot !== undefined) vehicleConfig.returnToDepot = options.returnToDepot
  const csStart = shiftIso(options.shiftStart)
  const csEnd = shiftIso(options.shiftEnd)
  if (csStart) vehicleConfig.shiftStart = csStart
  if (csEnd) vehicleConfig.shiftEnd = csEnd

  const orderData: Order[] = validOrdersWithCoords.map((o: any) => ({
    id: o.id,
    latitude: o.latitude!,
    longitude: o.longitude!,
    service_seconds: o.service_seconds || 120,
    quantity: o.quantity || 1,
  }))

  let optimizedRoute: string[] = []
  let usedHere = false

  if (hereTourPlanningEnabled()) {
    try {
      const { problem, jobPlaceById } = await buildHereProblemV3(orderData, depot, vehicleConfig)
      const tours = await optimizeWithHereTourPlanning(problem, jobPlaceById, 90, adminId, adminId)
      if (tours.length > 0 && tours[0].orderedStopIds.length > 0) {
        optimizedRoute = tours[0].orderedStopIds.filter((id) => id !== "departure" && id !== "arrival")
        usedHere = true
      }
    } catch (error) {
      console.error("[route-service] HERE Tour Planning failed, using fallback:", error)
    }
  }

  if (!usedHere) {
    const stops = validOrdersWithCoords.map((o: any) => ({ id: o.id, latitude: o.latitude!, longitude: o.longitude! }))
    const fallbackDepot = depot ? { latitude: depot.lat, longitude: depot.lng } : undefined
    optimizedRoute = optimizeRouteWithDepot(stops, fallbackDepot, vehicleConfig.returnToDepot !== false, use2Opt)
  }

  const { data: route, error: routeError } = await supabase
    .from("routes")
    .insert({
      name,
      driver_id: driverId,
      status: "draft",
      total_stops: optimizedRoute.length,
      completed_stops: 0,
      admin_id: adminId,
    })
    .select()
    .single()
  if (routeError) throw routeError

  for (let i = 0; i < optimizedRoute.length; i++) {
    await supabase
      .from("orders")
      .update({ route_id: route.id, stop_sequence: i + 1, status: "assigned" })
      .eq("id", optimizedRoute[i])
      .or(`admin_id.eq.${adminId},admin_id.is.null`)
  }

  return route.id
}

/**
 * Optimize + persist multiple routes (whole-fleet VRP with clustering fallback).
 */
export async function createMultipleRoutesCore(
  supabase: SupabaseClient,
  adminId: string,
  orderIds: string[],
  driverIds: string[],
  numberOfRoutes: number,
  options: RouteOptions = {},
): Promise<string[]> {
  const use2Opt = options.use2Opt ?? false

  if (orderIds.length === 0) throw new Error("No orders selected")

  const createWithoutDrivers = driverIds.length === 0
  const routeCount = numberOfRoutes || Math.max(1, driverIds.length)

  await supabase
    .from("orders")
    .update({ status: "pending", route_id: null, stop_sequence: null })
    .in("id", orderIds)
    .or(`admin_id.eq.${adminId},admin_id.is.null`)

  const BATCH_SIZE = 100
  const fetchedOrders: any[] = []
  for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
    const batch = orderIds.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase.from("orders").select("*").in("id", batch)
    if (error) throw new Error(`Failed to fetch orders: ${error.message}`)
    if (data) fetchedOrders.push(...data)
  }

  if (fetchedOrders.length === 0) throw new Error("No orders found. Please ensure orders have been imported.")

  const ordersNeedingAdminId = fetchedOrders.filter((o) => !o.admin_id)
  const validOrders = fetchedOrders.filter((o) => !o.admin_id || o.admin_id === adminId)
  if (validOrders.length === 0) throw new Error("No orders available. All selected orders belong to other admins.")

  if (ordersNeedingAdminId.length > 0) {
    await supabase
      .from("orders")
      .update({ admin_id: adminId })
      .in("id", ordersNeedingAdminId.map((o) => o.id))
  }

  const { orders: geocodedOrders } = await ensureOrderCoordinates(validOrders, adminId)
  const validOrdersWithCoords = geocodedOrders.filter((o: any) => o.latitude && o.longitude)
  if (validOrdersWithCoords.length === 0) throw new Error("No orders with valid coordinates")

  let profiles: any[] = []
  if (!createWithoutDrivers && driverIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("id", driverIds)
      .or(`admin_id.eq.${adminId},admin_id.is.null`)
    if (data) {
      profiles = data
      const driversNeedingAdminId = profiles.filter((p) => !p.admin_id)
      if (driversNeedingAdminId.length > 0) {
        await supabase
          .from("profiles")
          .update({ admin_id: adminId })
          .in("id", driversNeedingAdminId.map((p) => p.id))
      }
    }
  }

  const MAX_ORDERS_PER_HERE_REQUEST = 500
  const today = new Date().toISOString().split("T")[0]
  const orderById = new Map(validOrdersWithCoords.map((o: any) => [o.id, o]))

  const vehicles: VehicleConfig[] = []
  const driverByVehicleId = new Map<string, any>()
  for (let i = 0; i < routeCount; i++) {
    const driver = !createWithoutDrivers ? profiles[i] : null
    const vehicleId = driver?.id || `vehicle-${i + 1}`
    vehicles.push({
      id: vehicleId,
      capacity: options.capacity && options.capacity > 0 ? options.capacity : driver?.vehicle_capacity || env.ROUTE_CAPACITY,
      shiftStart: shiftIso(options.shiftStart) ?? (driver?.shift_start ? `${today}T${driver.shift_start}Z` : undefined),
      shiftEnd: shiftIso(options.shiftEnd) ?? (driver?.shift_end ? `${today}T${driver.shift_end}Z` : undefined),
      returnToDepot: options.returnToDepot ?? true,
    })
    driverByVehicleId.set(vehicleId, driver)
  }

  const orderData: Order[] = validOrdersWithCoords.map((o: any) => ({
    id: o.id,
    latitude: o.latitude!,
    longitude: o.longitude!,
    service_seconds: o.service_seconds || 120,
    quantity: o.quantity || 1,
  }))

  const sharedDepot: Depot = {
    lat: orderData.reduce((s, o) => s + o.latitude, 0) / orderData.length,
    lng: orderData.reduce((s, o) => s + o.longitude, 0) / orderData.length,
  }

  let routeResults: Array<{ driverId: string | null; orderedIds: string[] }> = []
  let usedHere = false

  if (hereTourPlanningEnabled() && orderData.length <= MAX_ORDERS_PER_HERE_REQUEST && vehicles.length > 0) {
    try {
      const { problem, jobPlaceById } = await buildMultiVehicleProblemV3(orderData, sharedDepot, vehicles)
      const tours = await optimizeWithHereTourPlanning(problem, jobPlaceById, 120, adminId, adminId)

      if (tours.length > 0) {
        const assigned = new Set<string>()
        const matchDriverId = (vehicleId: string): string | null => {
          for (const v of vehicles) {
            if (vehicleId === v.id || vehicleId.startsWith(`${v.id}_`)) {
              return driverByVehicleId.get(v.id)?.id || null
            }
          }
          return null
        }

        for (const tour of tours) {
          const ids = tour.orderedStopIds.filter((id) => id !== "departure" && id !== "arrival")
          ids.forEach((id) => assigned.add(id))
          if (ids.length > 0) routeResults.push({ driverId: matchDriverId(tour.vehicleId), orderedIds: ids })
        }

        const leftovers = orderData.filter((o) => !assigned.has(o.id))
        if (leftovers.length > 0 && routeResults.length > 0) {
          const centroidOf = (ids: string[]) => {
            const pts = ids.map((id) => orderById.get(id)!).filter(Boolean)
            return {
              lat: pts.reduce((s, p) => s + p.latitude!, 0) / pts.length,
              lng: pts.reduce((s, p) => s + p.longitude!, 0) / pts.length,
            }
          }
          const centroids = routeResults.map((r) => centroidOf(r.orderedIds))
          const grew = new Set<number>()
          for (const o of leftovers) {
            let best = 0
            let bestD = Number.POSITIVE_INFINITY
            for (let i = 0; i < centroids.length; i++) {
              const d = Math.hypot(o.latitude - centroids[i].lat, o.longitude - centroids[i].lng)
              if (d < bestD) {
                bestD = d
                best = i
              }
            }
            routeResults[best].orderedIds.push(o.id)
            grew.add(best)
          }
          for (const i of grew) {
            const stops = routeResults[i].orderedIds.map((id) => {
              const o = orderById.get(id)!
              return { id, latitude: o.latitude!, longitude: o.longitude! }
            })
            routeResults[i].orderedIds = optimizeRouteWithDepot(stops, undefined, true, use2Opt)
          }
        }

        usedHere = routeResults.some((r) => r.orderedIds.length > 0)
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[route-service] HERE multi-vehicle optimization failed:", errorMessage)
      if (
        error?.isRateLimit ||
        errorMessage.includes("Too Many Requests") ||
        errorMessage.includes("rate limit") ||
        errorMessage.includes("429")
      ) {
        await new Promise((resolve) => setTimeout(resolve, 20000))
      }
    }
  }

  if (!usedHere) {
    routeResults = []
    const clusters = clusterIntoRoutes(
      validOrdersWithCoords.map((o: any) => ({
        id: o.id,
        latitude: o.latitude!,
        longitude: o.longitude!,
        city: o.city,
        state: o.state,
      })),
      routeCount,
    )

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i]
      const driver = !createWithoutDrivers ? profiles[i] : null
      const depot =
        driver?.depot_lat && driver?.depot_lng
          ? { latitude: driver.depot_lat, longitude: driver.depot_lng }
          : { latitude: cluster.centroid.lat, longitude: cluster.centroid.lng }
      const stops = cluster.orders.map((o) => ({ id: o.id, latitude: o.latitude, longitude: o.longitude }))
      const orderedIds = optimizeRouteWithDepot(stops, depot, options.returnToDepot ?? true, use2Opt)
      routeResults.push({ driverId: driver?.id || null, orderedIds })
    }
  }

  const createdRouteIds: string[] = []
  for (const result of routeResults) {
    const actualOrderIds = result.orderedIds.filter((id) => id !== "departure" && id !== "arrival")
    if (actualOrderIds.length === 0) continue

    const routeName = `Route ${createdRouteIds.length + 1}`
    try {
      const { data: route, error: routeError } = await supabase
        .from("routes")
        .insert({
          name: routeName,
          driver_id: result.driverId,
          status: "draft",
          total_stops: actualOrderIds.length,
          completed_stops: 0,
          admin_id: adminId,
        })
        .select()
        .single()

      if (routeError || !route?.id) {
        console.error("[route-service] Error creating route:", routeError)
        continue
      }

      await supabase
        .from("orders")
        .update({ route_id: route.id, status: "assigned" })
        .in("id", actualOrderIds)
        .or(`admin_id.eq.${adminId},admin_id.is.null`)

      for (let i = 0; i < actualOrderIds.length; i++) {
        await supabase.from("orders").update({ stop_sequence: i + 1 }).eq("id", actualOrderIds[i]).eq("route_id", route.id)
      }

      createdRouteIds.push(route.id)
    } catch (routeCreationError) {
      console.error("[route-service] Exception creating route:", routeCreationError)
      continue
    }
  }

  if (createdRouteIds.length === 0) {
    throw new Error("No routes were created. Please check the logs for errors.")
  }

  return createdRouteIds
}
