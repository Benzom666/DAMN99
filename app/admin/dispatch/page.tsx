import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DispatchMonitor } from "./dispatch-monitor"
import { PageHeader } from "@/components/page-header"

export default async function DispatchPage() {
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
    .in("status", ["active", "pending", "completed"])
    .order("created_at", { ascending: false })

  if (routesError) {
    console.error("[DISPATCH] Error fetching routes:", routesError)
  }

  const routeIds = routes?.map((r) => r.id) || []

  let orders: any[] = []
  if (routeIds.length > 0) {
    const { data, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .in("route_id", routeIds)
      .order("stop_sequence", { ascending: true })

    if (ordersError) {
      console.error("[DISPATCH] Error fetching orders:", ordersError)
    }

    orders = data || []
  }

  const orderIds = orders.map((o) => o.id).filter(Boolean)

  let pods: any[] = []
  if (orderIds.length > 0) {
    const { data: allPods, error: podsError } = await supabase
      .from("pods")
      .select(
        "id, order_id, driver_id, photo_url, signature_url, recipient_name, notes, delivered_at",
      )
      .in("order_id", orderIds)

    if (podsError) {
      console.error("[DISPATCH] Error fetching PODs:", podsError)
    }

    pods = allPods || []
  }

  const driverIds = routes?.map((r) => r.driver_id).filter(Boolean) || []
  let driverPositions: any[] = []
  if (
    driverIds.length > 0 &&
    process.env.NEXT_PUBLIC_ENABLE_DISPATCH_MAP === "true"
  ) {
    const { data } = await supabase
      .from("driver_positions")
      .select("*, profiles(display_name, email)")
      .in("driver_id", driverIds)
    driverPositions = data || []
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        eyebrow="Live operations"
        title="Dispatch monitor"
        description="Real-time positions, on-the-wire status, every drop as it lands."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-6">
        <DispatchMonitor
          routes={routes || []}
          orders={orders || []}
          pods={pods || []}
          driverPositions={driverPositions || []}
        />
      </main>
    </div>
  )
}
