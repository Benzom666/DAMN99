import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { geocodeAddress } from "@/lib/geocoding"
import { normalizeAddressKey } from "@/lib/here/cost-control"
import { generateOrderNumber } from "@/lib/order-number"

export interface CreateOrderInput {
  customer_name: string
  address: string
  city?: string | null
  state?: string | null
  zip?: string | null
  phone?: string | null
  notes?: string | null
  customer_email?: string | null
  order_number?: string | null
}

export type UpdateOrderInput = Partial<CreateOrderInput>

export interface ListOrdersParams {
  status?: string
  routeId?: string
  includeArchived?: boolean
  limit?: number
  offset?: number
}

const MAX_LIMIT = 200

/** List an admin's orders. Active manifest only by default (archived excluded). */
export async function listOrders(supabase: SupabaseClient, adminId: string, params: ListOrdersParams = {}) {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), MAX_LIMIT)
  const offset = Math.max(params.offset ?? 0, 0)

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.status) query = query.eq("status", params.status)
  if (params.routeId) query = query.eq("route_id", params.routeId)
  if (!params.includeArchived) query = query.is("archived_at", null)

  const { data, error, count } = await query
  if (error) throw error
  return { orders: data ?? [], total: count ?? 0, limit, offset }
}

/** Fetch a single order scoped to the admin, or null. */
export async function getOrder(supabase: SupabaseClient, adminId: string, orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("admin_id", adminId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Create + geocode an order for the admin. Returns the inserted row. */
export async function createOrderCore(supabase: SupabaseClient, adminId: string, input: CreateOrderInput) {
  const geo = await geocodeAddress(input.address, input.city ?? undefined, input.state ?? undefined, input.zip ?? undefined, {
    adminId,
    userId: adminId,
  })

  const base: Record<string, unknown> = {
    customer_name: input.customer_name,
    address: input.address,
    city: input.city || null,
    state: input.state || null,
    zip: input.zip || null,
    phone: input.phone || null,
    notes: input.notes || null,
    customer_email: input.customer_email || null,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    geocode_at: new Date().toISOString(),
    geocode_label: geo?.formattedAddress || null,
    geocode_status: geo ? "success" : "failed",
    geocode_error: geo ? null : "No geocoding result",
    status: "pending",
    order_number: (input.order_number || "").trim() || generateOrderNumber(),
    admin_id: adminId,
  }

  // Retry on order_number collision, matching the admin action's behavior.
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase.from("orders").insert(base).select().single()
    if (!error) return data
    const isDup = (error as { code?: string }).code === "23505" || error.message.toLowerCase().includes("unique")
    if (isDup && attempt < 5) {
      base.order_number = generateOrderNumber()
      continue
    }
    throw error
  }
  throw new Error("Failed to create order after retries")
}

/** Partially update an order (re-geocoding when the address changes). */
export async function updateOrderCore(
  supabase: SupabaseClient,
  adminId: string,
  orderId: string,
  patch: UpdateOrderInput,
) {
  const existing = await getOrder(supabase, adminId, orderId)
  if (!existing) return null

  const update: Record<string, unknown> = {}
  for (const field of ["customer_name", "phone", "notes", "customer_email"] as const) {
    if (patch[field] !== undefined) update[field] = patch[field] || null
  }

  const addressTouched =
    patch.address !== undefined || patch.city !== undefined || patch.state !== undefined || patch.zip !== undefined

  if (addressTouched) {
    const address = patch.address ?? existing.address
    const city = patch.city ?? existing.city
    const state = patch.state ?? existing.state
    const zip = patch.zip ?? existing.zip

    update.address = address
    update.city = city || null
    update.state = state || null
    update.zip = zip || null

    const changed =
      normalizeAddressKey([existing.address, existing.city, existing.state, existing.zip]) !==
      normalizeAddressKey([address, city, state, zip])

    if (changed) {
      const geo = await geocodeAddress(address, city ?? undefined, state ?? undefined, zip ?? undefined, {
        adminId,
        userId: adminId,
        orderId,
      })
      update.latitude = geo?.latitude ?? null
      update.longitude = geo?.longitude ?? null
      update.geocode_at = new Date().toISOString()
      update.geocode_label = geo?.formattedAddress || null
      update.geocode_status = geo ? "success" : "failed"
      update.geocode_error = geo ? null : "No geocoding result"
    }
  }

  if (Object.keys(update).length === 0) return existing

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", orderId)
    .eq("admin_id", adminId)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Delete an order the admin owns. Returns true if a row was removed. */
export async function deleteOrderCore(supabase: SupabaseClient, adminId: string, orderId: string) {
  const existing = await getOrder(supabase, adminId, orderId)
  if (!existing) return false
  const { error } = await supabase.from("orders").delete().eq("id", orderId).eq("admin_id", adminId)
  if (error) throw error
  return true
}
