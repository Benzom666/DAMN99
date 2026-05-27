import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { RoutesTable } from "./routes-table"
import { PageHeader } from "@/components/page-header"

export default async function SuperAdminRoutesPage() {
  await requireSuperAdmin()

  const supabase = await createServiceRoleClient()

  const { data: routes, error } = await supabase
    .from("routes")
    .select(
      `
      *,
      driver:profiles!driver_id(email, display_name),
      admin:profiles!admin_id(email, display_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("Error fetching routes:", error)
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, route_id, status")
    .not("route_id", "is", null)

  const { data: drivers } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("role", "driver")
    .order("display_name")

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
        title="Route atlas"
        description="Latest 200 routes across every tenant. Reassign or override as needed."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-6">
        <RoutesTable
          routes={routesWithProgress || []}
          drivers={drivers || []}
        />
      </main>
    </div>
  )
}
