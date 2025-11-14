import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { RoutesTable } from './routes-table'

export default async function SuperAdminRoutesPage() {
  await requireSuperAdmin()
  
  const supabase = await createServiceRoleClient()

  const { data: routes, error } = await supabase
    .from('routes')
    .select(`
      *,
      driver:profiles!driver_id(email, display_name),
      admin:profiles!admin_id(email, display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching routes:', error)
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, route_id, status')
    .not('route_id', 'is', null)

  const { data: drivers } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .eq('role', 'driver')
    .order('display_name')

  const routesWithProgress = (routes || []).map((route) => {
    const routeOrders = orders?.filter((o) => o.route_id === route.id) || []
    const totalStops = routeOrders.length
    const completedStops = routeOrders.filter((o) => o.status === 'delivered' || o.status === 'failed').length
    
    return {
      ...route,
      total_stops: totalStops,
      completed_stops: completedStops
    }
  })

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Route Management</h1>
        <p className="text-muted-foreground">
          View, reassign, and manage all routes (showing latest 200)
        </p>
      </div>

      <RoutesTable routes={routesWithProgress || []} drivers={drivers || []} />
    </div>
  )
}
