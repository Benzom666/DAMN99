import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Activity, TrendingUp } from 'lucide-react'

export default async function SystemHealthPage() {
  await requireSuperAdmin()
  
  const supabase = await createServerClient()

  // Get database statistics
  const [
    { count: totalProfiles },
    { count: totalOrders },
    { count: totalRoutes },
    { count: totalPods }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('routes').select('*', { count: 'exact', head: true }),
    supabase.from('pods').select('*', { count: 'exact', head: true })
  ])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Health</h1>
        <p className="text-muted-foreground">
          Database statistics and system performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProfiles || 0}</div>
            <p className="text-xs text-muted-foreground">Database records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">All-time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoutes || 0}</div>
            <p className="text-xs text-muted-foreground">All-time routes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PODs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPods || 0}</div>
            <p className="text-xs text-muted-foreground">Proof of deliveries</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
