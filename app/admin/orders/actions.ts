"use server"

import { createClient } from "@/lib/supabase/server"
import { geocodeAddress, geocodeBatch } from "@/lib/geocoding"
import { revalidatePath } from "next/cache"
import { normalizeAddressKey } from "@/lib/here/cost-control"

function isValidEmail(email: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

async function hasCustomerEmailColumn(supabase: any): Promise<boolean> {
  try {
    const { error } = await supabase.from("orders").select("customer_email").limit(1)
    return !error || !error.message.includes("customer_email")
  } catch {
    return false
  }
}

export async function createOrder(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const customerName = formData.get("customer_name") as string
  const customerEmail = formData.get("customer_email") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zip = formData.get("zip") as string
  const phone = formData.get("phone") as string
  const notes = formData.get("notes") as string

  const hasEmailColumn = await hasCustomerEmailColumn(supabase)

  if (hasEmailColumn) {
    if (!customerEmail) {
      throw new Error("Customer email is required for POD notifications")
    }
    if (!isValidEmail(customerEmail)) {
      throw new Error("Invalid customer email format")
    }
  }

  // Geocode the address
  const geoResult = await geocodeAddress(address, city, state, zip, { adminId: user.id, userId: user.id })

  const orderData: any = {
    customer_name: customerName,
    address,
    city: city || null,
    state: state || null,
    zip: zip || null,
    phone: phone || null,
    notes: notes || null,
    latitude: geoResult?.latitude || null,
    longitude: geoResult?.longitude || null,
    geocode_at: new Date().toISOString(),
    geocode_label: geoResult?.formattedAddress || null,
    geocode_status: geoResult ? "success" : "failed",
    geocode_error: geoResult ? null : "No geocoding result",
    status: "pending",
    order_number: generateOrderNumber(),
    admin_id: user.id, // Add admin_id for multi-tenancy
  }

  if (hasEmailColumn && customerEmail) {
    orderData.customer_email = customerEmail
  }

  const { error } = await supabase.from("orders").insert(orderData)

  if (error) {
    if ((error as any)?.code === "23505" || error.message.toLowerCase().includes("unique")) {
      throw new Error("Order number already exists for your account. Please try again.")
    }
    throw error
  }

  revalidatePath("/admin/orders")
}

export async function updateOrder(orderId: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const customerName = formData.get("customer_name") as string
  const customerEmail = formData.get("customer_email") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zip = formData.get("zip") as string
  const phone = formData.get("phone") as string
  const notes = formData.get("notes") as string

  const hasEmailColumn = await hasCustomerEmailColumn(supabase)

  if (hasEmailColumn) {
    if (!customerEmail) {
      throw new Error("Customer email is required for POD notifications")
    }
    if (!isValidEmail(customerEmail)) {
      throw new Error("Invalid customer email format")
    }
  }

  const { data: existingOrder } = await supabase
    .from("orders")
    .select("admin_id,address,city,state,zip,latitude,longitude")
    .eq("id", orderId)
    .single()

  if (!existingOrder || existingOrder.admin_id !== user.id) {
    throw new Error("Unauthorized: Order not found or access denied")
  }

  const oldAddressKey = normalizeAddressKey([existingOrder.address, existingOrder.city, existingOrder.state, existingOrder.zip])
  const newAddressKey = normalizeAddressKey([address, city, state, zip])
  const addressChanged = oldAddressKey !== newAddressKey
  const geoResult = addressChanged
    ? await geocodeAddress(address, city, state, zip, { adminId: user.id, userId: user.id, orderId })
    : null

  const updateData: any = {
    customer_name: customerName,
    address,
    city: city || null,
    state: state || null,
    zip: zip || null,
    phone: phone || null,
    notes: notes || null,
    latitude: addressChanged ? geoResult?.latitude || null : existingOrder.latitude,
    longitude: addressChanged ? geoResult?.longitude || null : existingOrder.longitude,
  }

  if (addressChanged) {
    updateData.geocode_at = new Date().toISOString()
    updateData.geocode_label = geoResult?.formattedAddress || null
    updateData.geocode_status = geoResult ? "success" : "failed"
    updateData.geocode_error = geoResult ? null : "No geocoding result"
  }

  if (hasEmailColumn && customerEmail) {
    updateData.customer_email = customerEmail
  }

  const { error } = await supabase.from("orders").update(updateData).eq("id", orderId).eq("admin_id", user.id)

  if (error) throw error

  revalidatePath("/admin/orders")
}

export async function deleteOrder(orderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from("orders").delete().eq("id", orderId).eq("admin_id", user.id)

  if (error) throw error

  revalidatePath("/admin/orders")
}

export async function bulkDeleteOrders(orderIds: string[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  console.log("[v0] [BULK_DELETE] Deleting", orderIds.length, "orders")
  console.log("[v0] [BULK_DELETE] User:", user.id)

  const BATCH_SIZE = 100
  let totalDeleted = 0
  const errors: string[] = []

  for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
    const batch = orderIds.slice(i, i + BATCH_SIZE)
    console.log(
      `[v0] [BULK_DELETE] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(orderIds.length / BATCH_SIZE)}`,
    )

    try {
      const { error, count } = await supabase
        .from("orders")
        .delete({ count: "exact" })
        .in("id", batch)
        .eq("admin_id", user.id)

      if (error) {
        console.error("[v0] [BULK_DELETE] Batch error:", error)
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`)
      } else {
        totalDeleted += count || batch.length
        console.log(
          `[v0] [BULK_DELETE] Batch ${Math.floor(i / BATCH_SIZE) + 1} deleted ${count || batch.length} orders`,
        )
      }
    } catch (err) {
      console.error("[v0] [BULK_DELETE] Batch exception:", err)
      errors.push(
        `Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      )
    }
  }

  if (errors.length > 0) {
    console.error("[v0] [BULK_DELETE] Completed with errors:", errors)
  } else {
    console.log("[v0] [BULK_DELETE] ✓ Successfully deleted", totalDeleted, "orders")
  }

  revalidatePath("/admin/orders")

  return {
    deleted: totalDeleted,
    errors: errors.length > 0 ? errors : undefined,
  }
}

export async function importOrdersFromCSV(csvData: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const hasEmailColumn = await hasCustomerEmailColumn(supabase)

  // Parse CSV
  const lines = csvData.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

  if (hasEmailColumn && !headers.includes("customer_email")) {
    throw new Error("CSV must include 'customer_email' column to enable POD notifications")
  }

  const ordersToGeocode: Array<{
    rowIndex: number
    customer_name: string
    customer_email?: string
    order_number?: string // Added order_number field
    address: string
    city?: string
    state?: string
    zip?: string
    phone?: string
    notes?: string
  }> = []

  const errors: string[] = []

  // Parse all rows first
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim())
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })

    if (!row.customer_name || !row.address) {
      errors.push(`Row ${i + 1}: Missing customer_name or address`)
      continue
    }

    if (hasEmailColumn) {
      if (!row.customer_email) {
        errors.push(`Row ${i + 1}: Missing customer_email (required for POD notifications)`)
        continue
      }

      if (!isValidEmail(row.customer_email)) {
        errors.push(`Row ${i + 1}: Invalid customer_email format: ${row.customer_email}`)
        continue
      }
    }

    ordersToGeocode.push({
      rowIndex: i + 1,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      order_number: row.order_number, // Include order_number from CSV if provided
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      phone: row.phone,
      notes: row.notes,
    })
  }

  if (errors.length > 0) {
    return {
      imported: 0,
      errors,
    }
  }

  console.log(`[v0] Geocoding ${ordersToGeocode.length} addresses in batches...`)

  // ----- Pre-flight order_number duplicate detection -----------------------
  // 1. Detect duplicates within the CSV itself.
  const dedupSeen = new Map<string, number>()
  const csvDupes: string[] = []
  for (const o of ordersToGeocode) {
    if (o.order_number && o.order_number.trim() !== "") {
      const key = o.order_number.trim()
      if (dedupSeen.has(key)) {
        csvDupes.push(`Row ${o.rowIndex}: order_number "${key}" duplicates row ${dedupSeen.get(key)}`)
      } else {
        dedupSeen.set(key, o.rowIndex)
      }
    }
  }

  if (csvDupes.length > 0) {
    return { imported: 0, errors: csvDupes }
  }

  // 2. Detect duplicates against orders already in the database for this admin.
  const providedNumbers = ordersToGeocode
    .map((o) => o.order_number?.trim())
    .filter((n): n is string => !!n && n.length > 0)

  if (providedNumbers.length > 0) {
    const { data: existing } = await supabase
      .from("orders")
      .select("order_number")
      .eq("admin_id", user.id)
      .in("order_number", providedNumbers)

    const existingSet = new Set((existing || []).map((r: any) => r.order_number))
    const dbDupes = providedNumbers.filter((n) => existingSet.has(n))

    if (dbDupes.length > 0) {
      return {
        imported: 0,
        errors: [
          `The following order_number value(s) already exist in your account and would create duplicates: ${dbDupes.join(", ")}. Please remove or rename them and try again.`,
        ],
      }
    }
  }

  // Batch geocode all addresses
  const geocodeResults = await geocodeBatch(
    ordersToGeocode.map((o) => ({
      address: o.address,
      city: o.city,
      state: o.state,
      zip: o.zip,
    })),
    Number(process.env.HERE_GEOCODING_BATCH_SIZE || 5),
    { adminId: user.id, userId: user.id },
  )

  // Build final orders array with geocoding results
  const orders = []
  const failedGeocodeRows: number[] = []
  let successCount = 0

  for (let i = 0; i < ordersToGeocode.length; i++) {
    const order = ordersToGeocode[i]
    const geoResult = geocodeResults[i]

    if (!geoResult) {
      failedGeocodeRows.push(order.rowIndex)
    }

    const orderData: any = {
      customer_name: order.customer_name,
      address: order.address,
      city: order.city || null,
      state: order.state || null,
      zip: order.zip || null,
      phone: order.phone || null,
      notes: order.notes || null,
      latitude: geoResult?.latitude || null,
      longitude: geoResult?.longitude || null,
      geocode_at: new Date().toISOString(),
      geocode_label: geoResult?.formattedAddress || null,
      geocode_status: geoResult ? "success" : "failed",
      geocode_error: geoResult ? null : "No geocoding result",
      status: "pending",
      order_number: order.order_number || generateOrderNumber(),
      admin_id: user.id, // Add admin_id for multi-tenancy
    }

    if (hasEmailColumn && order.customer_email) {
      orderData.customer_email = order.customer_email
    }

    orders.push(orderData)
    successCount++
  }

  // Insert all orders
  if (orders.length > 0) {
    const { error } = await supabase.from("orders").insert(orders)
    if (error) {
      // 23505 = unique_violation. With the partial unique index on
      // (admin_id, order_number) the database is now the final guard against
      // duplicate order numbers even if they slip past the pre-flight check.
      if ((error as any)?.code === "23505" || error.message.toLowerCase().includes("unique")) {
        throw new Error(
          "One or more order numbers in your CSV conflict with existing orders. Please remove duplicates and try again.",
        )
      }
      throw error
    }
  }

  if (failedGeocodeRows.length > 0) {
    errors.push(
      `${failedGeocodeRows.length} order(s) imported without coordinates (rows: ${failedGeocodeRows.join(", ")}). These orders cannot be added to routes until geocoded.`,
    )
  }

  revalidatePath("/admin/orders")

  return {
    imported: successCount,
    errors,
  }
}


