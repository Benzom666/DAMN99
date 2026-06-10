import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  ArrowRight,
  Truck,
  Zap,
  Settings,
  DollarSign,
  Map,
  ChevronRight,
  Package,
  Route as RouteIcon,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandLockup, BrandMark } from "@/components/brand-mark"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <LandingPage />

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single()

  if (error) {
    const errorCode = (error as any).code || (error as any).error_code
    const errorMessage =
      (error as any).message || (error as any).error_description || ""
    if (errorCode === "42P17" || errorMessage.includes("infinite recursion"))
      redirect("/setup?error=rls_recursion")
    if (
      errorCode === "PGRST205" ||
      errorMessage.includes("Could not find the table")
    )
      redirect("/setup")
    redirect("/auth/login")
  }

  if (!profile) redirect("/auth/login")
  if (profile.is_active === false) {
    await supabase.auth.signOut()
    redirect("/auth/login?error=account_inactive")
  }

  redirect(
    profile.role === "super_admin"
      ? "/super-admin"
      : profile.role === "admin"
        ? "/admin"
        : "/driver",
  )
}

/* =====================================================================
   LANDING — minimalist SaaS aesthetic
   Soft purple hero · white sections · generous whitespace · rounded pills
   ===================================================================== */
function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Hero />
      <FeatureRow />
      <PlatformSection />
      <ProductSuite />
      <Stats />
      <CTA />
      <Footer />
    </div>
  )
}

