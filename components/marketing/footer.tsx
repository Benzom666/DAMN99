import Link from "next/link"
import { BrandLockup } from "@/components/brand-mark"

const COLUMNS = [
  {
    h: "Product",
    items: [
      { label: "Platform", href: "/#platform" },
      { label: "Route Optimization", href: "/route-optimization" },
      { label: "Dispatch", href: "/#showcase" },
      { label: "Proof of delivery", href: "/#showcase" },
    ],
  },
  {
    h: "Developers",
    items: [
      { label: "Optimization API", href: "/route-optimization#api" },
      { label: "Documentation", href: "/route-optimization#docs" },
      { label: "Pricing", href: "/route-optimization#pricing" },
      { label: "Request access", href: "/route-optimization#contact" },
    ],
  },
  {
    h: "Operators",
    items: [
      { label: "Sign in", href: "/auth/login" },
      { label: "Sign up", href: "/auth/sign-up" },
      { label: "Driver app", href: "/auth/login" },
      { label: "Status", href: "/#footer" },
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer id="footer" className="bg-background border-t border-border">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-14">
        <div className="grid lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
          <div>
            <BrandLockup textSize="md" />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Modern logistics operations for the modern regional carrier — plus
              a route optimization engine you can buy as an API.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.h}>
              <div className="text-xs font-semibold text-foreground mb-3 tracking-tight">
                {col.h}
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.items.map((it) => (
                  <li key={it.label}>
                    <Link
                      href={it.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 Delivery OS · all rights reserved</span>
          <span>Built on Next.js · Supabase · HERE Maps</span>
        </div>
      </div>
    </footer>
  )
}
