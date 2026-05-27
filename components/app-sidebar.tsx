"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Package, 
  Route, 
  Users, 
  Radio,
  Shield,
  Building2,
  Truck,
  FileText,
  DollarSign,
  Database,
  Activity,
  ChevronLeft,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface AppSidebarProps {
  role: "admin" | "super_admin"
  userName?: string
}

export function AppSidebar({ role, userName }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const adminNavItems: NavItem[] = [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Orders", href: "/admin/orders", icon: Package },
    { title: "Routes", href: "/admin/routes", icon: Route },
    { title: "Drivers", href: "/admin/drivers", icon: Users },
    { title: "Dispatch", href: "/admin/dispatch", icon: Radio },
  ]

  const superAdminNavItems: NavItem[] = [
    { title: "Dashboard", href: "/super-admin", icon: Activity },
    { title: "Admins", href: "/super-admin/admins", icon: Building2 },
    { title: "Drivers", href: "/super-admin/drivers", icon: Truck },
    { title: "Orders", href: "/super-admin/orders", icon: Package },
    { title: "Routes", href: "/super-admin/routes", icon: Route },
    { title: "Audit Log", href: "/super-admin/audit-log", icon: FileText },
    { title: "Costs", href: "/super-admin/costs", icon: DollarSign },
    { title: "System", href: "/super-admin/system", icon: Database },
  ]

  const navItems = role === "super_admin" ? superAdminNavItems : adminNavItems

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link href={role === "super_admin" ? "/super-admin" : "/admin"} className="flex items-center gap-2">
              {role === "super_admin" ? (
                <Shield className="h-6 w-6 text-sidebar-primary" />
              ) : (
                <Package className="h-6 w-6 text-sidebar-primary" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-sidebar-foreground">
                  {role === "super_admin" ? "Super Admin" : "DAMN99"}
                </span>
                {role === "super_admin" && (
                  <span className="text-xs text-sidebar-muted">God Mode</span>
                )}
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "sidebar-item",
                  isActive ? "sidebar-item-active" : "sidebar-item-inactive"
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-medium text-sidebar-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Super Admin: Link to Admin */}
          {role === "super_admin" && (
            <>
              <div className="my-3 border-t border-sidebar-border" />
              <Link
                href="/admin"
                className="sidebar-item sidebar-item-inactive"
                title={collapsed ? "Exit to Admin" : undefined}
              >
                <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>Exit to Admin</span>}
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          {!collapsed && userName && (
            <div className="mb-2 px-3 py-2">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
              <p className="text-xs text-sidebar-muted capitalize">{role.replace("_", " ")}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              "w-full justify-start text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
