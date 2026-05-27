import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandLockup } from "@/components/brand-mark"
import Link from "next/link"
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  LogOut,
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
      const completed =
        orders?.filter((o) => o.status === "delivered").length || 0
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

  const driverName =
    profile.display_name || profile.email?.split("@")[0] || "Driver"
  const totalActive = routesWithStats.length
  const totalStopsToday = routesWithStats.reduce(
    (s, r) => s + r.totalStops,
    0,
  )
  const totalCompletedToday = routesWithStats.reduce(
    (s, r) => s + r.completedStops,
    0,
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/85 backdrop-blur-md sticky top-0 z-30">
        <div className="px-4 sm:px-6 pt-5 pb-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <Link href="/driver">
              <BrandLockup textSize="sm" />
            </Link>
            <form action={signOut}>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Sign out"
                type="submit"
              >
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>

          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            Hello, {driverName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalActive > 0
              ? `${totalActive} active route${totalActive > 1 ? "s" : ""} · ${totalStopsToday - totalCompletedToday} stops to go`
              : "No active routes assigned. Stand by."}
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full">
        {/* Day summary */}
        {totalActive > 0 && (
          <section className="mb-6">
            <div className="grid grid-cols-3 soft-card overflow-hidden">
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
                  c: "text-primary",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="px-3 py-4 text-center border-r border-border last:border-r-0"
                >
                  <div className={`text-2xl font-bold tracking-tight ${s.c}`}>
                    {s.v}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="section-eyebrow">Active manifest</div>
          {totalActive > 0 && (
            <span className="text-xs text-muted-foreground">
              {totalActive} route{totalActive > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {routesWithStats.length === 0 ? (
            <div className="soft-card p-10 text-center">
              <div className="size-14 grid place-items-center bg-secondary rounded-full mx-auto mb-4">
                <Package
                  className="size-6 text-muted-foreground"
                  strokeWidth={1.6}
                />
              </div>
              <h3 className="font-semibold text-base mb-1.5">
                No routes assigned
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Your dispatcher hasn't assigned any routes yet. Check back soon.
              </p>
            </div>
          ) : (
            routesWithStats.map((route) => {
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
                <Link
                  key={route.id}
                  href={`/driver/routes/${route.id}`}
                  className="soft-card p-5 group block transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                      <h3 className="text-base font-semibold tracking-tight truncate">
                        {route.name}
                      </h3>
                    </div>
                    <ChevronRight
                      className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      strokeWidth={1.6}
                    />
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progress === 100 ? "bg-success" : "bg-primary"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-foreground font-medium">
                      {Math.round(progress)}%
                    </span>
                  </div>

                  {/* Stop tiles */}
                  <div className="grid grid-cols-3 gap-2">
                    <StopStat
                      icon={Clock}
                      value={remaining}
                      label="Remaining"
                      tone="primary"
                    />
                    <StopStat
                      icon={CheckCircle2}
                      value={route.completedStops}
                      label="Delivered"
                      tone="success"
                    />
                    <StopStat
                      icon={XCircle}
                      value={route.failedStops}
                      label="Failed"
                      tone="destructive"
                    />
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Bottom strip */}
        <div className="mt-8 border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Activity className="size-3" />
            GPS streaming · 30s
          </span>
          <span>Field app · v1.0</span>
        </div>
      </main>
    </div>
  )
}

function StopStat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  value: number
  label: string
  tone: "primary" | "success" | "destructive"
}) {
  const map = {
    primary: { icon: "text-primary", bg: "bg-primary-soft" },
    success: { icon: "text-success", bg: "bg-success-soft" },
    destructive: { icon: "text-destructive", bg: "bg-destructive-soft" },
  }
  const c = map[tone]
  return (
    <div className={`rounded-xl px-3 py-3 text-center ${c.bg}`}>
      <Icon className={`size-4 mx-auto mb-1 ${c.icon}`} strokeWidth={1.8} />
      <div className="text-base font-bold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}
