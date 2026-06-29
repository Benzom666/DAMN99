import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BrandLockup } from "@/components/brand-mark"

interface MarketingNavProps {
  /** Visual treatment — "light" for dark/gradient backgrounds, "dark" for white. */
  variant?: "light" | "dark"
  /** Currently active route, used to highlight the matching link. */
  active?: string
}

const LINKS = [
  { label: "Platform", href: "/#platform" },
  { label: "Route optimization", href: "/#optimize" },
  { label: "Pricing", href: "/#pricing" },
  { label: "For developers", href: "/#developers" },
]

/**
 * MarketingNav — shared top navigation for public marketing pages.
 * `light` renders white text for use over the indigo hero gradient;
 * `dark` renders foreground text for use over white surfaces.
 */
export function MarketingNav({ variant = "light", active }: MarketingNavProps) {
  const isLight = variant === "light"

  return (
    <nav className="relative z-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link href="/" aria-label="Delivery OS home">
          <BrandLockup
            tone={isLight ? "white" : "primary"}
            textSize="md"
            wordmarkClass={isLight ? "text-white" : undefined}
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((item) => {
            const isActive = active && item.href.includes(active)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "text-sm font-medium transition-colors",
                  isLight
                    ? "text-white/85 hover:text-white"
                    : "text-foreground/70 hover:text-foreground",
                  isActive ? (isLight ? "text-white" : "text-primary") : "",
                ].join(" ")}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button
              variant="outline"
              size="sm"
              className={
                isLight
                  ? "border-white/40 text-white hover:bg-white/10 hover:border-white/60 hover:text-white bg-transparent"
                  : ""
              }
            >
              Sign in
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button
              size="sm"
              className={
                isLight
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : ""
              }
            >
              Get a demo
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
