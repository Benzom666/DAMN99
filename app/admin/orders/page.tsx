import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "./orders-table"
import { MigrationBanner } from "./migration-banner"
import { PageHeader } from "@/components/page-header"

export default async function OrdersPage() {
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

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[ORDERS] Error fetching orders:", error)
  }

  // Routes that a failed order can be re-added to: own admin, not archived,
  // not completed. The Retry dialog only shows these.
  const { data: eligibleRoutes } = await supabase
    .from("routes")
    .select("id, name, status")
    .eq("admin_id", user.id)
    .is("archived_at", null)
    .in("status", ["draft", "active"])
    .order("created_at", { ascending: false })

  const needsMigration =
    orders && orders.length > 0 && !("order_number" in orders[0])

  return (
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        eyebrow="Manifest"
        title="Order manifest"
        description="Drop, edit, archive, and assign every package moving through the system."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-6">
        {needsMigration && <MigrationBanner />}
        <OrdersTable orders={orders || []} eligibleRoutes={eligibleRoutes || []} />
      </main>
    </div>
  )
}
