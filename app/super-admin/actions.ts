'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireSuperAdmin } from '@/lib/auth/super-admin'

// Audit log helper
async function logAuditAction(action: string, targetTable: string, targetId: string, details: any) {
  const supabase = createServiceRoleClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Note: Requires super_admin_audit_log table from migration
    try {
      await supabase.from('super_admin_audit_log').insert({
        super_admin_id: user.id,
        action,
        target_table: targetTable,
        target_id: targetId,
        details
      })
    } catch {
      // Silently fail if audit log table doesn't exist yet
    }
  }
}

async function getSupabaseAdmin() {
  await requireSuperAdmin()
  return createServiceRoleClient()
}

// ============ ADMIN MANAGEMENT ============

export async function suspendAccount(userId: string, reason: string) {
  const supabase = await getSupabaseAdmin()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      is_suspended: true,
      suspended_at: new Date().toISOString(),
      suspended_by: user?.id,
      suspension_reason: reason
    })
    .eq('id', userId)
  
  if (error) throw error
  
  await logAuditAction('suspend_account', 'profiles', userId, { reason })
  revalidatePath('/super-admin/admins')
  revalidatePath('/super-admin/drivers')
  
  return { success: true }
}

export async function restoreAccount(userId: string) {
  const supabase = await getSupabaseAdmin()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      is_suspended: false,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null
    })
    .eq('id', userId)
  
  if (error) throw error
  
  await logAuditAction('restore_account', 'profiles', userId, {})
  revalidatePath('/super-admin/admins')
  revalidatePath('/super-admin/drivers')
  
  return { success: true }
}

export async function updateProfile(userId: string, data: {
  display_name?: string
  email?: string
  depot_lat?: number
  depot_lng?: number
  shift_start?: string
  shift_end?: string
  vehicle_capacity?: number
  driver_skills?: string[]
}) {
  const supabase = await getSupabaseAdmin()
  
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
  
  if (error) throw error
  
  await logAuditAction('update_profile', 'profiles', userId, data)
  revalidatePath('/super-admin/admins')
  revalidatePath('/super-admin/drivers')
  
  return { success: true }
}

export async function deleteProfile(userId: string) {
  const supabase = await getSupabaseAdmin()
  
  // Delete associated data first
  await supabase.from('driver_positions').delete().eq('driver_id', userId)
  await supabase.from('routes').update({ driver_id: null }).eq('driver_id', userId)
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  
  if (error) throw error
  
  await logAuditAction('delete_profile', 'profiles', userId, {})
  revalidatePath('/super-admin/admins')
  revalidatePath('/super-admin/drivers')
  
  return { success: true }
}

// ============ ORDER MANAGEMENT ============

export async function updateOrder(orderId: string, data: {
  customer_name?: string
  customer_email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  status?: string
  notes?: string
  delivery_address?: string
}) {
  const supabase = await getSupabaseAdmin()
  
  const { error } = await supabase
    .from('orders')
    .update(data)
    .eq('id', orderId)
  
  if (error) throw error
  
  await logAuditAction('update_order', 'orders', orderId, data)
  revalidatePath('/super-admin/orders')
  
  return { success: true }
}

export async function deleteOrder(orderId: string) {
  const supabase = await getSupabaseAdmin()
  
  // Delete associated data
  await supabase.from('route_stops').delete().eq('order_id', orderId)
  await supabase.from('pods').delete().eq('order_id', orderId)
  await supabase.from('stop_events').delete().eq('order_id', orderId)
  
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
  
  if (error) throw error
  
  await logAuditAction('delete_order', 'orders', orderId, {})
  revalidatePath('/super-admin/orders')
  
  return { success: true }
}

export async function bulkDeleteOrders(orderIds: string[]) {
  const supabase = await getSupabaseAdmin()
  
  for (const orderId of orderIds) {
    try {
      await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
    } catch {
      // Silently fail if order deletion fails
    }
  }
  
  await logAuditAction('bulk_delete_orders', 'orders', orderIds.join(','), {})
  revalidatePath('/super-admin/orders')
  
  return { success: true, count: orderIds.length }
}

