import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RoutesTable } from "./routes-table"
import Link from "next/link"

export default async function RoutesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/driver")
  }

  console.log("[v0] [ROUTES] Admin ID:", user.id)

  const { data: routes, error: routesError } = await supabase
    .from("routes")
    .select("*, driver:profiles!driver_id(display_name, email)")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false })

  if (routesError) {
    console.error("[v0] [ROUTES] Error fetching routes:", routesError)
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .or(`admin_id.eq.${user.id},admin_id.is.null`)

  if (ordersError) {
    console.error("[v0] [ROUTES] Error fetching orders:", ordersError)
  }

  if (orders && orders.length > 0) {
    const ordersNeedingAdminId = orders.filter((o) => !o.admin_id)
    if (ordersNeedingAdminId.length > 0) {
      console.log("[v0] [ROUTES] Auto-assigning admin_id to", ordersNeedingAdminId.length, "orders")
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
    console.error("[v0] [ROUTES] Error fetching drivers:", driversError)
  }

  let drivers = allDrivers || []

  if (drivers.length > 0) {
    const driversNeedingAdminId = drivers.filter((d) => !d.admin_id)
    const driversForThisAdmin = drivers.filter((d) => d.admin_id === user.id)

    // If this admin has no drivers, assign some unassigned drivers to them
    if (driversForThisAdmin.length === 0 && driversNeedingAdminId.length > 0) {
      console.log("[v0] [ROUTES] Admin has no drivers, assigning", driversNeedingAdminId.length, "unassigned drivers")
      await supabase
        .from("profiles")
        .update({ admin_id: user.id })
        .in(
          "id",
          driversNeedingAdminId.map((d) => d.id),
        )
      drivers = drivers.map((d) =>
        driversNeedingAdminId.some((nd) => nd.id === d.id) ? { ...d, admin_id: user.id } : d,
      )
    }

    // Filter to only show this admin's drivers
    drivers = drivers.filter((d) => d.admin_id === user.id)
  }

  console.log("[v0] [ROUTES] Fetched routes count:", routes?.length || 0)
  console.log("[v0] [ROUTES] Fetched orders count:", orders?.length || 0)
  console.log("[v0] [ROUTES] Fetched drivers count:", drivers?.length || 0)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-semibold">
              Admin Dashboard
            </Link>
            <nav className="flex gap-4">
              <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
                Orders
              </Link>
              <Link href="/admin/routes" className="text-sm font-medium">
                Routes
              </Link>
              <Link href="/admin/drivers" className="text-sm text-muted-foreground hover:text-foreground">
                Drivers
              </Link>
              <Link href="/admin/dispatch" className="text-sm text-muted-foreground hover:text-foreground">
                Dispatch
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile.display_name || profile.email}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        <RoutesTable routes={routes || []} orders={orders || []} drivers={drivers || []} />
      </main>
    </div>
  )
}
