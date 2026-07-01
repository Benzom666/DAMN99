import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * List drivers belonging to an admin. Tenant isolation is explicit via
 * `admin_id` (the service-role client bypasses RLS), matching every other
 * service in this module.
 */
export async function listDrivers(
  supabase: SupabaseClient,
  adminId: string,
  opts: { activeOnly?: boolean } = {},
) {
  let query = supabase
    .from("profiles")
    .select("id, email, display_name, is_active, vehicle_capacity, shift_start, shift_end, depot_lat, depot_lng, created_at")
    .eq("role", "driver")
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false })

  if (opts.activeOnly) query = query.eq("is_active", true)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
