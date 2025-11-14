import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const supabaseAdmin = createServiceRoleClient()
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'super_admin'
}

export async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/super-admin')
  }

  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    redirect('/admin/orders')
  }
}

export async function logSuperAdminAction(
  action: string,
  targetTable?: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  const supabase = createServiceRoleClient()
  
  await supabase.rpc('log_super_admin_action', {
    p_action: action,
    p_target_table: targetTable,
    p_target_id: targetId,
    p_details: details
  })
}
