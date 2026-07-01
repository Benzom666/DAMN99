import "server-only"
import { createHash, randomBytes } from "node:crypto"

/**
 * Delivery OS API key generation & hashing.
 *
 * Tokens look like `dos_live_<43 url-safe base64 chars>`. We only ever persist
 * the SHA-256 hash of the full token (plus a display prefix and last-four), so a
 * database leak never exposes usable credentials. The plaintext token is
 * returned to the admin exactly once, at creation time.
 */

export const API_KEY_PREFIX = "dos_live_"

/** Length (in random bytes) of the secret portion. 32 bytes -> 43 base64url chars. */
const SECRET_BYTES = 32

export interface GeneratedApiKey {
  /** Full plaintext token — shown to the admin once, never stored. */
  token: string
  /** Non-secret display prefix, e.g. "dos_live_a1b2c3". Stored + shown in the UI. */
  prefix: string
  /** SHA-256 hex of the full token. The only representation stored. */
  hash: string
  /** Last 4 chars of the token, for display (e.g. "…a9f2"). */
  lastFour: string
}

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** SHA-256 hex digest of a token. Used for both storage and lookup. */
export function hashApiKey(token: string): string {
  return createHash("sha256").update(token.trim()).digest("hex")
}

/** Mint a brand-new API key. */
export function generateApiKey(): GeneratedApiKey {
  const secret = base64url(randomBytes(SECRET_BYTES))
  const token = `${API_KEY_PREFIX}${secret}`
  return {
    token,
    prefix: token.slice(0, API_KEY_PREFIX.length + 6),
    hash: hashApiKey(token),
    lastFour: token.slice(-4),
  }
}

/** Cheap structural check before hitting the database. */
export function looksLikeApiKey(token: string | null | undefined): boolean {
  return typeof token === "string" && token.startsWith(API_KEY_PREFIX) && token.length >= API_KEY_PREFIX.length + 20
}
