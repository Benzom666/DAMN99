import { requireSuperAdmin } from '@/lib/auth/super-admin'
import Link from 'next/link'
import { Shield, Building2, Truck, Package, Activity, Database, FileText, DollarSign } from 'lucide-react'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/super-admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Super Admin</h1>
                <p className="text-xs text-muted-foreground">God Mode Enabled</p>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link 
                href="/super-admin" 
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <Activity className="h-4 w-4" />
                Dashboard
              </Link>
              <Link 
                href="/super-admin/admins" 
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <Building2 className="h-4 w-4" />
                Admins
              </Link>
              <Link 
                href="/super-admin/drivers" 
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <Truck className="h-4 w-4" />
                Drivers
              </Link>
              <Link 
                href="/super-admin/orders" 
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <Package className="h-4 w-4" />
                Orders
              </Link>
              <Link 
                href="/super-admin/routes" 
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <Activity className="h-4 w-4" />
                Routes
              </Link>
              <Link 
                href="/super-admin/audit-log" 
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Audit
              </Link>
              <Link
                href="/super-admin/costs"
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <DollarSign className="h-4 w-4" />
                Costs
              </Link>
              <Link
                href="/super-admin/system" 
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <Database className="h-4 w-4" />
                System
              </Link>
              <div className="h-4 w-px bg-border" />
              <Link 
                href="/admin/orders" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Exit to Admin →
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
