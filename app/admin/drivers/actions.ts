"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

function getServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function toggleDriverStatus(driverId: string, isActive: boolean) {
  console.log("[v0] [DRIVER] Toggling driver status:", { driverId, isActive })
  const supabase = getServiceClient()

  const { data, error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", driverId).select()

  if (error) {
    console.error("[v0] [DRIVER] Error updating driver status:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] [DRIVER] Driver status updated successfully:", data)

  revalidatePath("/admin/drivers", "page")

  return { success: true, data }
}

export async function updateDriverDetails(
  driverId: string,
  data: {
    display_name?: string
    vehicle_capacity?: number
    shift_start?: string
    shift_end?: string
  },
) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("profiles").update(data).eq("id", driverId)

  if (error) {
    console.error("[v0] Error updating driver details:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/drivers", "page")
  return { success: true }
}

export async function deleteDriver(driverId: string) {
  console.log("[v0] [DRIVER] Deleting driver:", driverId)
  const supabase = getServiceClient()

  // Check if driver has any assigned routes
  const { data: routes, error: routesError } = await supabase
    .from("routes")
    .select("id")
    .eq("driver_id", driverId)
    .limit(1)

  if (routesError) {
    console.error("[v0] [DRIVER] Error checking driver routes:", routesError)
    return { success: false, error: routesError.message }
  }

  if (routes && routes.length > 0) {
    return {
      success: false,
      error: "Cannot delete driver with assigned routes. Please reassign or delete their routes first.",
    }
  }

  // Delete the driver
  const { data, error } = await supabase.from("profiles").delete().eq("id", driverId).select()

  if (error) {
    console.error("[v0] [DRIVER] Error deleting driver:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] [DRIVER] Driver deleted successfully:", data)
  revalidatePath("/admin/drivers", "page")
  return { success: true }
}
