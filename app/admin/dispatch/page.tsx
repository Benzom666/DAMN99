import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DispatchMonitor } from "./dispatch-monitor"

export default async function DispatchPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/driver")
  }

  // Get active routes with driver info
  const { data: routes, error: routesError } = await supabase
    .from("routes")
    .select("*, driver:profiles!driver_id(display_name, email)")
    .eq("admin_id", user.id)
    .in("status", ["active", "pending", "completed"])
    .order("created_at", { ascending: false })

  if (routesError) {
    console.error("[DISPATCH] Error fetching routes:", routesError)
  }

  // Get all orders for routes (including completed ones for POD visibility)
  const routeIds = routes?.map((r) => r.id) || []

  let orders = []
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

  // Get PODs for all delivered orders
  const orderIds = orders.map(o => o.id).filter(Boolean)
  
  let pods = []
  if (orderIds.length > 0) {
    const { data: allPods, error: podsError } = await supabase
      .from("pods")
      .select("id, order_id, driver_id, photo_url, signature_url, recipient_name, notes, delivered_at")
      .in("order_id", orderIds)

    if (podsError) {
      console.error("[DISPATCH] Error fetching PODs:", podsError)
    }
    
    pods = allPods || []
  }

  const driverIds = routes?.map((r) => r.driver_id).filter(Boolean) || []
  let driverPositions = []
  if (driverIds.length > 0 && process.env.NEXT_PUBLIC_ENABLE_DISPATCH_MAP === "true") {
    const { data } = await supabase
      .from("driver_positions")
      .select("*, profiles(display_name, email)")
      .in("driver_id", driverIds)
    driverPositions = data || []
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dispatch Monitor</h1>
            <p className="text-muted-foreground mt-1">
              Real-time tracking and delivery monitoring
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-6">
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
