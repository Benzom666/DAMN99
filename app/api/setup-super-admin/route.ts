import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createServiceRoleClient()
    
    // Get email from request body
    const { email } = await request.json()
    
    console.log('[v0] Setup super admin - email from request:', email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if email matches SUPER_ADMIN_EMAIL
    const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL
    
    console.log('[v0] Setup super admin - comparing:', email, 'vs', superAdminEmail)
    
    if (!superAdminEmail) {
      return NextResponse.json({ error: "SUPER_ADMIN_EMAIL not configured" }, { status: 500 })
    }

    if (email !== superAdminEmail) {
      return NextResponse.json({ error: "Unauthorized - Not the designated super admin email" }, { status: 403 })
    }

    // Find user by email in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    console.log('[v0] Setup super admin - found users:', authUsers?.users?.length)
    
    if (authError) {
      console.error("[v0] Error fetching users:", authError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    const user = authUsers.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({ error: "User account not found. Please sign up first." }, { status: 404 })
    }

    console.log('[v0] Setup super admin - found user:', user.id, user.email)

    // Check if already super admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    console.log('[v0] Setup super admin - current profile:', profile, 'error:', profileError)

    if (profile?.role === "super_admin") {
      return NextResponse.json({ 
        message: "Already a super admin! Please log in to access the dashboard.", 
        needsLogin: true 
      })
    }

    // Promote to super admin
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "super_admin" })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Error promoting to super admin:", updateError)
      return NextResponse.json({ error: `Failed to promote to super admin: ${updateError.message}` }, { status: 500 })
    }

    console.log('[v0] Setup super admin - successfully promoted!')

    return NextResponse.json({
      message: "Successfully promoted to super admin! Please log in to access the dashboard.",
      needsLogin: true,
    })
  } catch (error) {
    console.error("[v0] Setup super admin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
