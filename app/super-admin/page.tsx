import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { getHereCostAnalytics, getSystemStats } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Truck, Package, Ban, Activity, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function SuperAdminDashboard() {
  await requireSuperAdmin()
  
  const [stats, hereCosts] = await Promise.all([getSystemStats(), getHereCostAnalytics()])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Full system access and control
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-8 py-6 space-y-8">
        {/* Statistics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Admins</CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalAdmins}</div>
              <p className="text-xs text-muted-foreground mt-1">System administrators</p>
            </CardContent>
          </Card>
          
          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Drivers</CardTitle>
              <Truck className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalDrivers}</div>
              <p className="text-xs text-muted-foreground mt-1">Delivery drivers</p>
            </CardContent>
          </Card>
          
          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Routes</CardTitle>
              <Activity className="h-5 w-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalRoutes}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.activeRoutes} active
              </p>
            </CardContent>
          </Card>
          
          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <Package className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {stats.completedOrders} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
              <Ban className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.suspendedAccounts}</div>
              <p className="text-xs text-muted-foreground mt-1">Suspended accounts</p>
            </CardContent>
          </Card>

          <Card className="border-success/50 bg-success/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">HERE Cost 24h</CardTitle>
              <DollarSign className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                ${(hereCosts.last24h.costCents / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {hereCosts.last24h.requests} paid requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/super-admin/admins" className="group">
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Manage Admins</CardTitle>
                      <p className="text-xs text-muted-foreground">View and control</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/super-admin/costs" className="group">
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground transition-colors">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Cost Analytics</CardTitle>
                      <p className="text-xs text-muted-foreground">Track expenses</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/super-admin/audit-log" className="group">
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-info/10 text-info group-hover:bg-info group-hover:text-info-foreground transition-colors">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Audit Log</CardTitle>
                      <p className="text-xs text-muted-foreground">System activity</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/super-admin/system" className="group">
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground transition-colors">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">System</CardTitle>
                      <p className="text-xs text-muted-foreground">Configuration</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
