import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RoutesTable } from "./routes-table"
import { PageHeader } from "@/components/page-header"

export default async function RoutesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/driver")
  }

  const { data: routes, error: routesError } = await supabase
    .from("routes")
    .select("*, driver:profiles!driver_id(display_name, email)")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false })

  if (routesError) {
    console.error("[ROUTES] Error fetching routes:", routesError)
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .or(`admin_id.eq.${user.id},admin_id.is.null`)

  if (ordersError) {
    console.error("[ROUTES] Error fetching orders:", ordersError)
  }

  if (orders && orders.length > 0) {
    const ordersNeedingAdminId = orders.filter((o) => !o.admin_id)
    if (ordersNeedingAdminId.length > 0) {
      await supabase
        .from("orders")
        .update({ admin_id: user.id })
        .in(
          "id",
          ordersNeedingAdminId.map((o) => o.id),
        )
    }
  }

  const { data: allDrivers, error: driversError } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "driver")
    .eq("is_active", true)

  if (driversError) {
    console.error("[ROUTES] Error fetching drivers:", driversError)
  }

  let drivers = allDrivers || []

  if (drivers.length > 0) {
    const driversNeedingAdminId = drivers.filter((d) => !d.admin_id)
    const driversForThisAdmin = drivers.filter((d) => d.admin_id === user.id)

    if (driversForThisAdmin.length === 0 && driversNeedingAdminId.length > 0) {
      await supabase
        .from("profiles")
        .update({ admin_id: user.id })
        .in(
          "id",
          driversNeedingAdminId.map((d) => d.id),
        )
      drivers = drivers.map((d) =>
        driversNeedingAdminId.some((nd) => nd.id === d.id)
          ? { ...d, admin_id: user.id }
          : d,
      )
    }

    drivers = drivers.filter((d) => d.admin_id === user.id)
  }

  const routesWithProgress = (routes || []).map((route) => {
    const routeOrders = orders?.filter((o) => o.route_id === route.id) || []
    const totalStops = routeOrders.length
    const completedStops = routeOrders.filter(
      (o) => o.status === "delivered" || o.status === "failed",
    ).length

    return {
      ...route,
      total_stops: totalStops,
      completed_stops: completedStops,
    }
  })

  return (
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        eyebrow="Optimization"
        title="Route planner"
        description="Solve, sequence, and dispatch routes. Constraints in, optimal paths out."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-6">
        <RoutesTable
          routes={routesWithProgress || []}
          orders={orders || []}
          drivers={drivers || []}
        />
      </main>
    </div>
  )
}
