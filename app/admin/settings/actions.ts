"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/security/authorization"
import { generateApiKey } from "@/lib/api-keys/keys"

export interface ApiKeyRow {
  id: string
  name: string
  key_prefix: string
  last_four: string
  last_used_at: string | null
  revoked_at: string | null
  is_active: boolean
  created_at: string
}

/** List the current admin's API keys (never returns the secret). */
export async function listApiKeys(): Promise<ApiKeyRow[]> {
  const { user, supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_four, last_used_at, revoked_at, is_active, created_at")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as ApiKeyRow[]
}

/**
 * Create a new API key. Returns the plaintext token EXACTLY ONCE — it is never
 * stored or retrievable again.
 */
export async function createApiKey(name: string): Promise<{ token: string; key: ApiKeyRow }> {
  const { user, supabase } = await requireAdmin()

  const trimmed = (name || "").trim()
  if (!trimmed) throw new Error("A key name is required")
  if (trimmed.length > 60) throw new Error("Key name must be 60 characters or fewer")

  const generated = generateApiKey()

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      admin_id: user.id,
      name: trimmed,
      key_prefix: generated.prefix,
      key_hash: generated.hash,
      last_four: generated.lastFour,
    })
    .select("id, name, key_prefix, last_four, last_used_at, revoked_at, is_active, created_at")
    .single()

  if (error) throw error

  revalidatePath("/admin/settings")
  return { token: generated.token, key: data as ApiKeyRow }
}

/** Revoke (permanently disable) an API key the admin owns. */
export async function revokeApiKey(id: string): Promise<{ success: true }> {
  const { user, supabase } = await requireAdmin()
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString(), is_active: false })
    .eq("id", id)
    .eq("admin_id", user.id)
  if (error) throw error
  revalidatePath("/admin/settings")
  return { success: true }
}

// ----------------------------------------------------------------------------
// BYOK: the admin's own HERE Maps key (profiles.here_api_key)
// ----------------------------------------------------------------------------

/** Report whether a BYOK HERE key is set (never returns the key itself). */
export async function getHereKeyStatus(): Promise<{ hasKey: boolean; lastFour: string | null }> {
  const { user, supabase } = await requireAdmin()
  const { data } = await supabase.from("profiles").select("here_api_key").eq("id", user.id).maybeSingle()
  const key = data?.here_api_key as string | null | undefined
  return { hasKey: Boolean(key), lastFour: key ? key.slice(-4) : null }
}

export async function saveHereKey(key: string): Promise<{ success: true }> {
  const { user, supabase } = await requireAdmin()
  const trimmed = (key || "").trim()
  if (trimmed.length < 8) throw new Error("That does not look like a valid HERE API key")
  const { error } = await supabase.from("profiles").update({ here_api_key: trimmed }).eq("id", user.id)
  if (error) throw error
  revalidatePath("/admin/settings")
  return { success: true }
}

export async function clearHereKey(): Promise<{ success: true }> {
  const { user, supabase } = await requireAdmin()
  const { error } = await supabase.from("profiles").update({ here_api_key: null }).eq("id", user.id)
  if (error) throw error
  revalidatePath("/admin/settings")
  return { success: true }
}
