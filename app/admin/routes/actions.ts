"use server"

import { createClient } from "@/lib/supabase/server"
import { optimizeRouteNearestNeighbor, optimize2Opt } from "@/lib/routing"
import { optimizeWithHereTourPlanning } from "@/lib/here/tour-planning"
import { buildHereProblemV3 } from "@/lib/here/build-problem-v3"
import type { Order, VehicleConfig, Depot } from "@/lib/here/build-problem-v3"
import { ensureOrderCoordinates } from "@/lib/ensure-coords"
import { revalidatePath } from "next/cache"
import { env } from "@/lib/env"
import { recalcRouteMetrics } from "./metrics"
import { buildCsv } from "@/lib/csv"

const hereTourPlanningEnabled = () => process.env.HERE_TOUR_PLANNING_ENABLED === "true"

// Helper function to parse warehouse location
function parseWarehouseLocation(location: string): Depot | null {
  // Try to parse as "lat,lng"
  const coords = location.split(",").map((s) => Number.parseFloat(s.trim()))
  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
    return {
      lat: coords[0],
      lng: coords[1],
    }
  }
  return null
}

export async function createRoute(
  name: string,
  orderIds: string[],
  driverId: string | null,
  use2Opt: boolean,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  if (orderIds.length === 0) {
    throw new Error("No orders selected")
  }

  console.log("[v0] [CREATE_ROUTE] Fetching orders for admin:", user.id)
  console.log("[v0] [CREATE_ROUTE] Order IDs:", orderIds.slice(0, 5))

  const { data: fetchedOrders, error: fetchError } = await supabase.from("orders").select("*").in("id", orderIds)

  console.log("[v0] [CREATE_ROUTE] Fetched orders count:", fetchedOrders?.length || 0)
  if (fetchError) {
    console.error("[v0] [CREATE_ROUTE] Fetch error:", fetchError)
  }

  if (!fetchedOrders || fetchedOrders.length === 0) {
    throw new Error("No orders found. Please ensure orders have been imported.")
  }

  const ordersNeedingAdminId = fetchedOrders.filter((o) => !o.admin_id)
  const validOrders = fetchedOrders.filter((o) => !o.admin_id || o.admin_id === user.id)

  if (validOrders.length === 0) {
    throw new Error("No orders available. All selected orders belong to other admins.")
  }

  if (ordersNeedingAdminId.length > 0) {
    console.log("[v0] [CREATE_ROUTE] Auto-assigning admin_id to", ordersNeedingAdminId.length, "orders")
    await supabase
      .from("orders")
      .update({ admin_id: user.id })
      .in(
        "id",
        ordersNeedingAdminId.map((o) => o.id),
      )
  }

  console.log("[v0] Ensuring all orders have coordinates...")
  const { orders, failed } = await ensureOrderCoordinates(validOrders)

  if (failed.length > 0) {
    console.warn(`[v0] Failed to geocode ${failed.length} orders:`, failed)
  }

  const validOrdersWithCoords = orders.filter((o) => o.latitude && o.longitude)

  if (validOrdersWithCoords.length === 0) {
    throw new Error("No orders with valid coordinates")
  }

  let depot: Depot | null = null
  let vehicleConfig: VehicleConfig = {
    id: driverId || "vehicle-1",
    capacity: 50,
    returnToDepot: true,
  }

  if (driverId) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", driverId).single()

    if (profile) {
      if (profile.depot_lat && profile.depot_lng) {
        depot = {
          lat: profile.depot_lat,
          lng: profile.depot_lng,
        }
      }

      vehicleConfig = {
        id: profile.id,
        capacity: profile.vehicle_capacity || 50,
        shiftStart: profile.shift_start ? `${new Date().toISOString().split("T")[0]}T${profile.shift_start}Z` : undefined,
        shiftEnd: profile.shift_end ? `${new Date().toISOString().split("T")[0]}T${profile.shift_end}Z` : undefined,
        returnToDepot: true,
      }
    }
  }

  const orderData: Order[] = validOrdersWithCoords.map((o) => ({
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

      const tours = await optimizeWithHereTourPlanning(problem, jobPlaceById, 90, user.id)

      if (tours.length > 0 && tours[0].orderedStopIds.length > 0) {
        optimizedRoute = tours[0].orderedStopIds
        usedHere = true
      }
    } catch (error) {
      console.error("[SERVER] [v0] HERE Tour Planning v3 failed, using fallback:", error)
    }
  } else {
    console.log("[SERVER] [v0] HERE Tour Planning disabled; using local route optimization")
  }

  if (!usedHere) {
    const stops = validOrdersWithCoords.map((o) => ({
      id: o.id,
      latitude: o.latitude!,
      longitude: o.longitude!,
    }))

    optimizedRoute = optimizeRouteNearestNeighbor(stops)

    if (use2Opt && stops.length >= 4) {
      optimizedRoute = optimize2Opt(stops, optimizedRoute)
    }
  }

  const { data: route, error: routeError } = await supabase
    .from("routes")
    .insert({
      name,
      driver_id: driverId,
      status: "draft",
      total_stops: optimizedRoute.length,
      completed_stops: 0,
      admin_id: user.id,
    })
    .select()
    .single()

  if (routeError) throw routeError

  for (let i = 0; i < optimizedRoute.length; i++) {
    await supabase
      .from("orders")
      .update({
        route_id: route.id,
        stop_sequence: i + 1,
        status: "assigned",
      })
      .eq("id", optimizedRoute[i])
      .or(`admin_id.eq.${user.id},admin_id.is.null`)
  }

  revalidatePath("/admin/routes")
  return route.id
}

