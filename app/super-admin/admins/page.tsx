import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { AdminsTable } from './admins-table'

export default async function SuperAdminAdminsPage() {
  try {
    await requireSuperAdmin()
    
    const supabase = createServiceRoleClient()

    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, role, created_at, is_suspended, suspended_at, suspension_reason, here_api_key')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admins:', error)
      return (
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Admin Management</h1>
            <p className="text-red-600">
              Error loading admins: {error.message}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              If you see "column does not exist", run the migration in Supabase SQL Editor.
            </p>
          </div>
        </div>
      )
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
  } catch (error: any) {
    console.error('Page error:', error)
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Admin Management</h1>
          <p className="text-red-600">
            Unexpected error: {error?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }
}
