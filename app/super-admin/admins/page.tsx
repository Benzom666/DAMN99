import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { AdminsTable } from "./admins-table"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertOctagon } from "lucide-react"

export default async function SuperAdminAdminsPage() {
  try {
    await requireSuperAdmin()

    const supabase = createServiceRoleClient()

    const { data: admins, error } = await supabase
      .from("profiles")
      .select(
        "id, email, display_name, role, created_at, is_suspended, suspended_at, suspension_reason, here_api_key",
      )
      .eq("role", "admin")
      .order("created_at", { ascending: false })

    if (error) {
      return (
        <div className="flex flex-col min-h-screen relative">
          <PageHeader
            eyebrow="Tenants"
            title="Admin management"
            description="View, edit, suspend, and manage tenant operators."
          />
          <div className="flex-1 px-6 lg:px-10 py-8">
            <Alert variant="destructive">
              <AlertOctagon className="size-4" />
              <AlertTitle>Failed to load admins</AlertTitle>
              <AlertDescription>
                {error.message}
                <br />
                <span className="text-xs opacity-80">
                  If you see "column does not exist", run the migration in
                  Supabase SQL Editor.
                </span>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col min-h-screen relative">
        <PageHeader
          eyebrow="Tenants"
          title="Admin management"
          description="View, edit, suspend, and manage tenant operators."
        />

        <main className="flex-1 px-6 lg:px-10 py-8 space-y-6">
          <AdminsTable admins={admins || []} />
        </main>
      </div>
    )
  } catch (error: any) {
    return (
      <div className="flex flex-col min-h-screen relative">
        <PageHeader
          eyebrow="Tenants"
          title="Admin management"
          description="Unexpected error."
        />
        <div className="flex-1 px-6 lg:px-10 py-8">
          <Alert variant="destructive">
            <AlertOctagon className="size-4" />
            <AlertTitle>Unexpected error</AlertTitle>
            <AlertDescription>
              {error?.message || "Unknown error"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }
}
