import { updateSession } from "@/lib/supabase/middleware"
import { createClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  // If env vars not set, just pass through
  if (!supabaseUrl || !supabaseServiceKey) {
    return await updateSession(request)
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  const response = await updateSession(request)
  
  const authCookie = response.cookies.get('sb-access-token')
  if (authCookie) {
    try {
      const payload = JSON.parse(atob(authCookie.value.split('.')[1]))
      const userId = payload.sub
      
      if (userId) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (request.nextUrl.pathname === '/setup-super-admin') {
          // Check if any super admin already exists
          const { data: existingSuperAdmin } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', 'super_admin')
            .limit(1)
            .single()

          // If a super admin exists and current user is not super admin, redirect to admin
          if (existingSuperAdmin && profile?.role !== 'super_admin') {
            return NextResponse.redirect(new URL('/admin/orders', request.url))
          }
        }

        if (request.nextUrl.pathname.startsWith('/super-admin')) {
          if (profile?.role !== 'super_admin') {
            return NextResponse.redirect(new URL('/admin/orders', request.url))
          }
        }
      }
    } catch (error) {
      console.error('Middleware error:', error)
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
