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

  const { data: routes } = await supabase
    .from("routes")
    .select("*, profiles(display_name, email)")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false })

  const { data: orders } = await supabase.from("orders").select("*").eq("admin_id", user.id)

  const { data: drivers, error: driversError } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "driver")
    .eq("admin_id", user.id)
    .eq("is_active", true)

  console.log("[v0] [ROUTES] Fetched routes count:", routes?.length || 0)
  console.log("[v0] [ROUTES] Fetched orders count:", orders?.length || 0)
  console.log("[v0] [ROUTES] Fetched drivers count:", drivers?.length || 0)
  if (driversError) {
    console.error("[v0] [ROUTES] Error fetching drivers:", driversError)
  }

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
