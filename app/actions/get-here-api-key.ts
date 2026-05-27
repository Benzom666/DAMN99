'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Get HERE API key for a specific admin.
 * Returns admin's own key if set, otherwise falls back to platform key.
 * 
 * @param adminId - The admin's user ID
 * @returns HERE API key to use
 */
export async function getHereApiKey(adminId?: string): Promise<string> {
  // If no admin ID provided, use platform key
  if (!adminId) {
    return process.env.HERE_API_KEY || ''
  }

  try {
    const supabase = createServiceRoleClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('here_api_key')
      .eq('id', adminId)
      .single()

    // If admin has their own key, use it
    if (profile?.here_api_key) {
      return profile.here_api_key
    }
  } catch (error) {
    console.error('[getHereApiKey] Error fetching admin key:', error)
  }

  // Fall back to platform key
  return process.env.HERE_API_KEY || ''
}

/**
 * Check if admin is using their own HERE API key
 */
export async function isUsingOwnKey(adminId?: string): Promise<boolean> {
  if (!adminId) return false

  try {
    const supabase = createServiceRoleClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('here_api_key')
      .eq('id', adminId)
      .single()

    return !!profile?.here_api_key
  } catch {
    return false
  }
}
