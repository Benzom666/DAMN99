import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DriversTable } from "./drivers-table"

export default async function DriversPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/driver")
  }

  const { data: drivers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "driver")
    .order("is_active", { ascending: false })
    .order("display_name", { ascending: true })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your delivery team
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-6">
        <DriversTable drivers={drivers || []} />
      </main>
    </div>
  )
}