export async function createMultipleRoutes(
  orderIds: string[],
  driverIds: string[],
  numberOfRoutes: number,
  use2Opt: boolean,
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    if (orderIds.length === 0) {
      throw new Error("No orders selected")
    }

    const createWithoutDrivers = driverIds.length === 0
    const routeCount = numberOfRoutes || Math.max(1, driverIds.length)

    console.log(
      "[v0] [CREATE_ROUTES] Creating",
      routeCount,
      "routes",
      createWithoutDrivers ? "without drivers" : `with ${driverIds.length} drivers`,
    )
    console.log("[v0] [CREATE_ROUTES] Order IDs count:", orderIds.length)

    console.log("[v0] [CREATE_ROUTES] Resetting order status to pending for routing...")
    await supabase
      .from("orders")
      .update({
        status: "pending",
        route_id: null,
        stop_sequence: null,
      })
      .in("id", orderIds)
      .or(`admin_id.eq.${user.id},admin_id.is.null`)

    const BATCH_SIZE = 100
    const fetchedOrders: any[] = []
    let fetchError: any = null

    for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
      const batch = orderIds.slice(i, i + BATCH_SIZE)
      const { data, error } = await supabase.from("orders").select("*").in("id", batch)

      if (error) {
        fetchError = error
        break
      }

      if (data) {
        fetchedOrders.push(...data)
      }
    }

    if (fetchError) {
      throw new Error(`Failed to fetch orders: ${fetchError.message}`)
    }

    if (fetchedOrders.length === 0) {
      throw new Error("No orders found. Please ensure orders have been imported.")
    }

    const ordersNeedingAdminId = fetchedOrders.filter((o) => !o.admin_id)
    const validOrders = fetchedOrders.filter((o) => !o.admin_id || o.admin_id === user.id)

    if (validOrders.length === 0) {
      throw new Error("No orders available. All selected orders belong to other admins.")
    }

    if (ordersNeedingAdminId.length > 0) {
      await supabase
        .from("orders")
        .update({ admin_id: user.id })
        .in(
          "id",
          ordersNeedingAdminId.map((o) => o.id),
        )
    }

    console.log("[v0] Ensuring all orders have coordinates...")
    const { orders: geocodedOrders, failed } = await ensureOrderCoordinates(validOrders)

    if (failed.length > 0) {
      console.warn(`[v0] Failed to geocode ${failed.length} orders:`, failed)
    }

    const validOrdersWithCoords = geocodedOrders.filter((o) => o.latitude && o.longitude)

    if (validOrdersWithCoords.length === 0) {
      throw new Error("No orders with valid coordinates")
    }

    let profiles: any[] = []
    if (!createWithoutDrivers && driverIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .in("id", driverIds)
        .or(`admin_id.eq.${user.id},admin_id.is.null`)

      if (data) {
        profiles = data
        const driversNeedingAdminId = profiles.filter((p) => !p.admin_id)
        if (driversNeedingAdminId.length > 0) {
          await supabase
            .from("profiles")
            .update({ admin_id: user.id })
            .in(
              "id",
              driversNeedingAdminId.map((p) => p.id),
            )
        }
      }
    }

    // Split orders evenly across the requested number of routes
    console.log(`[v0] Distributing ${validOrdersWithCoords.length} orders across ${routeCount} routes`)

    const ordersPerRoute = Math.ceil(validOrdersWithCoords.length / routeCount)
    const routeBatches: any[][] = []

    for (let i = 0; i < routeCount; i++) {
      const startIdx = i * ordersPerRoute
      const endIdx = Math.min(startIdx + ordersPerRoute, validOrdersWithCoords.length)
      const batchOrders = validOrdersWithCoords.slice(startIdx, endIdx)

      if (batchOrders.length > 0) {
        routeBatches.push(batchOrders)
      }
    }

    console.log(
      `[v0] Created ${routeBatches.length} route batches with sizes:`,
      routeBatches.map((b) => b.length),
    )

    const createdRouteIds: string[] = []
    const MAX_ORDERS_PER_HERE_REQUEST = 500
    const DELAY_BETWEEN_ROUTES_MS = 3000

    for (let batchIndex = 0; batchIndex < routeBatches.length; batchIndex++) {
      if (batchIndex > 0) {
        console.log(`[v0] Waiting ${DELAY_BETWEEN_ROUTES_MS / 1000}s before processing next route...`)
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_ROUTES_MS))
      }

      const batchOrders = routeBatches[batchIndex]

      const orderData: Order[] = batchOrders.map((o) => ({
        id: o.id,
        latitude: o.latitude!,
        longitude: o.longitude!,
        service_seconds: o.service_seconds || 120,
        quantity: o.quantity || 1,
      }))

      // Calculate centroid for this batch as depot
      const centroidLat = orderData.reduce((sum, o) => sum + o.latitude, 0) / orderData.length
      const centroidLng = orderData.reduce((sum, o) => sum + o.longitude, 0) / orderData.length

      const batchDepot: Depot = {
        lat: centroidLat,
        lng: centroidLng,
      }

      // Get driver for this route (if available)
      const driver = !createWithoutDrivers && profiles[batchIndex] ? profiles[batchIndex] : null
      const driverId = driver?.id || null

      // Build vehicle config
      const vehicleConfig: VehicleConfig = {
        id: driverId || `vehicle-${batchIndex + 1}`,
        capacity: driver?.vehicle_capacity || env.ROUTE_CAPACITY,
        shiftStart: driver?.shift_start
          ? `${new Date().toISOString().split("T")[0]}T${driver.shift_start}Z`
          : undefined,
        shiftEnd: driver?.shift_end ? `${new Date().toISOString().split("T")[0]}T${driver.shift_end}Z` : undefined,
        returnToDepot: true,
      }

      let optimizedRoute: string[] = []
      let usedHere = false

      // Try HERE optimization only when explicitly enabled and batch is not too large.
      if (hereTourPlanningEnabled() && orderData.length <= MAX_ORDERS_PER_HERE_REQUEST) {
        try {
          const { problem, jobPlaceById } = await buildHereProblemV3(orderData, batchDepot, vehicleConfig)
          const tours = await optimizeWithHereTourPlanning(problem, jobPlaceById, 120, user.id)

          if (tours.length > 0 && tours[0].orderedStopIds.length > 0) {
            optimizedRoute = tours[0].orderedStopIds
            usedHere = true
            console.log(`[v0] HERE optimized route ${batchIndex + 1} with ${optimizedRoute.length} stops`)
          }
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`[v0] HERE optimization failed for route ${batchIndex + 1}:`, errorMessage)

          if (
            error?.isRateLimit ||
            errorMessage.includes("Too Many Requests") ||
            errorMessage.includes("rate limit") ||
            errorMessage.includes("429")
          ) {
            console.log("[v0] Rate limit detected, waiting 20 seconds before fallback...")
            await new Promise((resolve) => setTimeout(resolve, 20000))
          }
        }
      } else if (orderData.length > MAX_ORDERS_PER_HERE_REQUEST) {
        console.log(`[v0] Batch ${batchIndex + 1} has ${orderData.length} orders, exceeds HERE limit, using fallback`)
      } else {
        console.log(`[v0] HERE Tour Planning disabled, using fallback for route ${batchIndex + 1}`)
      }

      // Use fallback optimization if HERE failed or wasn't used
      if (!usedHere) {
        console.log(`[v0] Using fallback optimization for route ${batchIndex + 1} with ${orderData.length} orders`)
        const stops = orderData.map((o) => ({
          id: o.id,
          latitude: o.latitude,
          longitude: o.longitude,
        }))

        optimizedRoute = optimizeRouteNearestNeighbor(stops)

        if (use2Opt && stops.length >= 4) {
          optimizedRoute = optimize2Opt(stops, optimizedRoute)
        }
      }

      // Create the route
      if (optimizedRoute.length > 0) {
        const routeName = `Route ${createdRouteIds.length + 1}`

        try {
          const actualOrderIds = optimizedRoute.filter((id) => id !== "departure" && id !== "arrival")

          const { data: route, error: routeError } = await supabase
            .from("routes")
            .insert({
              name: routeName,
              driver_id: driverId,
              status: "draft",
              total_stops: actualOrderIds.length,
              completed_stops: 0,
              admin_id: user.id,
            })
            .select()
            .single()

          if (routeError) {
            console.error("[v0] Error creating route:", routeError)
            continue
          }

          if (!route?.id) {
            console.error("[v0] Route created but no ID returned")
            continue
          }

          const { error: updateError } = await supabase
            .from("orders")
            .update({
              route_id: route.id,
              status: "assigned",
            })
            .in("id", actualOrderIds)
            .or(`admin_id.eq.${user.id},admin_id.is.null`)

          if (updateError) {
            console.error("[v0] Error updating orders:", updateError)
          }

          for (let i = 0; i < actualOrderIds.length; i++) {
            await supabase
              .from("orders")
              .update({ stop_sequence: i + 1 })
              .eq("id", actualOrderIds[i])
              .eq("route_id", route.id)
          }

          createdRouteIds.push(route.id)
          console.log(`[v0] Created route ${route.id} with ${actualOrderIds.length} stops`)
        } catch (routeCreationError) {
          console.error("[v0] Exception creating route:", routeCreationError)
          continue
        }
      }
    }

    console.log(`[v0] Created ${createdRouteIds.length} total routes out of ${routeCount} requested`)

    if (createdRouteIds.length === 0) {
      throw new Error("No routes were created. Please check the logs for errors.")
    }

    revalidatePath("/admin/routes")
    revalidatePath("/admin")

    return createdRouteIds
  } catch (error) {
    console.error("[v0] [CREATE_ROUTES] Error:", error)
    throw error
  }
}

