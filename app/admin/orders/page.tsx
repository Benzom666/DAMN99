import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "./orders-table"
import { MigrationBanner } from "./migration-banner"

export default async function OrdersPage() {
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

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[ORDERS] Error fetching orders:", error)
  }

  const needsMigration = orders && orders.length > 0 && !("order_number" in orders[0])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all delivery orders
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-6">
        {needsMigration && <MigrationBanner />}
        <OrdersTable orders={orders || []} />
      </main>
    </div>
  )
}
