import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AnalyticsDashboard } from "./analytics-dashboard"
import Link from "next/link"

export default async function AnalyticsPage() {
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

  // Fetch all analytics data
  const [
    { data: orders },
    { data: routes },
    { data: pods },
    { data: podEmails },
    { data: drivers },
    { data: stopEvents },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*, route:routes(name, driver_id, driver:profiles!driver_id(display_name, email))")
      .eq("admin_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("routes")
      .select("*, driver:profiles!driver_id(display_name, email)")
      .eq("admin_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pods")
      .select("*, order:orders!inner(admin_id, customer_name, address, order_number)")
      .eq("order.admin_id", user.id),
    supabase
      .from("pod_emails")
      .select("*, pod:pods!inner(order:orders!inner(admin_id))")
      .eq("pod.order.admin_id", user.id),
    supabase.from("profiles").select("*").eq("role", "driver").eq("admin_id", user.id).eq("is_active", true),
    supabase
      .from("stop_events")
      .select("*, order:orders!inner(admin_id, customer_name, address)")
      .eq("order.admin_id", user.id)
      .order("created_at", { ascending: false }),
  ])

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
              <Link href="/admin/routes" className="text-sm text-muted-foreground hover:text-foreground">
                Routes
              </Link>
              <Link href="/admin/drivers" className="text-sm text-muted-foreground hover:text-foreground">
                Drivers
              </Link>
              <Link href="/admin/dispatch" className="text-sm text-muted-foreground hover:text-foreground">
                Dispatch
              </Link>
              <Link href="/admin/analytics" className="text-sm font-medium">
                Analytics
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile.display_name || profile.email}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        <AnalyticsDashboard
          orders={orders || []}
          routes={routes || []}
          pods={pods || []}
          podEmails={podEmails || []}
          drivers={drivers || []}
          stopEvents={stopEvents || []}
        />
      </main>
    </div>
  )
}
