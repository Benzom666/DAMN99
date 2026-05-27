import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Package, Route, Radio, Users, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default async function AdminDashboard() {
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
    .maybeSingle()

  if (!profile) {
    redirect("/auth/complete-profile")
  }

  if (profile.role !== "admin" && profile.role !== "super_admin") {
    redirect("/driver")
  }

  // Get comprehensive stats
  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", user.id)

  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", user.id)
    .eq("status", "pending")

  const { count: deliveredOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", user.id)
    .eq("status", "delivered")

  const { count: activeRoutes } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", user.id)
    .eq("status", "active")

  const { count: totalDrivers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", user.id)
    .eq("role", "driver")

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {profile.display_name || "Admin"}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-8 py-6 space-y-8">
        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {pendingOrders || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{deliveredOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {totalOrders ? Math.round((deliveredOrders || 0) / totalOrders * 100) : 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Routes</CardTitle>
              <Route className="h-5 w-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeRoutes || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
            </CardContent>
          </Card>

          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drivers</CardTitle>
              <Users className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalDrivers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total drivers</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/orders" className="group">
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Orders</CardTitle>
                      <CardDescription className="text-xs">Manage deliveries</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/routes" className="group">
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-info/10 text-info group-hover:bg-info group-hover:text-info-foreground transition-colors">
                      <Route className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Routes</CardTitle>
                      <CardDescription className="text-xs">Optimize routes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/drivers" className="group">
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground transition-colors">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Drivers</CardTitle>
                      <CardDescription className="text-xs">Manage team</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/dispatch" className="group">
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground transition-colors">
                      <Radio className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Dispatch</CardTitle>
                      <CardDescription className="text-xs">Live tracking</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Status Overview */}
        {pendingOrders && pendingOrders > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <CardTitle className="text-base">Attention Required</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You have <span className="font-semibold text-foreground">{pendingOrders} pending orders</span> waiting to be assigned to routes.
              </p>
              <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline mt-2 inline-block">
                View pending orders →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