// ============================================================================
// FAILED DELIVERY RE-ROUTE / RETRY
// ============================================================================
// Three exported actions:
//   retryFailedOrder(orderId)         -> back to "pending", no route assigned
//   addFailedOrderToRoute(orderId, r) -> placed at end of an existing route
//   bulkRetryFailedOrders(orderIds[]) -> bulk version of retryFailedOrder
//
// All of these:
//   * verify the order belongs to the current admin
//   * verify the order is currently in "failed" state
//   * increment retry_count
//   * preserve original_route_id (set automatically by the DB trigger added
//     in migration 030 when status first transitions to "failed")
//   * insert a stop_events row of type 'rerouted' for audit history

async function _verifyFailedOrder(supabase: any, orderId: string, adminId: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("admin_id", adminId)
    .single()

  if (error || !order) {
    throw new Error("Order not found or access denied")
  }
  if (order.status !== "failed") {
    throw new Error(`Only failed orders can be retried. Current status: ${order.status}`)
  }
  return order
}

export async function retryFailedOrder(orderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const order = await _verifyFailedOrder(supabase, orderId, user.id)

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "pending",
      route_id: null,
      stop_sequence: null,
      retry_count: (order.retry_count ?? 0) + 1,
    })
    .eq("id", orderId)
    .eq("admin_id", user.id)

  if (updateError) {
    console.error("[v0] [RETRY_FAILED] update failed:", updateError)
    throw new Error(`Failed to retry order: ${updateError.message}`)
  }

  // Audit trail (best-effort)
  await supabase.from("stop_events").insert({
    order_id: orderId,
    driver_id: user.id, // admin id is logged here as actor
    event_type: "rerouted",
    notes: `Order returned to pending queue (retry #${(order.retry_count ?? 0) + 1})`,
  })

  revalidatePath("/admin/orders")
  if (order.route_id) revalidatePath(`/admin/routes/${order.route_id}`)
  if (order.original_route_id) revalidatePath(`/admin/routes/${order.original_route_id}`)
  return { success: true }
}

