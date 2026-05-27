import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface SuperAdminProfile {
  id: string
  email: string | null
  display_name: string | null
  role: 'super_admin'
}

export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const supabaseAdmin = createServiceRoleClient()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'super_admin'
}

/**
 * Redirects unauthenticated users to login and non-super-admins to /admin/orders.
 * Returns the profile when the user IS a super admin so callers (e.g. the
 * super-admin layout) can render the user's display name without an extra fetch.
 *
 * Backwards-compatible: existing callers using `await requireSuperAdmin()` and
 * ignoring the return value continue to work.
 */
export async function requireSuperAdmin(): Promise<SuperAdminProfile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/super-admin')
  }

  const supabaseAdmin = createServiceRoleClient()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, display_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin/orders')
  }

  return profile as SuperAdminProfile
}

export async function logSuperAdminAction(
  action: string,
  targetTable?: string,
  targetId?: string,
  details?: Record<string, unknown>,
) {
  const supabase = createServiceRoleClient()

  await supabase.rpc('log_super_admin_action', {
    p_action: action,
    p_target_table: targetTable,
    p_target_id: targetId,
    p_details: details,
  })
}
