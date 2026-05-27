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
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  code: string
}

interface AppSidebarProps {
  role: "admin" | "super_admin"
  userName?: string
}

export function AppSidebar({ role, userName }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const adminNavItems: NavItem[] = [
    { title: "Console", href: "/admin", icon: LayoutDashboard, code: "C-01" },
    { title: "Orders", href: "/admin/orders", icon: Package, code: "C-02" },
    { title: "Routes", href: "/admin/routes", icon: Route, code: "C-03" },
    { title: "Drivers", href: "/admin/drivers", icon: Users, code: "C-04" },
    { title: "Dispatch", href: "/admin/dispatch", icon: Radio, code: "C-05" },
  ]

  const superAdminNavItems: NavItem[] = [
    { title: "Console", href: "/super-admin", icon: Activity, code: "S-01" },
    { title: "Admins", href: "/super-admin/admins", icon: Building2, code: "S-02" },
    { title: "Drivers", href: "/super-admin/drivers", icon: Truck, code: "S-03" },
    { title: "Orders", href: "/super-admin/orders", icon: Package, code: "S-04" },
    { title: "Routes", href: "/super-admin/routes", icon: Route, code: "S-05" },
    { title: "Audit", href: "/super-admin/audit-log", icon: FileText, code: "S-06" },
    { title: "Costs", href: "/super-admin/costs", icon: DollarSign, code: "S-07" },
    { title: "System", href: "/super-admin/system", icon: Database, code: "S-08" },
  ]

  const navItems = role === "super_admin" ? superAdminNavItems : adminNavItems
  const isSuper = role === "super_admin"

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      {/* Hazard stripe top accent (super-admin only) */}
      {isSuper && <div className="absolute top-0 left-0 right-0 h-1 hazard-stripe opacity-90" />}

      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-sidebar-border h-14 px-3 relative",
          isSuper && "mt-1",
        )}
      >
        {!collapsed && (
          <Link
            href={isSuper ? "/super-admin" : "/admin"}
            className="flex items-center gap-2.5 group"
          >
            <div
              className={cn(
                "size-7 grid place-items-center font-mono text-[11px] font-bold tracking-tight rounded-[2px]",
                isSuper
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-signal text-signal-foreground",
              )}
            >
              99
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-sidebar-foreground">
                {isSuper ? "DAMN99 · SU" : "DAMN99"}
              </span>
              <span
                className={cn(
                  "font-mono text-[8.5px] uppercase tracking-[0.2em]",
                  isSuper ? "text-destructive" : "text-sidebar-muted",
                )}
              >
                {isSuper ? "GOD MODE" : "DISPATCH"}
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div
            className={cn(
              "size-7 grid place-items-center font-mono text-[11px] font-bold rounded-[2px] mx-auto",
              isSuper
                ? "bg-destructive text-destructive-foreground"
                : "bg-signal text-signal-foreground",
            )}
          >
            99
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border",
            collapsed && "absolute -right-3 top-3 bg-sidebar border-sidebar-border z-10 size-6",
          )}
        >
          <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Status strip */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-sidebar-border flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-sidebar-muted">
            <span className={isSuper ? "pulse-dot pulse-dot--destructive" : "pulse-dot"} />
            {isSuper ? "Sovereign" : "Online"}
          </span>
          <span className="font-mono text-[10px] tracking-tight text-sidebar-muted tabular-nums">
            {now
              ? now.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })
              : "--:--:--"}
          </span>
        </div>
      )}

      {/* Section eyebrow */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-2">
          <span className="eyebrow text-sidebar-muted">
            § {isSuper ? "Super sectors" : "Sectors"}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto", collapsed ? "p-2" : "px-3 pb-3")}>
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
                isActive ? "sidebar-item-active" : "sidebar-item-inactive",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="size-4 flex-shrink-0" strokeWidth={1.6} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  <span
                    className={cn(
                      "font-mono text-[9px] tracking-[0.1em]",
                      isActive ? "text-signal-foreground/60" : "text-sidebar-muted/60",
                    )}
                  >
                    {item.code}
                  </span>
                </>
              )}
            </Link>
          )
        })}

        {/* Super admin: link to admin */}
        {isSuper && (
          <>
            <div className="my-3 border-t border-sidebar-border" />
            {!collapsed && (
              <div className="px-3 pb-2">
                <span className="eyebrow text-sidebar-muted">§ Cross-link</span>
              </div>
            )}
            <Link
              href="/admin"
              className={cn(
                "sidebar-item sidebar-item-inactive",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? "Open admin" : undefined}
            >
              <ArrowUpRight className="size-4 flex-shrink-0" strokeWidth={1.6} />
              {!collapsed && <span className="flex-1">Admin shell</span>}
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && userName && (
          <div className="px-2 py-2 border border-sidebar-border bg-sidebar-accent/40 rounded-sm">
            <div className="eyebrow text-sidebar-muted mb-1">
              {isSuper ? "Sovereign" : "Operator"}
            </div>
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userName}
            </p>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-sidebar-muted mt-0.5">
              {role.replace("_", " ")}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border",
            collapsed && "justify-center",
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="size-4 flex-shrink-0" />
          {!collapsed && <span className="ml-2">Sign out</span>}
        </Button>
      </div>
    </aside>
  )
}
