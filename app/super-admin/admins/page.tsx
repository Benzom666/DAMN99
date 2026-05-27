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
        <div className="flex flex-col min-h-screen">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
            <div className="px-8 py-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
                <p className="text-destructive mt-1">
                  Error loading admins: {error.message}
                </p>
              </div>
            </div>
          </header>
          <div className="flex-1 px-8 py-6">
            <p className="text-sm text-muted-foreground">
              If you see "column does not exist", run the migration in Supabase SQL Editor.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-8 py-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
              <p className="text-muted-foreground mt-1">
                View, edit, suspend, and manage all administrator accounts
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-8 py-6">
          <AdminsTable admins={admins || []} />
        </main>
      </div>
    )
  } catch (error: any) {
    console.error('Page error:', error)
    return (
      <div className="flex flex-col min-h-screen">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-8 py-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
              <p className="text-destructive mt-1">
                Unexpected error: {error?.message || 'Unknown error'}
              </p>
            </div>
          </div>
        </header>
      </div>
    )
  }
}
