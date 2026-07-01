import "server-only"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { hashApiKey, looksLikeApiKey } from "./keys"
import { ApiErrors } from "./errors"

export interface ApiKeyContext {
  /** Owning admin's user id — drives per-tenant isolation and HERE cost attribution. */
  adminId: string
  /** The api_keys.id of the presented key — used for rate limiting + usage attribution. */
  apiKeyId: string
  /** Granted scopes (currently always ['*']; reserved for future scoping). */
  scopes: string[]
}

/** Pull the bearer token from `Authorization: Bearer <token>` or `x-api-key`. */
function extractToken(request: Request): string | null {
  const auth = request.headers.get("authorization")
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim())
    if (match) return match[1].trim()
  }
  const headerKey = request.headers.get("x-api-key")
  return headerKey ? headerKey.trim() : null
}

/**
 * Resolve an incoming request to its owning admin via the presented API key.
 * Throws ApiError(401) when the key is missing, malformed, unknown, revoked, or
 * belongs to a suspended admin. Best-effort stamps last_used_at.
 */
export async function authenticateApiKey(request: Request): Promise<ApiKeyContext> {
  const token = extractToken(request)
  if (!looksLikeApiKey(token)) {
    throw ApiErrors.unauthorized()
  }

  const supabase = createServiceRoleClient()
  const keyHash = hashApiKey(token as string)

  const { data: key, error } = await supabase
    .from("api_keys")
    .select("id, admin_id, scopes, revoked_at, is_active")
    .eq("key_hash", keyHash)
    .maybeSingle()

  if (error || !key || !key.is_active || key.revoked_at) {
    throw ApiErrors.unauthorized()
  }

  // Reject keys owned by a suspended/deactivated admin.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, role")
    .eq("id", key.admin_id)
    .maybeSingle()

  if (!profile || profile.is_active === false) {
    throw ApiErrors.unauthorized("This account is not active")
  }

  // Best-effort: record usage timestamp. Never block the request on this.
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id)
    .then(
      () => {},
      () => {},
    )

  return {
    adminId: key.admin_id as string,
    apiKeyId: key.id as string,
    scopes: (key.scopes as string[] | null) ?? ["*"],
  }
}
