import { redirect } from 'next/navigation'
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, LogOut } from 'lucide-react'

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

  // Get order counts for each route
  const routesWithStats = await Promise.all(
    (routes || []).map(async (route) => {
      const { data: orders } = await supabase.from("orders").select("status").eq("route_id", route.id)

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Driver Dashboard</h1>
              <p className="text-sm text-muted-foreground">{profile.display_name || profile.email}</p>
            </div>
            <form action={signOut}>
              <Button variant="ghost" size="icon" title="Sign Out">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold mb-2">Welcome, {profile.display_name || "Driver"}!</h2>
            <p className="text-muted-foreground">Your assigned routes and deliveries</p>
          </div>

          {/* Routes List */}
          <div className="space-y-4">
            {routesWithStats.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">No Active Routes</h3>
                <p className="text-muted-foreground text-sm">You don't have any routes assigned yet</p>
              </Card>
            ) : (
              routesWithStats.map((route) => {
                const progress = route.totalStops > 0 
                  ? ((route.completedStops + route.failedStops) / route.totalStops) * 100 
                  : 0

                return (
                  <Link key={route.id} href={`/driver/routes/${route.id}`}>
                    <Card className="card-hover cursor-pointer overflow-hidden">
                      {/* Route Header */}
                      <div className="p-4 border-b bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">{route.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                route.status === 'active' 
                                  ? 'bg-info/10 text-info border border-info/20' 
                                  : 'bg-warning/10 text-warning border border-warning/20'
                              }`}>
                                {route.status}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="px-4 pt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium">Progress</span>
                          <span className="text-muted-foreground">
                            {route.completedStops + route.failedStops} / {route.totalStops} stops
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 p-4">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <div className="text-lg font-bold">
                            {route.totalStops - route.completedStops - route.failedStops}
                          </div>
                          <div className="text-xs text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-success/10">
                          <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-success" />
                          <div className="text-lg font-bold text-success">
                            {route.completedStops}
                          </div>
                          <div className="text-xs text-success/80">Delivered</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-destructive/10">
                          <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
                          <div className="text-lg font-bold text-destructive">
                            {route.failedStops}
                          </div>
                          <div className="text-xs text-destructive/80">Failed</div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
