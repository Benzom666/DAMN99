import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"
import Link from "next/link"
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  LogOut,
  MapPin,
  Activity,
} from "lucide-react"

export default async function DriverDashboard() {
  const supabase = await createServerClient()

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
    .maybeSingle()

  if (!profile) {
    redirect("/auth/complete-profile")
  }

  if (profile.role !== "driver") {
    redirect("/admin")
  }

  const { data: routes } = await supabase
    .from("routes")
    .select("*, orders(count)")
    .eq("driver_id", user.id)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })

  const routesWithStats = await Promise.all(
    (routes || []).map(async (route) => {
      const { data: orders } = await supabase
        .from("orders")
        .select("status")
        .eq("route_id", route.id)

      const total = orders?.length || 0
      const completed = orders?.filter((o) => o.status === "delivered").length || 0
      const failed = orders?.filter((o) => o.status === "failed").length || 0

      return {
        ...route,
        totalStops: total,
        completedStops: completed,
        failedStops: failed,
      }
    }),
  )

  async function signOut() {
    "use server"
    const supabase = await createServerClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  const driverName = profile.display_name || profile.email?.split("@")[0] || "Driver"
  const totalActive = routesWithStats.length
  const totalStopsToday = routesWithStats.reduce((s, r) => s + r.totalStops, 0)
  const totalCompletedToday = routesWithStats.reduce((s, r) => s + r.completedStops, 0)

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Decorative grid backdrop */}
      <div className="pointer-events-none fixed inset-0 bg-grid-paper-fine opacity-25 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

      {/* Header — driver console */}
      <header className="border-b border-border bg-background/85 backdrop-blur-md sticky top-0 z-30 relative">
        <div className="absolute top-0 left-0 right-0 h-1 hazard-stripe opacity-80" />
        <div className="px-4 sm:px-6 pt-5 pb-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <Link href="/driver" className="flex items-center gap-2.5">
              <BrandMark size={7} />
              <div className="flex flex-col leading-tight">
                <span className="font-mono text-[11px] font-semibold tracking-[0.16em]">
                  <span className="font-serif italic font-normal mr-1 normal-case">
                    Delivery
                  </span>
                  OS
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Field App
                </span>
              </div>
            </Link>
            <form action={signOut}>
              <Button variant="ghost" size="icon-sm" title="Sign Out" type="submit">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-signal border border-signal/40 px-2 py-0.5 rounded-[2px]">
              FIELD-OPS
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase text-success">
              <span className="pulse-dot" />
              On the road
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            Hello,{" "}
            <span className="font-serif italic font-normal text-signal">
              {driverName}
            </span>
            .
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalActive > 0
              ? `${totalActive} active route${totalActive > 1 ? "s" : ""} · ${totalStopsToday - totalCompletedToday} stops to go`
              : "No active routes assigned. Stand by."}
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full relative">
        {/* Day-at-a-glance KPIs */}
        {totalActive > 0 && (
          <section className="mb-6">
            <div className="grid grid-cols-3 border border-border bg-card rounded-sm overflow-hidden">
              {[
                {
                  v: totalStopsToday,
                  l: "Total stops",
                  c: "text-foreground",
                },
                {
                  v: totalCompletedToday,
                  l: "Delivered",
                  c: "text-success",
                },
                {
                  v: totalStopsToday - totalCompletedToday,
                  l: "Remaining",
                  c: "text-signal",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="px-3 py-3 border-r border-border last:border-r-0 text-center"
                >
                  <div
                    className={`font-mono text-2xl font-semibold tracking-tight ${s.c}`}
                  >
                    {s.v}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center justify-between mb-4">
          <span className="eyebrow-signal">§ Active manifest</span>
          {totalActive > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {totalActive} route{totalActive > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {routesWithStats.length === 0 ? (
            <div className="border border-border bg-card rounded-sm p-10 text-center">
              <div className="size-14 grid place-items-center bg-surface-2 border border-border rounded-sm mx-auto mb-4">
                <Package
                  className="size-6 text-muted-foreground"
                  strokeWidth={1.4}
                />
              </div>
              <h3 className="font-semibold text-base mb-1.5">No routes assigned</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Your dispatcher hasn't assigned any routes yet. Check back soon
                or radio in.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <span className="pulse-dot" />
                Standing by
              </div>
            </div>
          ) : (
            routesWithStats.map((route, idx) => {
              const remaining =
                route.totalStops - route.completedStops - route.failedStops
              const progress =
                route.totalStops > 0
                  ? ((route.completedStops + route.failedStops) /
                      route.totalStops) *
                    100
                  : 0
              const isActive = route.status === "active"

              return (
                <Link key={route.id} href={`/driver/routes/${route.id}`}>
                  <div className="group border border-border hover:border-signal/60 bg-card hover:bg-surface-2 rounded-sm overflow-hidden transition-all duration-200 relative">
                    {/* Top: meta strip */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-2/60">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                            isActive ? "text-signal" : "text-muted-foreground"
                          }`}
                        >
                          RTE-{String(idx + 1).padStart(3, "0")}
                        </span>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-success">
                            <span className="pulse-dot" />
                            Active
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-warning">
                            Pending
                          </span>
                        )}
                      </div>
                      <ChevronRight
                        className="size-4 text-muted-foreground group-hover:text-signal group-hover:translate-x-0.5 transition-all"
                        strokeWidth={1.6}
                      />
                    </div>

                    {/* Body */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold tracking-tight mb-3 leading-tight">
                        {route.name}
                      </h3>

                      {/* Progress meter */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${progress === 100 ? "bg-success" : "bg-signal"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] tracking-tight tabular-nums text-foreground">
                          {Math.round(progress)}%
                        </span>
                      </div>

                      {/* Stops grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <StopStat
                          icon={Clock}
                          value={remaining}
                          label="Remaining"
                          accent="signal"
                        />
                        <StopStat
                          icon={CheckCircle2}
                          value={route.completedStops}
                          label="Delivered"
                          accent="success"
                        />
                        <StopStat
                          icon={XCircle}
                          value={route.failedStops}
                          label="Failed"
                          accent="destructive"
                        />
                      </div>
                    </div>

                    {/* Hover signal stripe */}
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-signal group-hover:w-full transition-all duration-500" />
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Bottom status strip */}
        <div className="mt-8 border-t border-border pt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Activity className="size-3" />
            GPS streaming · 30s
          </span>
          <span>v1.0 · field-app</span>
        </div>
      </main>
    </div>
  )
}

function StopStat({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  value: number
  label: string
  accent: "signal" | "success" | "destructive"
}) {
  const colorMap = {
    signal: "text-signal border-signal/40 bg-signal/10",
    success: "text-success border-success/40 bg-success/10",
    destructive: "text-destructive border-destructive/40 bg-destructive/10",
  }
  return (
    <div
      className={`border ${colorMap[accent]} px-3 py-3 rounded-sm text-center relative`}
    >
      <Icon
        className={`size-4 mx-auto mb-1 ${
          accent === "signal"
            ? "text-signal"
            : accent === "success"
              ? "text-success"
              : "text-destructive"
        }`}
        strokeWidth={1.6}
      />
      <div className="font-mono text-lg font-semibold tracking-tight">
        {value}
      </div>
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  )
}
