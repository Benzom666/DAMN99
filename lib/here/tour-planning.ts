import { getHereAccessToken } from "./oauth"
import { checkTourPlanningRateLimit } from "@/lib/rate-limiter"
import { assertHereBudget, recordHereUsage } from "@/lib/here/cost-control"

const BASE_URL = "https://tourplanning.hereapi.com/v3"

type HereSolution = {
  status?: string
  statistic?: any
  tours?: any[]
  unassigned?: Array<{ jobId: string; reasons: Array<{ code: string; description: string }> }>
}

export interface HereSolutionInterface {
  status?: string
  statistic?: any
  tours?: any[]
  unassigned?: Array<{ jobId: string; reasons: Array<{ code: string; description: string }> }>
}

async function getAuthHeaders(): Promise<{ headers: Record<string, string>; params: URLSearchParams }> {
  const authMode = process.env.HERE_TOUR_PLANNING_AUTH || "apikey"

  if (authMode === "oauth") {
    const token = await getHereAccessToken()
    if (!token) throw new Error("Failed to get OAuth token")

    return {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      params: new URLSearchParams(),
    }
  }

  // API key mode - NEVER put API key in Authorization header
  const apiKey = process.env.HERE_API_KEY || process.env.HERE_SERVER_API_KEY
  if (!apiKey) throw new Error("HERE API key not configured")

  return {
    headers: {
      "Content-Type": "application/json",
    },
    params: new URLSearchParams({ apiKey }),
  }
}

function deepStripTimes(x: any): void {
  if (!x || typeof x !== "object") return
  if (Array.isArray(x)) {
    x.forEach(deepStripTimes)
    return
  }
  if (x.times) delete x.times
  if (x.timeWindows) delete x.timeWindows // defensive, in case
  Object.values(x).forEach(deepStripTimes)
}

