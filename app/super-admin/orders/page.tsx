import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createServerClient } from '@/lib/supabase/server'
import { OrdersTable } from './orders-table'

export default async function SuperAdminOrdersPage() {
  await requireSuperAdmin()
  
  const supabase = await createServerClient()

  // Get all orders with admin info
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      admin:profiles!admin_id(email, display_name),
      route:routes(id, name, status)
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error fetching orders:', error)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Order Management</h1>
        <p className="text-muted-foreground">
          View and manage all orders across all admins (showing latest 500)
        </p>
      </div>

      <OrdersTable orders={orders || []} />
    </div>
  )
}
