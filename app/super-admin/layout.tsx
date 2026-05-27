import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { AppSidebar } from "@/components/app-sidebar"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireSuperAdmin()

  return (
    <div className="flex min-h-screen bg-background relative">
      {/* God-mode backdrop — red-tinted grid */}
      <div className="pointer-events-none fixed inset-0 bg-grid-paper-fine opacity-20 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_75%)]" />

      <AppSidebar
        role="super_admin"
        userName={profile.display_name || profile.email || undefined}
      />
      <main className="flex-1 ml-64 transition-all duration-300 relative">
        {children}
      </main>
    </div>
  )
}
