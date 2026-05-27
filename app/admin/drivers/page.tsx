import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DriversTable } from "./drivers-table"
import { PageHeader } from "@/components/page-header"

export default async function DriversPage() {
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
    .single()

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
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        tag="OPS-04"
        eyebrow="Sector A · Field"
        title="Field"
        serifEmphasis="operators"
        description="Your drivers — the people who turn routes into deliveries."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-6">
        <DriversTable drivers={drivers || []} />
      </main>
    </div>
  )
}
