import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { AdminsTable } from './admins-table'

export default async function SuperAdminAdminsPage() {
  await requireSuperAdmin()
  
  const supabase = createServiceRoleClient()

  // First try without here_api_key to ensure page loads
  const { data: admins, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, created_at, is_suspended, suspended_at, suspension_reason')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admins:', error)
  }

  // Add here_api_key as null for all admins (will be populated after migration)
  const adminsWithApiKey = (admins || []).map(admin => ({ ...admin, here_api_key: null }))

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Management</h1>
        <p className="text-muted-foreground">
          View, edit, suspend, and manage all administrator accounts
        </p>
      </div>

      <AdminsTable admins={adminsWithApiKey} />
    </div>
  )
}
