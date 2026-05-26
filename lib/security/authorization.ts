// Authorization helpers
import { createServerClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function requireAuthentication() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Authentication required")
  }

  return { user, supabase }
}

export async function requireAdmin() {
  const { user, supabase } = await requireAuthentication()

  const { data: profile } = await supabase.from("profiles").select("role, admin_id").eq("id", user.id).maybeSingle()

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("Admin access required")
  }

  return { user, profile, supabase }
}

export async function requireDriver() {
  const { user, supabase } = await requireAuthentication()

  const { data: profile } = await supabase.from("profiles").select("role, admin_id").eq("id", user.id).maybeSingle()

  if (!profile || profile.role !== "driver") {
    throw new Error("Driver access required")
  }

  return { user, profile, supabase }
}

export async function requireSuperAdmin() {
  const { user } = await requireAuthentication()

  const supabaseAdmin = createServiceRoleClient()
  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle()

  if (!profile || profile.role !== "super_admin") {
    throw new Error("Super admin access required")
  }

  return { user, profile, supabase: supabaseAdmin }
}

export async function canAccessOrder(orderId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "admin" || userRole === "super_admin") {
    return true
  }

  if (userRole === "driver") {
    const supabase = await createServerClient()
    const { data: order } = await supabase
      .from("orders")
      .select("route_id, routes!inner(driver_id)")
      .eq("id", orderId)
      .maybeSingle()

    const routeRel = order?.routes as unknown
    const driverId = Array.isArray(routeRel)
      ? (routeRel[0] as { driver_id?: string | null })?.driver_id
      : (routeRel as { driver_id?: string | null } | null)?.driver_id

    return driverId === userId
  }

  return false
}
