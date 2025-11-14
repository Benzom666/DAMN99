import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { DriversTable } from './drivers-table'

export default async function SuperAdminDriversPage() {
  await requireSuperAdmin()
  
  const supabase = createServiceRoleClient()

  const { data: drivers, error } = await supabase
    .from('profiles')
    .select(`
      *,
      admin:profiles!admin_id(email, display_name)
    `)
    .eq('role', 'driver')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching drivers:', error)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Driver Management</h1>
        <p className="text-muted-foreground">
          View, edit, suspend, and manage all driver accounts
        </p>
      </div>

      <DriversTable drivers={drivers || []} />
    </div>
  )
}