export async function updateRouteStatus(routeId: string, status: "draft" | "active" | "completed") {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Build update payload. When the route transitions to "completed", stamp the
  // completed_at timestamp so it appears correctly in route history exports.
  const updatePayload: Record<string, any> = { status }
  if (status === "completed") {
    updatePayload.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from("routes")
    .update(updatePayload)
    .eq("id", routeId)
    .eq("admin_id", user.id)

  if (error) throw error

  if (status === "active") {
    await supabase.from("orders").update({ status: "in_transit" }).eq("route_id", routeId).eq("admin_id", user.id)
  }

  revalidatePath("/admin/routes")
  revalidatePath("/admin/dispatch")
}

export async function deleteRoute(routeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: route } = await supabase.from("routes").select("admin_id").eq("id", routeId).single()

  if (!route || route.admin_id !== user.id) {
    throw new Error("Unauthorized: Route not found or access denied")
  }

  await supabase
    .from("orders")
    .update({ route_id: null, stop_sequence: null, status: "pending" })
    .eq("route_id", routeId)
    .eq("admin_id", user.id)

  const { error } = await supabase.from("routes").delete().eq("id", routeId).eq("admin_id", user.id)

  if (error) throw error

  revalidatePath("/admin/routes")
}

export async function assignDriver(routeId: string, driverId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: driver } = await supabase.from("profiles").select("admin_id").eq("id", driverId).single()

  if (!driver || driver.admin_id !== user.id) {
    throw new Error("Unauthorized: Driver not found or access denied")
  }

  const { error } = await supabase
    .from("routes")
    .update({ driver_id: driverId })
    .eq("id", routeId)
    .eq("admin_id", user.id)

  if (error) throw error

  revalidatePath("/admin/routes")
}

