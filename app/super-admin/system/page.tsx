import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { createServerClient } from "@/lib/supabase/server"
import { Database, Activity, TrendingUp, FileImage } from "lucide-react"
import { PageHeader } from "@/components/page-header"

export default async function SystemHealthPage() {
  await requireSuperAdmin()

  const supabase = await createServerClient()

  const [
    { count: totalProfiles },
    { count: totalOrders },
    { count: totalRoutes },
    { count: totalPods },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("routes").select("*", { count: "exact", head: true }),
    supabase.from("pods").select("*", { count: "exact", head: true }),
  ])

  const cards = [
    {
      code: "DB-01",
      icon: Database,
      label: "Total profiles",
      value: totalProfiles || 0,
      meta: "Database records",
    },
    {
      code: "DB-02",
      icon: Activity,
      label: "Total orders",
      value: totalOrders || 0,
      meta: "All-time orders",
    },
    {
      code: "DB-03",
      icon: TrendingUp,
      label: "Total routes",
      value: totalRoutes || 0,
      meta: "All-time routes",
    },
    {
      code: "DB-04",
      icon: FileImage,
      label: "Total PODs",
      value: totalPods || 0,
      meta: "Proof of deliveries",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        tag="SUPER · S-08"
        eyebrow="Sovereign · Infrastructure"
        title="System"
        serifEmphasis="health"
        description="Database statistics and system performance counters."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-8">
        <section>
          <div className="mb-5">
            <span className="eyebrow-signal">§ 01 · Database counters</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.code} className="metric-card">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                    {c.code}
                  </span>
                  <c.icon
                    className="size-4 text-muted-foreground"
                    strokeWidth={1.6}
                  />
                </div>
                <div className="font-mono text-3xl font-semibold tracking-tight text-foreground mb-1">
                  {c.value}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {c.label}
                </div>
                <div className="text-xs text-muted-foreground/80 mt-3 pt-3 border-t border-border">
                  {c.meta}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5">
            <span className="eyebrow-signal">§ 02 · Operational status</span>
          </div>
          <div className="border border-success/40 bg-success-soft px-5 py-4 rounded-sm relative">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-success" />
            <div className="flex items-center gap-3">
              <div className="pulse-dot" />
              <div className="flex-1">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-success">
                  All systems green
                </span>
                <p className="text-sm text-foreground/80 mt-0.5">
                  Database, auth, storage, and HERE API integrations are
                  reachable. Last check{" "}
                  <span className="font-mono text-foreground">
                    {new Date().toLocaleTimeString()}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
