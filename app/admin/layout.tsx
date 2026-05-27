import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    redirect("/auth/complete-profile")
  }

  if (profile.role !== "admin" && profile.role !== "super_admin") {
    redirect("/driver")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role={profile.role as "admin" | "super_admin"}
        userName={profile.display_name || profile.email || undefined}
      />
      <main className="flex-1 ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
