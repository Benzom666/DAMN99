import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Check if any super admin exists
    const { data: existingSuperAdmin, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error checking for super admin:', error)
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ exists: !!existingSuperAdmin })
  } catch (error) {
    console.error('Error in check route:', error)
    return NextResponse.json({ exists: false }, { status: 500 })
  }
}
