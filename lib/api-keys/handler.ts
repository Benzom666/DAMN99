import "server-only"
import { NextResponse } from "next/server"
import { ZodError, type ZodType } from "zod"
import { checkRateLimit } from "@/lib/rate-limiter"
import { authenticateApiKey, type ApiKeyContext } from "./authenticate"
import { ApiError, ApiErrors } from "./errors"

// Public API rate limit: generous per-key ceiling. HERE-backed endpoints have
// their own tighter per-service limits + daily budget on top of this.
const API_RATE_LIMIT = { maxRequests: 120, windowMs: 60 * 1000 }

type RouteContext = { params: Promise<Record<string, string>> }
type Handler = (
  request: Request,
  ctx: ApiKeyContext,
  routeCtx: RouteContext,
) => Promise<Response | unknown> | Response | unknown

function errorResponse(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...(extra || {}) } }, { status })
}

/**
 * Wrap a public /api/v1 route handler:
 *   1. authenticate the API key -> ApiKeyContext (adminId, apiKeyId, scopes)
 *   2. enforce a per-key rate limit
 *   3. run the handler, normalizing thrown ApiError / ZodError into a uniform
 *      `{ error: { code, message } }` JSON body.
 *
 * A handler may return a `Response` (used as-is) or any JSON-serializable value
 * (wrapped in a 200 response).
 */
export function withApiKey(handler: Handler) {
  return async (request: Request, routeCtx: RouteContext): Promise<Response> => {
    try {
      const ctx = await authenticateApiKey(request)

      const rl = checkRateLimit(`api_key_${ctx.apiKeyId}`, API_RATE_LIMIT)
      if (!rl.allowed) {
        return errorResponse(429, "rate_limited", rl.error || "Rate limit exceeded", {
          retryAfter: Math.max(0, Math.ceil((rl.resetAt - Date.now()) / 1000)),
        })
      }

      const result = await handler(request, ctx, routeCtx)
      if (result instanceof Response) return result
      return NextResponse.json(result ?? { ok: true })
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.status, err.code, err.message)
      }
      if (err instanceof ZodError) {
        return errorResponse(400, "bad_request", "Request validation failed", {
          issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        })
      }
      console.error("[api/v1] Unhandled error:", err)
      return errorResponse(500, "internal_error", "Internal server error")
    }
  }
}

/** Parse + validate a JSON request body against a Zod schema, or throw ApiError(400). */
export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    throw ApiErrors.badRequest("Request body must be valid JSON")
  }
  return schema.parse(raw)
}

export { ApiError, ApiErrors }