export async function addFailedOrderToRoute(orderId: string, targetRouteId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const order = await _verifyFailedOrder(supabase, orderId, user.id)

  // Verify target route belongs to admin and is not archived/completed
  const { data: targetRoute, error: routeError } = await supabase
    .from("routes")
    .select("id, status, archived_at")
    .eq("id", targetRouteId)
    .eq("admin_id", user.id)
    .single()

  if (routeError || !targetRoute) {
    throw new Error("Target route not found or access denied")
  }
  if (targetRoute.archived_at) {
    throw new Error("Cannot add stops to an archived route. Restore it first or pick another route.")
  }
  if (targetRoute.status === "completed") {
    throw new Error("Cannot add stops to a completed route. Pick a draft or active route.")
  }

  // Find the current max stop_sequence on this route to append at the end
  const { data: maxStopRow } = await supabase
    .from("orders")
    .select("stop_sequence")
    .eq("route_id", targetRouteId)
    .eq("admin_id", user.id)
    .order("stop_sequence", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSeq = (maxStopRow?.stop_sequence ?? 0) + 1

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "assigned",
      route_id: targetRouteId,
      stop_sequence: nextSeq,
      retry_count: (order.retry_count ?? 0) + 1,
    })
    .eq("id", orderId)
    .eq("admin_id", user.id)

  if (updateError) {
    console.error("[v0] [REROUTE] update failed:", updateError)
    throw new Error(`Failed to add order to route: ${updateError.message}`)
  }

  // Bump the route's total_stops counter
  await supabase
    .from("routes")
    .update({ total_stops: nextSeq })
    .eq("id", targetRouteId)
    .eq("admin_id", user.id)

  // Audit trail
  await supabase.from("stop_events").insert({
    order_id: orderId,
    driver_id: user.id,
    event_type: "rerouted",
    notes: `Order moved to route ${targetRouteId} as stop #${nextSeq} (retry #${(order.retry_count ?? 0) + 1})`,
  })

  revalidatePath("/admin/orders")
  revalidatePath(`/admin/routes/${targetRouteId}`)
  if (order.route_id && order.route_id !== targetRouteId) {
    revalidatePath(`/admin/routes/${order.route_id}`)
  }
  return { success: true, stop_sequence: nextSeq }
}

export async function bulkRetryFailedOrders(orderIds: string[]) {
  let retried = 0
  const errors: string[] = []
  for (const id of orderIds) {
    try {
      await retryFailedOrder(id)
      retried++
    } catch (err: any) {
      errors.push(`${id}: ${err?.message ?? "unknown error"}`)
    }
  }
  return { retried, errors }
}