/* --------------------------------------------------------- HERO */
function Hero() {
  return (
    <section className="relative">
      <div className="hero-gradient hero-clip pb-32 pt-0">
        {/* Animated aurora backdrop — CSS only, respects reduced-motion */}
        <div className="aurora" aria-hidden="true" />
        <div className="aurora-grid" aria-hidden="true" />
        {/* Top nav */}
        <nav className="relative z-10">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
            <Link href="/">
              <BrandLockup
                tone="white"
                textSize="md"
                wordmarkClass="text-white"
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {[
                { label: "Platform", href: "#platform" },
                { label: "Route Optimization", href: "#suite" },
                { label: "Contact", href: "#footer" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-white/85 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/40 text-white hover:bg-white/10 hover:border-white/60 hover:text-white bg-transparent"
                >
                  Track
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 pt-12 pb-12">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
            {/* Left: copy */}
            <div className="animate-rise stagger-1 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm mb-6">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                Live dispatch · routes recalculating now
              </div>
              <h1 className="text-[2.25rem] sm:text-[2.75rem] lg:text-[3.25rem] leading-[1.1] font-bold tracking-tight text-white">
                Modern logistics operations for the modern regional carrier
              </h1>
              <p className="mt-6 text-base lg:text-lg leading-relaxed text-white/85 max-w-md">
                Regional carriers are stuck with enterprise platforms built for
                giants or patchwork tools that break as you grow. Delivery OS
                scales from your first delivery to millions daily.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/auth/sign-up">
                  <Button
                    size="lg"
                    className="bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                  >
                    Get a Demo
                  </Button>
                </Link>
                <Link
                  href="#platform"
                  className="inline-flex items-center gap-1 text-sm font-medium text-white hover:gap-2 transition-all"
                >
                  Learn More
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Right: dashboard mockup */}
            <div className="relative animate-rise stagger-3">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* Decorative dashboard mockup card */
function DashboardMockup() {
  return (
    <div className="relative">
      {/* Map area */}
      <div className="mockup-card p-1 lg:p-1.5">
        <div className="rounded-[16px] overflow-hidden bg-[#F4F6FA] aspect-[4/3] relative">
          {/* Faux map */}
          <svg
            viewBox="0 0 600 450"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="600" height="450" fill="url(#mapgrid)" />
            {/* "Roads" */}
            <path d="M 0 220 Q 200 200, 350 240 T 600 200" stroke="#CBD5E1" strokeWidth="3" fill="none" />
            <path d="M 100 0 L 280 220 L 200 450" stroke="#CBD5E1" strokeWidth="3" fill="none" />
            <path d="M 600 100 L 380 280 L 480 450" stroke="#CBD5E1" strokeWidth="3" fill="none" />
            {/* Center pulse */}
            <circle cx="280" cy="240" r="20" fill="#5B62F7" opacity="0.18">
              <animate attributeName="r" from="20" to="40" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="280" cy="240" r="9" fill="#5B62F7" />
            <circle cx="280" cy="240" r="4" fill="white" />
            {/* Stop pins */}
            {[
              [120, 130],
              [180, 320],
              [380, 160],
              [460, 320],
              [320, 380],
            ].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="11" fill="#5B62F7" />
                <circle cx={x} cy={y} r="4" fill="white" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Floating panel — route detail */}
      <div className="absolute -right-2 sm:-right-6 lg:-right-10 -top-3 lg:top-6 w-[260px] sm:w-[300px] mockup-card p-4 hidden sm:block animate-float">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <div className="size-7 rounded-md bg-primary-soft grid place-items-center text-primary">
            <Truck className="size-3.5" strokeWidth={2} />
          </div>
          <div className="text-sm font-semibold tracking-tight">YYZ1</div>
          <span className="text-xs text-muted-foreground">·</span>
          <div className="text-sm text-primary">William Jones</div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-3 text-[11px]">
          <div>
            <div className="text-muted-foreground">Time</div>
            <div className="font-medium">2h 45m</div>
          </div>
          <div>
            <div className="text-muted-foreground">Distance</div>
            <div className="font-medium">43 km</div>
          </div>
          <div>
            <div className="text-muted-foreground">Stops</div>
            <div className="font-medium">12</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border space-y-2.5">
          {[
            { name: "Kupe Cosmetics — Harborfront", t: "4:23 pm", pkg: 3 },
            { name: "Lauren's Outfitters", t: "4:48 pm", pkg: 19 },
            { name: "Nixon — Downtown", t: "5:14 pm", pkg: 4 },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium leading-tight truncate">{s.name}</div>
                <div className="text-[10.5px] text-muted-foreground mt-0.5">
                  {s.t} · {s.pkg} packages
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------- TRUST STRIP */
function FeatureRow() {
  const chips = [
    "Specialty local carriers",
    "High-volume regional fleets",
    "Same-day couriers",
    "Pharmacy & medical delivery",
    "Grocery & meal-kit logistics",
    "3PL & cross-dock operators",
    "E-commerce fulfilment",
    "Furniture & big-and-bulky",
  ]
  // Duplicate the list so the marquee can loop seamlessly.
  const loop = [...chips, ...chips]
  return (
    <section className="bg-background border-b border-border py-10">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-6">
          Built for every last-mile operation
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <div className="marquee gap-3">
            {loop.map((c, i) => (
              <span
                key={i}
                className="whitespace-nowrap rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground/70"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- PLATFORM SECTION */
function PlatformSection() {
  return (
    <section id="platform" className="py-24 lg:py-32 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[5fr_7fr] gap-10 lg:gap-16 items-start">
          <div>
            <div className="section-eyebrow">Designed for operators</div>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15] text-foreground">
              A technology-first approach to last-mile delivery
            </h2>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground max-w-md">
              <p>
                We bring together everything that's required to grow, manage,
                and optimize your delivery business.
              </p>
              <p>
                Delivery OS powers operations for specialty local carriers,
                high-volume regional carriers, and everything in between.
              </p>
            </div>
          </div>

          {/* Right: scattered product mockups */}
          <div className="relative grid grid-cols-3 gap-3 lg:gap-4">
            <div className="mockup-card p-3 col-span-1 row-span-2">
              <div className="text-[10px] font-medium text-muted-foreground mb-2">Today, Jun 13</div>
              <div className="aspect-[3/4] rounded-md bg-secondary mb-2 flex items-center justify-center">
                <Map className="size-8 text-primary/40" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="truncate">23 45th Ave, Brooklyn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="truncate">81 8th St, Brooklyn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded-full border border-border" />
                  <span className="truncate">21 11th Ave, Brooklyn</span>
                </div>
              </div>
            </div>

            <div className="mockup-card p-3 col-span-2">
              <div className="text-xs font-semibold mb-2">Shipping method</div>
              <div className="rounded-md border border-border p-2 mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-medium">Local Delivery</div>
                  <div className="text-[9px] text-muted-foreground">
                    Next-day, 5–9pm window
                  </div>
                </div>
                <div className="text-[10px] font-medium text-success">Free</div>
              </div>
              <Button size="sm" className="w-full text-[11px] h-8">
                Continue to payment
              </Button>
            </div>

            <div className="mockup-card p-3 col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold">Parameters</div>
                <Button size="sm" variant="primary" className="h-6 px-2.5 text-[10px]">
                  Optimize
                </Button>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service window</span>
                  <span className="font-medium">11:00 — 20:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max stops/route</span>
                  <span className="font-medium">50</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Auto-assign</span>
                  <span className="font-medium text-primary">Enabled</span>
                </div>
                <div className="pt-1.5 border-t border-border">
                  <div className="text-[9px] text-muted-foreground mb-1">Optimization depth</div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full w-[68%] bg-primary rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- PRODUCT SUITE */
function ProductSuite() {
  const items = [
    {
      icon: Truck,
      iconClass: "feature-icon",
      title: "Routing",
      desc: "Cluster, sequence, and assign 1,000-stop routes in seconds.",
    },
    {
      icon: Zap,
      iconClass: "feature-icon feature-icon--violet",
      title: "Dispatch",
      desc: "Live driver positions, ETAs that recalc on the fly.",
    },
    {
      icon: Settings,
      iconClass: "feature-icon feature-icon--rose",
      title: "Operations",
      desc: "POD capture, customer notifications, audit trails.",
    },
    {
      icon: DollarSign,
      iconClass: "feature-icon feature-icon--emerald",
      title: "Cost control",
      desc: "Per-tenant budgets and API spend guardrails.",
    },
  ]

  return (
    <section id="suite" className="py-24 lg:py-32 bg-secondary/40">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="section-eyebrow">Why Delivery OS</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15] text-foreground">
            A fully integrated suite of last-mile software products
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it) => (
            <div key={it.title} className="animate-rise">
              <div className={it.iconClass}>
                <it.icon className="size-6" strokeWidth={2} />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{it.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {it.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- STATS */
function Stats() {
  const stats = [
    { v: "10,000+", l: "Stops dispatched daily" },
    { v: "41%", l: "Average fuel reduction" },
    { v: "94 sec", l: "1,000-stop optimize time" },
    { v: "98.2%", l: "On-time delivery rate" },
  ]
  return (
    <section className="py-24 lg:py-28 bg-background border-t border-border">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((s) => (
            <div key={s.v} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                {s.v}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- CTA */
function CTA() {
  return (
    <section className="relative bg-secondary/40">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="mockup-card p-10 lg:p-14 text-center max-w-3xl mx-auto bg-gradient-to-br from-primary to-[oklch(0.78_0.13_268)] border-0">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white max-w-xl mx-auto leading-[1.2]">
            Ready to scale your delivery operation?
          </h2>
          <p className="mt-5 text-base text-white/85 max-w-lg mx-auto leading-relaxed">
            Spin up a tenant in 90 seconds. No sales call. No contract. No
            credit card.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 shadow-sm"
              >
                Get a Demo
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:border-white/60 hover:text-white bg-transparent"
              >
                Sign In
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- FOOTER */
function Footer() {
  return (
    <footer id="footer" className="bg-background border-t border-border">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-14">
        <div className="grid lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
          <div>
            <BrandLockup textSize="md" />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Modern logistics operations for the modern regional carrier.
            </p>
          </div>

          {[
            { h: "Product", items: ["Platform", "Routing", "Dispatch", "Operations"] },
            { h: "Operators", items: ["Sign in", "Sign up", "Driver app", "Status"] },
            { h: "Company", items: ["About", "Security", "Privacy", "Contact"] },
          ].map((col) => (
            <div key={col.h}>
              <div className="text-xs font-semibold text-foreground mb-3 tracking-tight">
                {col.h}
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.items.map((it) => (
                  <li key={it} className="hover:text-foreground transition-colors cursor-pointer">
                    {it}
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
