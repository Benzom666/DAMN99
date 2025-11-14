import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "./orders-table"
import { MigrationBanner } from "./migration-banner"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function OrdersPage() {
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

  console.log("[v0] [ORDERS] Admin ID:", user.id)

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false })

  console.log("[v0] [ORDERS] Fetched orders count:", orders?.length || 0)
  if (error) {
    console.error("[v0] [ORDERS] Error fetching orders:", error)
  }

  const needsMigration = orders && orders.length > 0 && !("order_number" in orders[0])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-semibold">
              Admin Dashboard
            </Link>
            <nav className="flex gap-4">
              <Link href="/admin/orders" className="text-sm font-medium">
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
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">{profile.display_name || profile.email}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        {needsMigration && <MigrationBanner />}
        <OrdersTable orders={orders || []} />
      </main>
    </div>
  )
}
