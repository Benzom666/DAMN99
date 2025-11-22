import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Middleware] Missing Supabase environment variables. Skipping auth check.")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Get the current user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    try {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (request.nextUrl.pathname === "/setup-super-admin") {
        // Check if any super admin already exists
        const { data: existingSuperAdmin } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "super_admin")
          .limit(1)
          .single()

        // If a super admin exists and current user is not super admin, redirect to admin
        if (existingSuperAdmin && profile?.role !== "super_admin") {
          return NextResponse.redirect(new URL("/admin/orders", request.url))
        }
      }

      if (request.nextUrl.pathname.startsWith("/super-admin")) {
        if (profile?.role !== "super_admin") {
          return NextResponse.redirect(new URL("/admin/orders", request.url))
        }
      }
    } catch (error) {
      console.error("Middleware error:", error)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
