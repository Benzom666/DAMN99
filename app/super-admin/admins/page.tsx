import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { AdminsTable } from './admins-table'

export default async function SuperAdminAdminsPage() {
  await requireSuperAdmin()
  
  const supabase = createServiceRoleClient()

  // Try to fetch with here_api_key, fall back without it if column doesn't exist
  let admins = null
  let error = null
  
  try {
    const result = await supabase
      .from('profiles')
      .select('id, email, display_name, role, created_at, is_suspended, suspended_at, suspension_reason, here_api_key')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })
    
    admins = result.data
    error = result.error
  } catch (e) {
    // If here_api_key column doesn't exist, fetch without it
    const result = await supabase
      .from('profiles')
      .select('id, email, display_name, role, created_at, is_suspended, suspended_at, suspension_reason')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })
    
    admins = result.data?.map(admin => ({ ...admin, here_api_key: null }))
    error = result.error
  }

  if (error) {
    console.error('Error fetching admins:', error)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Management</h1>
        <p className="text-muted-foreground">
          View, edit, suspend, and manage all administrator accounts
        </p>
      </div>

      <AdminsTable admins={admins || []} />
    </div>
  )
}
