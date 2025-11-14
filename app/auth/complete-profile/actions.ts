'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function checkAndCreateProfile(userId: string, email: string, displayName: string, role: 'admin' | 'driver') {
  const supabase = createServiceRoleClient()

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile) {
    return { 
      success: true, 
      role: existingProfile.role,
      message: 'Profile already exists' 
    }
  }

  // Determine if super admin
  const isSuperAdmin = email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || email === 'benzom59@gmail.com'
  const finalRole = isSuperAdmin ? 'super_admin' : role

  // Create profile using service role to bypass RLS
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      display_name: displayName,
      role: finalRole,
      is_active: true
    })

  if (insertError) {
    console.error('[v0] Profile creation error:', insertError)
    return { 
      success: false, 
      error: insertError.message 
    }
  }

  revalidatePath('/', 'layout')

  return { 
    success: true, 
    role: finalRole,
    message: 'Profile created successfully' 
  }
}

export async function getProfileBypass(userId: string) {
  const supabase = createServiceRoleClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  return profile
}