export async function updateRoute(
  routeId: string,
  updates: {
    name?: string
    driver_id?: string | null
    status?: "draft" | "active" | "completed"
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  console.log("[v0] Updating route", routeId, "with", updates)

  const { error } = await supabase.from("routes").update(updates).eq("id", routeId).eq("admin_id", user.id)

  if (error) {
    console.error("[v0] Error updating route:", error)
    throw error
  }

  revalidatePath("/admin/routes")
  revalidatePath(`/admin/routes/${routeId}`)
  revalidatePath("/admin/dispatch")
  return { success: true }
}

export async function recalcRouteMetricsAction(routeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin only")
  }

  console.log("[v0] [METRICS] Recalculating metrics for route:", routeId)

  const serviceTimePerStopSec = Number(process.env.NEXT_PUBLIC_SERVICE_TIME_PER_STOP_SEC) || 90

  const metrics = await recalcRouteMetrics(routeId, { serviceTimePerStopSec })

  if (!metrics) {
    throw new Error("Failed to calculate metrics")
  }

  revalidatePath(`/admin/routes/${routeId}`)
  revalidatePath("/admin/routes")

  return metrics
}

export async function bulkDeleteRoutes(routeIds: string[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  console.log("[v0] [BULK_DELETE] Deleting", routeIds.length, "routes")

  const BATCH_SIZE = 50
  let deleted = 0
  const errors: string[] = []

  for (let i = 0; i < routeIds.length; i += BATCH_SIZE) {
    const batch = routeIds.slice(i, i + BATCH_SIZE)

    try {
      // Reset orders to pending for this batch of routes
      await supabase
        .from("orders")
        .update({ route_id: null, stop_sequence: null, status: "pending" })
        .in("route_id", batch)
        .eq("admin_id", user.id)

      // Delete the routes
      const { error } = await supabase.from("routes").delete().in("id", batch).eq("admin_id", user.id)

      if (error) {
        console.error("[v0] [BULK_DELETE] Error deleting batch:", error)
        errors.push(`Batch ${i / BATCH_SIZE + 1}: ${error.message}`)
      } else {
        deleted += batch.length
      }
    } catch (error) {
      console.error("[v0] [BULK_DELETE] Exception deleting batch:", error)
      errors.push(`Batch ${i / BATCH_SIZE + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  console.log("[v0] [BULK_DELETE] Deleted", deleted, "routes with", errors.length, "errors")

  revalidatePath("/admin/routes")
  revalidatePath("/admin")

  return { deleted, errors }
}

export async function bulkAssignDriver(routeIds: string[], driverId: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  console.log("[v0] [BULK_ASSIGN] Assigning driver", driverId || "unassigned", "to", routeIds.length, "routes")

  // Verify driver belongs to admin if not null
  if (driverId) {
    const { data: driver } = await supabase.from("profiles").select("admin_id").eq("id", driverId).single()

    if (!driver || (driver.admin_id && driver.admin_id !== user.id)) {
      throw new Error("Unauthorized: Driver not found or access denied")
    }
  }

  const BATCH_SIZE = 50
  let updated = 0
  const errors: string[] = []

  for (let i = 0; i < routeIds.length; i += BATCH_SIZE) {
    const batch = routeIds.slice(i, i + BATCH_SIZE)

    try {
      const { error } = await supabase
        .from("routes")
        .update({ driver_id: driverId })
        .in("id", batch)
        .eq("admin_id", user.id)

      if (error) {
        console.error("[v0] [BULK_ASSIGN] Error assigning batch:", error)
        errors.push(`Batch ${i / BATCH_SIZE + 1}: ${error.message}`)
      } else {
        updated += batch.length
      }
    } catch (error) {
      console.error("[v0] [BULK_ASSIGN] Exception assigning batch:", error)
      errors.push(`Batch ${i / BATCH_SIZE + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  console.log("[v0] [BULK_ASSIGN] Updated", updated, "routes with", errors.length, "errors")

  revalidatePath("/admin/routes")
  revalidatePath("/admin/dispatch")

  return { updated, errors }
}


// ============================================================================
// ROUTE HISTORY / ARCHIVAL / EXPORT
// ============================================================================
// Snapshots a route + its stops into route_history (immutable archive) and
// flags the route as archived. Archived routes are hidden from the main
// listing by default but remain queryable via /admin/routes/history.

interface RouteSnapshotStop {
  order_id: string
  order_number: string | null
  customer_name: string
  customer_email: string | null
  address: string
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  latitude: number | null
  longitude: number | null
  stop_sequence: number | null
  status: string
  notes: string | null
  retry_count: number | null
  last_failed_at: string | null
  pod_photo_url: string | null
  pod_signature_url: string | null
  pod_recipient_name: string | null
  pod_notes: string | null
  pod_delivered_at: string | null
}

async function buildRouteSnapshot(supabase: any, routeId: string, adminId: string) {
  const { data: route, error: routeError } = await supabase
    .from("routes")
    .select("*, driver:profiles!driver_id(display_name, email)")
    .eq("id", routeId)
    .eq("admin_id", adminId)
    .single()

  if (routeError || !route) {
    throw new Error("Route not found or access denied")
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("route_id", routeId)
    .order("stop_sequence", { ascending: true })

  const orderIds = (orders || []).map((o: any) => o.id)

  // Load latest POD per order (if any) so the snapshot is fully self-contained
  const podsByOrder = new Map<string, any>()
  if (orderIds.length > 0) {
    const { data: pods } = await supabase
      .from("pods")
      .select("*")
      .in("order_id", orderIds)
      .order("delivered_at", { ascending: false })
    for (const pod of pods || []) {
      if (!podsByOrder.has(pod.order_id)) {
        podsByOrder.set(pod.order_id, pod)
      }
    }
  }

  const stops: RouteSnapshotStop[] = (orders || []).map((o: any) => {
    const pod = podsByOrder.get(o.id)
    return {
      order_id: o.id,
      order_number: o.order_number ?? null,
      customer_name: o.customer_name,
      customer_email: o.customer_email ?? null,
      address: o.address,
      city: o.city ?? null,
      state: o.state ?? null,
      zip: o.zip ?? null,
      phone: o.phone ?? null,
      latitude: o.latitude ?? null,
      longitude: o.longitude ?? null,
      stop_sequence: o.stop_sequence ?? null,
      status: o.status,
      notes: o.notes ?? null,
      retry_count: o.retry_count ?? 0,
      last_failed_at: o.last_failed_at ?? null,
      pod_photo_url: pod?.photo_url ?? null,
      pod_signature_url: pod?.signature_url ?? null,
      pod_recipient_name: pod?.recipient_name ?? null,
      pod_notes: pod?.notes ?? null,
      pod_delivered_at: pod?.delivered_at ?? null,
    }
  })

  const completedStops = stops.filter((s) => s.status === "delivered").length
  const failedStops = stops.filter((s) => s.status === "failed").length

  return { route, stops, completedStops, failedStops }
}

export async function archiveRoute(routeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { route, stops, completedStops, failedStops } = await buildRouteSnapshot(supabase, routeId, user.id)

  // Insert immutable snapshot row (don't fail archive if a snapshot already
  // exists for this route — the table has no unique constraint, but multiple
  // snapshots are intentionally allowed for re-archived routes).
  const { error: histError } = await supabase.from("route_history").insert({
    route_id: route.id,
    admin_id: user.id,
    name: route.name,
    driver_id: route.driver_id,
    driver_name: route.driver?.display_name ?? null,
    driver_email: route.driver?.email ?? null,
    status: route.status,
    total_stops: stops.length,
    completed_stops: completedStops,
    failed_stops: failedStops,
    distance_km: route.distance_km ?? null,
    duration_sec: route.duration_sec ?? null,
    created_at: route.created_at,
    completed_at: route.completed_at ?? null,
    snapshot: {
      route: {
        id: route.id,
        name: route.name,
        status: route.status,
        driver_id: route.driver_id,
        driver_name: route.driver?.display_name ?? null,
        driver_email: route.driver?.email ?? null,
        distance_km: route.distance_km ?? null,
        duration_sec: route.duration_sec ?? null,
        drive_time_sec: route.drive_time_sec ?? null,
        service_time_sec: route.service_time_sec ?? null,
        depot_lat: route.depot_lat ?? null,
        depot_lng: route.depot_lng ?? null,
        created_at: route.created_at,
        completed_at: route.completed_at ?? null,
      },
      stops,
      archived_by: user.id,
    },
  })

  if (histError) {
    console.error("[v0] [ARCHIVE_ROUTE] Failed to write history snapshot:", histError)
    throw new Error(`Failed to archive route: ${histError.message}`)
  }

  // Mark route as archived (it stays in the routes table, just filtered out)
  const { error: routeUpdateError } = await supabase
    .from("routes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", routeId)
    .eq("admin_id", user.id)

  if (routeUpdateError) {
    console.error("[v0] [ARCHIVE_ROUTE] Failed to flag route as archived:", routeUpdateError)
    throw routeUpdateError
  }

  revalidatePath("/admin/routes")
  revalidatePath("/admin/routes/history")
  revalidatePath(`/admin/routes/${routeId}`)
  return { success: true }
}

export async function unarchiveRoute(routeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("routes")
    .update({ archived_at: null })
    .eq("id", routeId)
    .eq("admin_id", user.id)

  if (error) throw error

  revalidatePath("/admin/routes")
  revalidatePath("/admin/routes/history")
  return { success: true }
}

export async function bulkArchiveRoutes(routeIds: string[]) {
  let archived = 0
  const errors: string[] = []

  for (const id of routeIds) {
    try {
      await archiveRoute(id)
      archived++
    } catch (err: any) {
      errors.push(`${id}: ${err?.message ?? "unknown error"}`)
    }
  }

  return { archived, errors }
}

/**
 * Build a CSV export of a single route. Pulls live data when the route still
 * exists and falls back to the route_history snapshot when only the archive
 * remains.
 */
export async function exportRouteCSV(routeId: string): Promise<{ filename: string; csv: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Try live first
  const { data: liveRoute } = await supabase
    .from("routes")
    .select("*, driver:profiles!driver_id(display_name, email)")
    .eq("id", routeId)
    .eq("admin_id", user.id)
    .maybeSingle()

  let routeMeta: any
  let stops: RouteSnapshotStop[] = []

  if (liveRoute) {
    const snap = await buildRouteSnapshot(supabase, routeId, user.id)
    routeMeta = snap.route
    stops = snap.stops
  } else {
    const { data: history } = await supabase
      .from("route_history")
      .select("*")
      .eq("route_id", routeId)
      .eq("admin_id", user.id)
      .order("archived_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!history) {
      throw new Error("Route not found in active routes or history")
    }
    routeMeta = history.snapshot?.route ?? {
      id: history.route_id,
      name: history.name,
      driver_name: history.driver_name,
      driver_email: history.driver_email,
      status: history.status,
      distance_km: history.distance_km,
      duration_sec: history.duration_sec,
      created_at: history.created_at,
      completed_at: history.completed_at,
    }
    stops = (history.snapshot?.stops ?? []) as RouteSnapshotStop[]
  }

  const headers = [
    "Stop #",
    "Order #",
    "Customer",
    "Customer Email",
    "Status",
    "Address",
    "City",
    "State",
    "ZIP",
    "Phone",
    "Latitude",
    "Longitude",
    "Retry Count",
    "Last Failed At",
    "POD Recipient",
    "POD Delivered At",
    "POD Photo URL",
    "POD Signature URL",
    "POD Notes",
    "Order Notes",
  ]

  const rows = stops.map((s) => [
    s.stop_sequence ?? "",
    s.order_number ?? "",
    s.customer_name,
    s.customer_email ?? "",
    s.status,
    s.address,
    s.city ?? "",
    s.state ?? "",
    s.zip ?? "",
    s.phone ?? "",
    s.latitude ?? "",
    s.longitude ?? "",
    s.retry_count ?? 0,
    s.last_failed_at ?? "",
    s.pod_recipient_name ?? "",
    s.pod_delivered_at ?? "",
    s.pod_photo_url ?? "",
    s.pod_signature_url ?? "",
    s.pod_notes ?? "",
    s.notes ?? "",
  ])

  const summaryRows: Array<Array<unknown>> = [
    ["Route Name", routeMeta?.name ?? ""],
    ["Driver", routeMeta?.driver_name ?? routeMeta?.driver?.display_name ?? routeMeta?.driver?.email ?? "Unassigned"],
    ["Status", routeMeta?.status ?? ""],
    ["Total Stops", stops.length],
    ["Delivered", stops.filter((s) => s.status === "delivered").length],
    ["Failed", stops.filter((s) => s.status === "failed").length],
    ["Distance (km)", routeMeta?.distance_km ?? ""],
    ["Duration (sec)", routeMeta?.duration_sec ?? ""],
    ["Created At", routeMeta?.created_at ?? ""],
    ["Completed At", routeMeta?.completed_at ?? ""],
    [],
  ]

  const csv = buildCsv(["Field", "Value"], summaryRows) + "\r\n" + buildCsv(headers, rows)

  const safeName = String(routeMeta?.name ?? "route").replace(/[^A-Za-z0-9-_]+/g, "_")
  const filename = `route_${safeName}_${routeId.slice(0, 8)}.csv`

  return { filename, csv }
}