// ============ ROUTE MANAGEMENT ============

export async function deleteRoute(routeId: string) {
  const supabase = await getSupabaseAdmin()
  
  // Reset orders to pending
  await supabase
    .from('orders')
    .update({ status: 'pending', route_id: null })
    .eq('route_id', routeId)
  
  // Delete associated data
  await supabase.from('route_stops').delete().eq('route_id', routeId)
  
  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('id', routeId)
  
  if (error) throw error
  
  await logAuditAction('delete_route', 'routes', routeId, {})
  revalidatePath('/super-admin/routes')
  
  return { success: true }
}

export async function reassignRoute(routeId: string, driverId: string | null) {
  const supabase = await getSupabaseAdmin()
  
  const { error } = await supabase
    .from('routes')
    .update({ driver_id: driverId })
    .eq('id', routeId)
  
  if (error) throw error
  
  await logAuditAction('reassign_route', 'routes', routeId, { driver_id: driverId })
  revalidatePath('/super-admin/routes')
  
  return { success: true }
}

// ============ SYSTEM MANAGEMENT ============

export async function getSystemStats() {
  const supabase = await getSupabaseAdmin()
  
  const [
    { count: totalAdmins },
    { count: totalDrivers },
    { count: totalRoutes },
    { count: totalOrders },
    { count: activeRoutes },
    { count: completedOrders }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'driver'),
    supabase.from('routes').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('routes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered')
  ])
  
  return {
    totalAdmins: totalAdmins || 0,
    totalDrivers: totalDrivers || 0,
    totalRoutes: totalRoutes || 0,
    totalOrders: totalOrders || 0,
    suspendedAccounts: 0, // Will be available after migration
    activeRoutes: activeRoutes || 0,
    completedOrders: completedOrders || 0
  }
}

export async function getHereCostAnalytics() {
  const supabase = await getSupabaseAdmin()
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [last24h, last7d, recent] = await Promise.all([
    (supabase as any)
      .from('here_api_usage')
      .select('service, request_count, unit_count, estimated_cost_cents, status, cache_hit')
      .gte('created_at', since24h)
      .order('created_at', { ascending: false })
      .limit(5000),
    (supabase as any)
      .from('here_api_usage')
      .select('service, request_count, unit_count, estimated_cost_cents, status, cache_hit')
      .gte('created_at', since7d)
      .order('created_at', { ascending: false })
      .limit(20000),
    (supabase as any)
      .from('here_api_usage')
      .select('created_at, service, operation, request_count, unit_count, estimated_cost_cents, status, cache_hit, error_message')
      .order('created_at', { ascending: false })
      .limit(25)
  ])

  const aggregate = (rows: any[] = []) => {
    const byService: Record<string, { requests: number; units: number; costCents: number; errors: number; blocked: number; cacheHits: number }> = {}
    let requests = 0
    let units = 0
    let costCents = 0
    let errors = 0
    let blocked = 0
    let cacheHits = 0

    for (const row of rows) {
      const service = row.service || 'unknown'
      byService[service] ||= { requests: 0, units: 0, costCents: 0, errors: 0, blocked: 0, cacheHits: 0 }
      const requestCount = Number(row.request_count || 0)
      const unitCount = Number(row.unit_count || 0)
      const cost = Number(row.estimated_cost_cents || 0)

      requests += requestCount
      units += unitCount
      costCents += cost
      if (row.status === 'error') errors++
      if (row.status === 'blocked') blocked++
      if (row.cache_hit) cacheHits++

      byService[service].requests += requestCount
      byService[service].units += unitCount
      byService[service].costCents += cost
      if (row.status === 'error') byService[service].errors++
      if (row.status === 'blocked') byService[service].blocked++
      if (row.cache_hit) byService[service].cacheHits++
    }

    return { requests, units, costCents, errors, blocked, cacheHits, byService }
  }

  return {
    last24h: aggregate(last24h.data || []),
    last7d: aggregate(last7d.data || []),
    recent: recent.data || [],
    unavailable: Boolean(last24h.error || last7d.error || recent.error),
    error: last24h.error?.message || last7d.error?.message || recent.error?.message || null
  }
}
