// Routing optimization utilities

interface Coordinates {
  latitude: number
  longitude: number
}

interface Stop {
  id: string
  latitude: number
  longitude: number
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Nearest neighbor algorithm for route optimization
export function optimizeRouteNearestNeighbor(stops: Stop[], startPoint?: Coordinates): string[] {
  if (stops.length === 0) return []
  if (stops.length === 1) return [stops[0].id]

  const unvisited = [...stops]
  const route: string[] = []

  // Start from the provided start point or the first stop
  let current: Coordinates = startPoint || { latitude: stops[0].latitude, longitude: stops[0].longitude }

  while (unvisited.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    // Find the nearest unvisited stop
    unvisited.forEach((stop, index) => {
      const distance = calculateDistance(current, { latitude: stop.latitude, longitude: stop.longitude })
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })

    const nearest = unvisited[nearestIndex]
    route.push(nearest.id)
    current = { latitude: nearest.latitude, longitude: nearest.longitude }
    unvisited.splice(nearestIndex, 1)
  }

  return route
}

// 2-opt optimization to improve route
export function optimize2Opt(stops: Stop[], initialRoute: string[]): string[] {
  if (stops.length < 4) return initialRoute

  const stopMap = new Map(stops.map((s) => [s.id, s]))
  let route = [...initialRoute]
  let improved = true

  function calculateRouteDistance(r: string[]): number {
    let total = 0
    for (let i = 0; i < r.length - 1; i++) {
      const stop1 = stopMap.get(r[i])!
      const stop2 = stopMap.get(r[i + 1])!
      total += calculateDistance(
        { latitude: stop1.latitude, longitude: stop1.longitude },
        { latitude: stop2.latitude, longitude: stop2.longitude },
      )
    }
    return total
  }

  let currentDistance = calculateRouteDistance(route)

  // Try to improve the route by swapping edges
  while (improved) {
    improved = false
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length - 1; j++) {
        // Reverse the segment between i and j
        const newRoute = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)]
        const newDistance = calculateRouteDistance(newRoute)

        if (newDistance < currentDistance) {
          route = newRoute
          currentDistance = newDistance
          improved = true
        }
      }
    }
  }

  return route
}

// ----------------------------------------------------------------------------
// Depot-aware optimization
// ----------------------------------------------------------------------------
// The plain nearest-neighbor / 2-opt above optimize an OPEN path through the
// orders and ignore the depot entirely. For real delivery routing the depot is
// a fixed start (and usually a fixed end). These helpers anchor the depot so
// the first leg (depot -> first stop) and the return leg are part of what gets
// minimized.

// Total length of `route` with the depot pinned at the start (and end when
// returnToDepot is true). When no depot is provided this is just the open-path
// length, matching calculateTotalDistance.
function routeLengthWithDepot(
  route: string[],
  stopMap: Map<string, Stop>,
  depot?: Coordinates,
  returnToDepot = true,
): number {
  if (route.length === 0) return 0
  const pts = route.map((id) => stopMap.get(id)!)
  let total = 0
  if (depot) {
    total += calculateDistance(depot, { latitude: pts[0].latitude, longitude: pts[0].longitude })
  }
  for (let i = 0; i < pts.length - 1; i++) {
    total += calculateDistance(
      { latitude: pts[i].latitude, longitude: pts[i].longitude },
      { latitude: pts[i + 1].latitude, longitude: pts[i + 1].longitude },
    )
  }
  if (depot && returnToDepot) {
    const last = pts[pts.length - 1]
    total += calculateDistance({ latitude: last.latitude, longitude: last.longitude }, depot)
  }
  return total
}

// 2-opt that keeps the depot fixed at both ends. Unlike optimize2Opt this can
// also reverse the segment starting at index 0, because the predecessor of the
// first stop is the depot (a real node), not an arbitrary "free" start.
function twoOptWithDepot(
  stops: Stop[],
  initialRoute: string[],
  depot?: Coordinates,
  returnToDepot = true,
  maxPasses = 30,
): string[] {
  if (initialRoute.length < 3) return initialRoute
  const stopMap = new Map(stops.map((s) => [s.id, s]))
  let route = [...initialRoute]
  let bestDist = routeLengthWithDepot(route, stopMap, depot, returnToDepot)
  let improved = true
  let passes = 0

  while (improved && passes < maxPasses) {
    improved = false
    passes++
    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const candidate = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)]
        const candDist = routeLengthWithDepot(candidate, stopMap, depot, returnToDepot)
        if (candDist < bestDist - 1e-9) {
          route = candidate
          bestDist = candDist
          improved = true
        }
      }
    }
  }

  return route
}

/**
 * Depot-anchored route optimization: nearest-neighbor seeded from the depot,
 * then depot-anchored 2-opt. This is the correct fallback when a depot is known
 * (driver depot or cluster centroid). For large routes 2-opt is capped to keep
 * runtime bounded.
 *
 * @param stops          Stops to sequence
 * @param depot          Optional fixed start/end location
 * @param returnToDepot  Whether the vehicle returns to the depot at the end
 * @param run2Opt        Whether to run the 2-opt refinement pass
 */
export function optimizeRouteWithDepot(
  stops: Stop[],
  depot?: Coordinates,
  returnToDepot = true,
  run2Opt = true,
): string[] {
  if (stops.length <= 1) return stops.map((s) => s.id)

  const start: Coordinates = depot ?? { latitude: stops[0].latitude, longitude: stops[0].longitude }
  let route = optimizeRouteNearestNeighbor(stops, start)

  // 2-opt is O(n^3); skip the refinement for very large single routes to avoid
  // pathological runtimes (those should be split across vehicles anyway).
  if (run2Opt && stops.length >= 4 && stops.length <= 250) {
    route = twoOptWithDepot(stops, route, depot, returnToDepot)
  }

  return route
}

// Calculate total route distance
export function calculateTotalDistance(stops: Stop[], route: string[]): number {
  if (route.length < 2) return 0

  const stopMap = new Map(stops.map((s) => [s.id, s]))
  let total = 0

  for (let i = 0; i < route.length - 1; i++) {
    const stop1 = stopMap.get(route[i])!
    const stop2 = stopMap.get(route[i + 1])!
    total += calculateDistance(
      { latitude: stop1.latitude, longitude: stop1.longitude },
      { latitude: stop2.latitude, longitude: stop2.longitude },
    )
  }

  return total
}
