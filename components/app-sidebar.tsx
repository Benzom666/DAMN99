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
  Building2,
  Truck,
  FileText,
  DollarSign,
  Database,
  Activity,
  ChevronLeft,
  LogOut,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandLockup, BrandMark } from "@/components/brand-mark"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
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
    { title: "Audit log", href: "/super-admin/audit-log", icon: FileText },
    { title: "Costs", href: "/super-admin/costs", icon: DollarSign },
    { title: "System", href: "/super-admin/system", icon: Database },
  ]

  const navItems = role === "super_admin" ? superAdminNavItems : adminNavItems
  const isSuper = role === "super_admin"

  // Initials for avatar
  const initials = (userName || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?"

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border relative">
        {!collapsed ? (
          <Link href={isSuper ? "/super-admin" : "/admin"}>
            <BrandLockup textSize="sm" />
          </Link>
        ) : (
          <BrandMark size={28} className="mx-auto" />
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
            collapsed &&
              "absolute -right-3 top-4 z-10 size-6 bg-white border border-sidebar-border rounded-full shadow-sm",
          )}
        >
          <ChevronLeft
            className={cn("size-4 transition-transform", collapsed && "rotate-180")}
          />
        </Button>
      </div>

      {/* Super-admin role chip */}
      {!collapsed && isSuper && (
        <div className="px-4 pt-3">
          <div className="text-[11px] font-medium text-muted-foreground bg-secondary rounded-md px-2.5 py-1 inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-destructive" />
            Super admin · god mode
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto",
          collapsed ? "p-2" : "px-3 py-4",
        )}
      >
        {!collapsed && (
          <div className="px-3 pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Workspace
          </div>
        )}
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" &&
              item.href !== "/super-admin" &&
              pathname.startsWith(item.href + "/"))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-item",
                isActive && "sidebar-item-active",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="size-[18px] flex-shrink-0" strokeWidth={1.8} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}

        {/* Super admin: link to admin */}
        {isSuper && (
          <>
            <div className="my-3 border-t border-sidebar-border" />
            <Link
              href="/admin"
              className={cn(
                "sidebar-item",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? "Open admin" : undefined}
            >
              <ArrowUpRight className="size-[18px] flex-shrink-0" strokeWidth={1.8} />
              {!collapsed && <span>Admin shell</span>}
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && userName && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground truncate">
                {userName}
              </div>
              <div className="text-[11px] text-muted-foreground capitalize">
                {role.replace("_", " ")}
              </div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="size-[18px] flex-shrink-0" strokeWidth={1.8} />
          {!collapsed && <span className="ml-2">Sign out</span>}
        </Button>
      </div>
    </aside>
  )
}
