import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { RouteHistoryTable } from "./route-history-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function RouteHistoryPage() {
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

  // Pull both archived live routes and route_history snapshots, then merge.
  // A route is shown in history if it has either an archived_at timestamp OR
  // at least one snapshot in route_history.
  const { data: archivedRoutes } = await supabase
    .from("routes")
    .select("*, driver:profiles!driver_id(display_name, email)")
    .eq("admin_id", user.id)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false })

  const { data: historyRows } = await supabase
    .from("route_history")
    .select("*")
    .eq("admin_id", user.id)
    .order("archived_at", { ascending: false })

  return (
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        eyebrow="Archive"
        title="Route history"
        description="Completed and archived routes with permanent snapshots. Export, restore, or review past deliveries."
        actions={
          <Link href="/admin/routes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to routes
            </Button>
          </Link>
        }
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-6">
        <RouteHistoryTable
          archivedRoutes={archivedRoutes || []}
          historyRows={historyRows || []}
        />
      </main>
    </div>
  )
}
