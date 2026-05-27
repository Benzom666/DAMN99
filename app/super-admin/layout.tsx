import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { AppSidebar } from "@/components/app-sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function signOut() {
  "use server"
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireSuperAdmin()

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar 
        role="super_admin" 
        userName={profile.display_name || profile.email || undefined}
        onSignOut={signOut}
      />
      <main className="flex-1 ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