export async function submitOrPoll(problem: any, maxSeconds = 60, userId?: string): Promise<HereSolution> {
  // Check rate limit before making expensive HERE API call
  if (userId) {
    const rateLimit = checkTourPlanningRateLimit(userId)
    if (!rateLimit.allowed) {
      console.warn(`[SERVER] [v0] Tour Planning rate limit exceeded for user ${userId}`)
      throw new Error(`HERE Tour Planning rate limit: ${rateLimit.error}`)
    }
  }

  try {
    deepStripTimes(problem.plan)

    const firstType = problem.fleet?.types?.[0]
    if (firstType?.shifts?.[0]) {
      const s = new Date(firstType.shifts[0].start.time)
      const e = new Date(firstType.shifts[0].end.time)
      const shiftMs = e.getTime() - s.getTime()
      console.log(
        "[v0] shift start/end Z:",
        s.toISOString(),
        e.toISOString(),
        "duration(min):",
        Math.round(shiftMs / 60000),
      )
      if (!(shiftMs > 30 * 60000)) {
        // must be > 30 min
        throw new Error("Invalid depot shift (end <= start). Fix time conversion to ISO Z.")
      }
    }

    const jobsWithTimes = problem.plan?.jobs?.filter((j: any) =>
      j.tasks?.deliveries?.some((d: any) => d.places?.some((p: any) => p.times)),
    ).length
    console.log("[v0] jobs with times after deep strip:", jobsWithTimes || 0)

    const { headers, params } = await getAuthHeaders()
    const url = `${BASE_URL}/problems?${params.toString()}`
    const jobCount = problem.plan?.jobs?.length || 0

    await assertHereBudget({
      service: "tour_planning",
      operation: "submit_problem",
      userId,
      projectedRequests: 1,
    })

    console.log("[SERVER] [v0] HERE Tour Planning Optimization Started...")
    console.log("[SERVER] [v0] Submitting to URL:", url)

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(problem),
      cache: "no-store",
    })

    console.log("[SERVER] [v0] Response status:", response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[SERVER] [v0] Tour Planning submit error:", errorText)
      await recordHereUsage({
        service: "tour_planning",
        operation: "submit_problem",
        userId,
        status: "error",
        httpStatus: response.status,
        errorMessage: errorText.slice(0, 500),
        metadata: { jobs: jobCount },
      })
      throw new Error(`Tour Planning submit error ${response.status}: ${errorText}`)
    }

    await recordHereUsage({
      service: "tour_planning",
      operation: "submit_problem",
      userId,
      status: "success",
      httpStatus: response.status,
      metadata: { jobs: jobCount },
    })

    let body: any = null
    try {
      const responseText = await response.text()
      if (responseText) {
        body = JSON.parse(responseText)
        console.log("[SERVER] [v0] Response body keys:", Object.keys(body || {}))
      }
    } catch (e) {
      console.log("[SERVER] [v0] No JSON body or empty response")
    }

    if (body && body.error) {
      const errorCode = body.error.code || body.error.status
      const errorMessage = body.error.message || "Unknown error"

      console.error("[SERVER] [v0] HERE API returned error:", JSON.stringify(body.error, null, 2))

      // Check if it's a rate limit error
      if (errorCode === "429" || errorCode === 429 || errorMessage.includes("Too Many Requests")) {
        const rateLimitError = new Error(`HERE API rate limit exceeded: ${errorMessage}`)
        ;(rateLimitError as any).isRateLimit = true
        throw rateLimitError
      }

      throw new Error(`HERE API error ${errorCode}: ${errorMessage}`)
    }

    if (
      response.status === 200 &&
      body &&
      (Array.isArray(body.tours) || Array.isArray(body.unassigned) || body.statistic)
    ) {
      console.log("[SERVER] [v0] Received immediate solution (no polling needed)")
      console.log(
        `[SERVER] [v0] Solution has ${body.tours?.length || 0} tours and ${body.unassigned?.length || 0} unassigned jobs`,
      )
      return body as HereSolution
    }

    let problemId: string | undefined = undefined

    // Try body.id
    if (body && typeof body.id === "string" && body.id) {
      problemId = body.id
      console.log("[SERVER] [v0] Found problemId in body.id:", problemId)
    }

    // Try body.problemId
    if (!problemId && body && typeof body.problemId === "string" && body.problemId) {
      problemId = body.problemId
      console.log("[SERVER] [v0] Found problemId in body.problemId:", problemId)
    }

    // Try Location header
    if (!problemId) {
      const location = response.headers.get("location") || response.headers.get("Location")
      if (location) {
        const match = location.match(/\/problems\/([^/?#]+)/i)
        if (match) {
          problemId = match[1]
          console.log("[SERVER] [v0] Extracted problemId from Location header:", problemId)
        }
      }
    }

    if (!problemId) {
      console.error("[SERVER] [v0] Failed to extract problemId. Response details:")
      console.error("[SERVER] [v0]   Status:", response.status)
      console.error("[SERVER] [v0]   Body keys:", Object.keys(body || {}))
      console.error("[SERVER] [v0]   Body:", JSON.stringify(body, null, 2).substring(0, 500))
      throw new Error("Create problem succeeded but no problem id found and no immediate solution returned")
    }

    console.log(`[SERVER] [v0] Problem submitted with ID: ${problemId}, starting polling...`)

    return await pollSolution(problemId, maxSeconds, userId)
  } catch (error) {
    console.error("[SERVER] [v0] Tour Planning error:", error)
    await recordHereUsage({
      service: "tour_planning",
      operation: "submit_problem",
      userId,
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Tour Planning error",
      metadata: { jobs: problem.plan?.jobs?.length || 0 },
    })
    throw error
  }
}

async function pollSolution(problemId: string, maxSeconds: number, userId?: string): Promise<HereSolution> {
  const startTime = Date.now()
  const { headers, params } = await getAuthHeaders()

  while (Date.now() - startTime < maxSeconds * 1000) {
    const url = `${BASE_URL}/problems/${problemId}?${params.toString()}`

    await assertHereBudget({
      service: "tour_planning",
      operation: "poll_solution",
      userId,
      projectedRequests: 1,
    })

    const response = await fetch(url, {
      headers,
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      await recordHereUsage({
        service: "tour_planning",
        operation: "poll_solution",
        userId,
        status: "error",
        httpStatus: response.status,
        errorMessage: errorText.slice(0, 500),
        metadata: { problemId },
      })
      throw new Error(`Poll failed ${response.status}: ${errorText}`)
    }

    await recordHereUsage({
      service: "tour_planning",
      operation: "poll_solution",
      userId,
      status: "success",
      httpStatus: response.status,
      metadata: { problemId },
    })

    const data = await response.json()

    // Check if solution is ready
    if (data.status === "ready" || data.status === "failed" || data.tours) {
      console.log(`[SERVER] [v0] Solution ready with status: ${data.status || "completed"}`)
      return data as HereSolution
    }

    console.log(`[SERVER] [v0] Solution status: ${data.status || "processing"}, polling again...`)
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  throw new Error("Polling timed out before solution became ready")
}

export interface OptimizedTour {
  vehicleId: string
  orderedStopIds: string[]
  totalDistance?: number
  totalTime?: number
  jobPlaces?: Map<string, { lat: number; lng: number }>
}

export async function optimizeWithHereTourPlanning(
  problem: any,
  jobPlaceById: Map<string, { lat: number; lng: number }>,
  maxSeconds = 60,
  userId?: string,
): Promise<OptimizedTour[]> {
  try {
    const solution = await submitOrPoll(problem, maxSeconds, userId)

    if (solution.unassigned && solution.unassigned.length > 0) {
      console.log(`[SERVER] [v0] Warning: ${solution.unassigned.length} jobs unassigned:`)
      solution.unassigned.forEach((u) => {
        const reasons = u.reasons?.map((r) => r.code).join(", ") || "unknown"
        console.log(`[SERVER] [v0]   - Job ${u.jobId}: ${reasons}`)
      })
    }

    function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
      const R = 6371
      const dLat = ((b.lat - a.lat) * Math.PI) / 180
      const dLng = ((b.lng - a.lng) * Math.PI) / 180
      const sa = Math.sin(dLat / 2)
      const sb = Math.sin(dLng / 2)
      return (
        2 *
        R *
        Math.asin(Math.sqrt(sa * sa + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sb * sb))
      )
    }

    // Extract tours from solution
    const tours: OptimizedTour[] = []

    if (solution.tours && Array.isArray(solution.tours)) {
      for (const tour of solution.tours) {
        const orderedStopIds: string[] = []

        if (tour.stops && Array.isArray(tour.stops)) {
          for (const stop of tour.stops) {
            // Skip depot stops
            if (stop.type === "depot") continue

            if (stop.type === "job" && stop.jobId && stop.location) {
              const place = jobPlaceById.get(stop.jobId)
              if (place) {
                const hereStopLoc = stop.location
                const d = haversineKm(place, hereStopLoc)
                if (d > 0.05) {
                  console.warn(`[v0] stop drift >50m for job ${stop.jobId}: ${d.toFixed(3)} km`)
                }
              }
            }

            if (stop.activities && Array.isArray(stop.activities)) {
              for (const activity of stop.activities) {
                if (activity.jobId) {
                  orderedStopIds.push(activity.jobId)
                }
              }
            }
          }
        }

        tours.push({
          vehicleId: tour.vehicleId,
          orderedStopIds,
          totalDistance: tour.statistic?.distance,
          totalTime: tour.statistic?.duration,
          jobPlaces: jobPlaceById,
        })
      }
    }

    console.log(`[SERVER] [v0] HERE Optimization Completed with ${tours.length} routes.`)

    return tours
  } catch (error) {
    console.error("[SERVER] [v0] HERE Tour Planning optimization failed:", error)
    throw error
  }
}
