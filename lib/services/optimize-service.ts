import "server-only"
import { optimizeRouteWithDepot, calculateTotalDistance } from "@/lib/routing"
import { clusterIntoRoutes } from "@/lib/clustering"
import { buildMultiVehicleProblemV3, type Order, type VehicleConfig, type Depot } from "@/lib/here/build-problem-v3"
import { optimizeWithHereTourPlanning } from "@/lib/here/tour-planning"

export interface OptimizeStop {
  id: string
  lat: number
  lng: number
  serviceSeconds?: number
  quantity?: number
  windowStart?: string
  windowEnd?: string
}

export interface OptimizeVehicle {
  id?: string
  capacity?: number
  shiftStart?: string
  shiftEnd?: string
  returnToDepot?: boolean
}

export interface OptimizeInput {
  stops: OptimizeStop[]
  vehicles?: OptimizeVehicle[]
  depot?: { lat: number; lng: number }
  use2Opt?: boolean
}

export interface OptimizedRoute {
  vehicleId: string
  stopIds: string[]
  distanceKm: number
}

export interface OptimizeResult {
  engine: "here" | "fallback"
  routes: OptimizedRoute[]
  unassigned: string[]
}

const MAX_STOPS = 1000
const MAX_HERE_STOPS = 500

const hereTourPlanningEnabled = () => process.env.HERE_TOUR_PLANNING_ENABLED === "true"

function centroidOf(stops: OptimizeStop[]): Depot {
  return {
    lat: stops.reduce((s, o) => s + o.lat, 0) / stops.length,
    lng: stops.reduce((s, o) => s + o.lng, 0) / stops.length,
  }
}

function distanceForIds(stops: OptimizeStop[], orderedIds: string[]): number {
  const asStops = stops.map((s) => ({ id: s.id, latitude: s.lat, longitude: s.lng }))
  return Number(calculateTotalDistance(asStops, orderedIds).toFixed(3))
}

/**
 * Stateless route optimization: take stops + vehicles + optional depot and
 * return sequenced routes. Nothing is persisted. Uses the HERE Tour Planning
 * VRP solver when enabled/configured, otherwise falls back to geographic
 * clustering + depot-anchored nearest-neighbour/2-opt.
 *
 * `adminId` selects the HERE key (BYOK vs platform) and attributes cost.
 */
export async function optimizeStateless(input: OptimizeInput, adminId?: string): Promise<OptimizeResult> {
  const stops = input.stops || []
  if (stops.length === 0) throw new Error("At least one stop is required")
  if (stops.length > MAX_STOPS) throw new Error(`Maximum ${MAX_STOPS} stops per request`)

  const use2Opt = input.use2Opt ?? true
  const depot: Depot = input.depot ?? centroidOf(stops)

  // Normalize vehicles (default to a single unconstrained vehicle).
  const rawVehicles = input.vehicles && input.vehicles.length > 0 ? input.vehicles : [{}]
  const vehicles: VehicleConfig[] = rawVehicles.map((v, i) => ({
    id: v.id || `vehicle-${i + 1}`,
    capacity: v.capacity,
    shiftStart: v.shiftStart,
    shiftEnd: v.shiftEnd,
    returnToDepot: v.returnToDepot ?? true,
  }))

  const stopById = new Map(stops.map((s) => [s.id, s]))

  // ---- Path A: HERE multi-vehicle VRP -------------------------------------
  if (hereTourPlanningEnabled() && stops.length <= MAX_HERE_STOPS) {
    try {
      const orders: Order[] = stops.map((s) => ({
        id: s.id,
        latitude: s.lat,
        longitude: s.lng,
        service_seconds: s.serviceSeconds,
        quantity: s.quantity,
        window_start: s.windowStart,
        window_end: s.windowEnd,
      }))

      const { problem, jobPlaceById } = await buildMultiVehicleProblemV3(orders, depot, vehicles)
      const tours = await optimizeWithHereTourPlanning(problem, jobPlaceById, 120, adminId, adminId)

      if (tours.length > 0) {
        const assigned = new Set<string>()
        const routes: OptimizedRoute[] = []
        for (const tour of tours) {
          const ids = tour.orderedStopIds.filter((id) => id !== "departure" && id !== "arrival")
          ids.forEach((id) => assigned.add(id))
          if (ids.length > 0) {
            routes.push({ vehicleId: tour.vehicleId, stopIds: ids, distanceKm: distanceForIds(stops, ids) })
          }
        }
        if (routes.length > 0) {
          const unassigned = stops.filter((s) => !assigned.has(s.id)).map((s) => s.id)
          return { engine: "here", routes, unassigned }
        }
      }
    } catch (err) {
      console.error("[optimize-service] HERE VRP failed, using fallback:", err)
    }
  }

  // ---- Path B: geographic clustering fallback ------------------------------
  const routeCount = Math.min(vehicles.length, stops.length)

  if (routeCount <= 1) {
    const asStops = stops.map((s) => ({ id: s.id, latitude: s.lat, longitude: s.lng }))
    const orderedIds = optimizeRouteWithDepot(asStops, depot, vehicles[0].returnToDepot !== false, use2Opt)
    return {
      engine: "fallback",
      routes: [{ vehicleId: vehicles[0].id, stopIds: orderedIds, distanceKm: distanceForIds(stops, orderedIds) }],
      unassigned: [],
    }
  }

  const clusters = clusterIntoRoutes(
    stops.map((s) => ({ id: s.id, latitude: s.lat, longitude: s.lng })),
    routeCount,
  )

  const routes: OptimizedRoute[] = clusters.map((cluster, i) => {
    const vehicle = vehicles[i] ?? vehicles[vehicles.length - 1]
    const clusterDepot = input.depot ?? { lat: cluster.centroid.lat, lng: cluster.centroid.lng }
    const clusterStops = cluster.orders.map((o) => ({ id: o.id, latitude: o.latitude, longitude: o.longitude }))
    const orderedIds = optimizeRouteWithDepot(
      clusterStops,
      { latitude: clusterDepot.lat, longitude: clusterDepot.lng },
      vehicle.returnToDepot !== false,
      use2Opt,
    )
    return {
      vehicleId: vehicle.id,
      stopIds: orderedIds,
      distanceKm: distanceForIds(orderedIds.map((id) => stopById.get(id)!).filter(Boolean), orderedIds),
    }
  })

  const assigned = new Set(routes.flatMap((r) => r.stopIds))
  const unassigned = stops.filter((s) => !assigned.has(s.id)).map((s) => s.id)
  return { engine: "fallback", routes, unassigned }
}
