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
  CheckCircle2,
  Sparkles,
  Route as RouteIcon,
  Gauge,
  Code2,
  Star,
  Check,
  X,
  Clock,
  MapPin,
  PackageCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandLockup, BrandMark } from "@/components/brand-mark"
import { MarketingNav } from "@/components/marketing/nav"
import { MarketingFooter } from "@/components/marketing/footer"

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
   ===================================================================== */
function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Hero />
      <TrustStrip />
      <PlatformSection />
      <RouteOptimizationSpotlight />
      <ProductSuite />
      <AppShowcase />
      <Comparison />
      <Stats />
      <Testimonials />
      <Pricing />
      <CTA />
      <MarketingFooter />
    </div>
  )
}

/* --------------------------------------------------------- HERO */
function Hero() {
  return (
    <section className="relative">
      <div className="hero-gradient hero-clip pb-32 pt-0">
        <div className="aurora" aria-hidden="true" />
        <div className="aurora-grid" aria-hidden="true" />

        <MarketingNav variant="light" active="/#platform" />

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 pt-12 pb-12">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
            <div className="animate-rise stagger-1 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm mb-6">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                Live dispatch · routes recalculating now
              </div>
              <h1 className="text-[2.25rem] sm:text-[2.75rem] lg:text-[3.4rem] leading-[1.08] font-bold tracking-tight text-white">
                The delivery platform with an optimization engine you can{" "}
                <span className="text-white/95 underline decoration-white/30 underline-offset-[6px]">
                  buy as an API
                </span>
              </h1>
              <p className="mt-6 text-base lg:text-lg leading-relaxed text-white/85 max-w-md">
                Delivery OS runs your last-mile operation end to end — and the
                same engine that sequences 1,000-stop routes in seconds is
                available as a standalone service you can plug into anything.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/auth/sign-up">
                  <Button
                    size="lg"
                    className="bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                  >
                    Get a demo
                  </Button>
                </Link>
                <Link
                  href="/route-optimization"
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/40 px-4 h-11 text-sm font-medium text-white hover:bg-white/10 transition-all"
                >
                  <Sparkles className="size-4" />
                  Explore the optimization API
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/75">
                {[
                  "No contract to start",
                  "90-second tenant setup",
                  "Free up to 100 stops / mo",
                ].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-white/90" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

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
      <div className="mockup-card p-1 lg:p-1.5">
        <div className="rounded-[16px] overflow-hidden bg-[#F4F6FA] aspect-[4/3] relative">
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
            {/* Optimized route polyline through the stops */}
            <path
              d="M 280 240 L 120 130 L 380 160 L 460 320 L 320 380 L 180 320 Z"
              stroke="#5B62F7"
              strokeWidth="3"
              strokeDasharray="6 6"
              fill="none"
              opacity="0.5"
            />
            <circle cx="280" cy="240" r="20" fill="#5B62F7" opacity="0.18">
              <animate attributeName="r" from="20" to="40" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="280" cy="240" r="9" fill="#5B62F7" />
            <circle cx="280" cy="240" r="4" fill="white" />
            {[
              [120, 130],
              [180, 320],
              [380, 160],
              [460, 320],
              [320, 380],
            ].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="11" fill="#5B62F7" />
                <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

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
function TrustStrip() {
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
                We bring together everything required to grow, manage, and
                optimize your delivery business — import, optimize, dispatch,
                track, and prove delivery in one console.
              </p>
              <p>
                Delivery OS powers operations for specialty local carriers,
                high-volume regional carriers, and everything in between.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
              {[
                { v: "5 min", l: "Import to dispatched" },
                { v: "1,000+", l: "Stops per optimize" },
                { v: "Real-time", l: "Driver GPS + ETA" },
                { v: "Audit-ready", l: "POD photo + signature" },
              ].map((s) => (
                <div key={s.l} className="soft-card p-4">
                  <div className="text-xl font-bold tracking-tight text-foreground">
                    {s.v}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

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

/* --------------------------------------------------------- ROUTE OPTIMIZATION SPOTLIGHT */
function RouteOptimizationSpotlight() {
  return (
    <section id="optimization" className="relative overflow-hidden bg-foreground text-background">
      <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>
      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 mb-6">
              <Sparkles className="size-3.5" />
              The Delivery OS Optimization Engine
            </div>
            <h2 className="text-3xl lg:text-[2.6rem] font-bold tracking-tight leading-[1.12]">
              Kill the spaghetti routes. Cut the miles. Keep drivers happy.
            </h2>
            <p className="mt-5 text-base lg:text-lg text-background/70 leading-relaxed max-w-lg">
              Our solver clusters by geography, respects time windows, vehicle
              capacity and shift limits, and sequences thousands of stops into
              clean, drivable routes — in seconds. Use it inside Delivery OS, or
              call it directly from your own stack.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              {[
                { v: "41%", l: "avg fewer miles" },
                { v: "94 sec", l: "1,000-stop solve" },
                { v: "99.9%", l: "API uptime" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold tracking-tight">{s.v}</div>
                  <div className="text-xs text-background/60 mt-1">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/route-optimization">
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90">
                  See the optimization product
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/route-optimization#api">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
                >
                  <Code2 className="size-4" />
                  View the API
                </Button>
              </Link>
            </div>
          </div>

          {/* Before / after visual */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs font-medium text-background/60 mb-3 flex items-center gap-2">
                <X className="size-3.5 text-rose-300" /> Before
              </div>
              <svg viewBox="0 0 200 200" className="w-full aspect-square">
                {[
                  [30, 40, 160, 70],
                  [160, 70, 50, 150],
                  [50, 150, 140, 30],
                  [140, 30, 90, 170],
                  [90, 170, 30, 90],
                  [30, 90, 170, 130],
                ].map(([x1, y1, x2, y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fca5a5" strokeWidth="2" opacity="0.7" />
                ))}
                {[[30, 40], [160, 70], [50, 150], [140, 30], [90, 170], [170, 130]].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="6" fill="#fca5a5" />
                ))}
              </svg>
              <div className="text-center text-[11px] text-background/50 mt-1">68 km · 3h 50m</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs font-medium text-background/60 mb-3 flex items-center gap-2">
                <Check className="size-3.5 text-emerald-300" /> After
              </div>
              <svg viewBox="0 0 200 200" className="w-full aspect-square">
                <path
                  d="M 30 40 L 140 30 L 170 130 L 90 170 L 50 150 L 30 90 Z"
                  fill="none"
                  stroke="#6ee7b7"
                  strokeWidth="2.5"
                />
                {[[30, 40], [140, 30], [170, 130], [90, 170], [50, 150], [30, 90]].map(([x, y], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r="8" fill="#6ee7b7" />
                    <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#064e3b">
                      {i + 1}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="text-center text-[11px] text-emerald-300/90 mt-1">40 km · 2h 15m</div>
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
      icon: RouteIcon,
      iconClass: "feature-icon",
      title: "Routing",
      desc: "Cluster, sequence, and assign 1,000-stop routes in seconds.",
    },
    {
      icon: Zap,
      iconClass: "feature-icon feature-icon--violet",
      title: "Dispatch",
      desc: "Live driver positions and ETAs that recalc on the fly.",
    },
    {
      icon: Settings,
      iconClass: "feature-icon feature-icon--rose",
      title: "Operations",
      desc: "POD photo + signature capture, customer notifications, audit trails.",
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

/* --------------------------------------------------------- APP SHOWCASE (screenshots) */
function AppShowcase() {
  return (
    <section id="showcase" className="py-24 lg:py-32 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="section-eyebrow">Inside the product</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
            One console for dispatch. One app for drivers.
          </h2>
        </div>

        <div className="grid lg:grid-cols-[7fr_5fr] gap-6">
          {/* Dispatch console screenshot */}
          <div className="mockup-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BrandMark size={26} />
                <span className="text-sm font-semibold tracking-tight">Dispatch monitor</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-success font-medium">
                <span className="size-1.5 rounded-full bg-success animate-soft-pulse" />
                Live
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5 mb-4">
              {[
                { v: "18", l: "Active routes", c: "text-primary" },
                { v: "312", l: "Stops today", c: "text-foreground" },
                { v: "276", l: "Delivered", c: "text-success" },
                { v: "98.2%", l: "On-time", c: "text-foreground" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg bg-secondary/60 px-3 py-2.5">
                  <div className={`text-lg font-bold tracking-tight ${s.c}`}>{s.v}</div>
                  <div className="text-[10px] text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl overflow-hidden border border-border bg-[#F4F6FA] aspect-[16/8] relative">
              <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="sg" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="800" height="400" fill="url(#sg)" />
                <path d="M 80 320 L 220 120 L 420 180 L 600 90 L 720 260" stroke="#5B62F7" strokeWidth="3" fill="none" strokeDasharray="6 6" opacity="0.5" />
                <path d="M 120 80 L 300 300 L 520 240 L 700 340" stroke="#22c55e" strokeWidth="3" fill="none" strokeDasharray="6 6" opacity="0.4" />
                {[[80, 320], [220, 120], [420, 180], [600, 90], [720, 260], [120, 80], [300, 300], [520, 240], [700, 340]].map(([x, y], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r="9" fill={i < 5 ? "#5B62F7" : "#22c55e"} />
                    <circle cx={x} cy={y} r="3.5" fill="white" />
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Driver app screenshot */}
          <div className="mockup-card p-4 lg:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-6 rounded-md bg-primary grid place-items-center">
                <Truck className="size-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight">Driver app · Stop #7</span>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10px] text-muted-foreground">Order</div>
                <div className="text-base font-bold font-mono text-primary">DOS-4837</div>
                <div className="mt-1.5 flex items-start gap-1.5 text-xs">
                  <MapPin className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-foreground/80">128 King St W, Toronto, ON</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3 text-center">
                  <PackageCheck className="size-5 text-success mx-auto mb-1" />
                  <div className="text-[11px] font-medium">Photo captured</div>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <CheckCircle2 className="size-5 text-primary mx-auto mb-1" />
                  <div className="text-[11px] font-medium">Signed ✓</div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-destructive-soft text-destructive text-center py-2.5 text-xs font-medium">
                  Failed
                </div>
                <div className="flex-1 rounded-lg bg-primary text-white text-center py-2.5 text-xs font-medium">
                  Delivered
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                <Clock className="size-3" />
                Proof saved on device — syncs even if the connection drops.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- COMPARISON */
function Comparison() {
  const rows = [
    { f: "Route optimization quality", us: true, them: "Add-on / top tier only" },
    { f: "Driver app + POD included", us: true, them: "Often extra" },
    { f: "Optimization available as an API", us: true, them: false },
    { f: "Transparent usage-based pricing", us: true, them: "Quote required" },
    { f: "Multi-tenant from day one", us: true, them: false },
    { f: "Start free, no sales call", us: true, them: "Demo gated" },
  ]
  return (
    <section className="py-24 lg:py-28 bg-secondary/40">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-12">
          <div className="section-eyebrow">How we compare</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
            Everything the incumbents charge extra for, in one platform
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Routific, OptimoRoute, Onfleet and Route4Me each do part of this
            well. Delivery OS bundles the whole stack — and uniquely lets you buy
            the optimization engine on its own.
          </p>
        </div>

        <div className="soft-card overflow-hidden">
          <div className="grid grid-cols-[1.6fr_0.7fr_1fr] bg-foreground text-background text-xs font-semibold">
            <div className="px-5 py-3.5">Capability</div>
            <div className="px-5 py-3.5 text-center">Delivery OS</div>
            <div className="px-5 py-3.5 text-center text-background/70">Typical competitor</div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.f}
              className={`grid grid-cols-[1.6fr_0.7fr_1fr] items-center text-sm ${
                i % 2 ? "bg-secondary/40" : "bg-background"
              }`}
            >
              <div className="px-5 py-3.5 font-medium text-foreground">{r.f}</div>
              <div className="px-5 py-3.5 flex justify-center">
                <span className="inline-grid place-items-center size-6 rounded-full bg-success-soft text-success">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              </div>
              <div className="px-5 py-3.5 text-center text-muted-foreground text-[13px]">
                {r.them === false ? (
                  <span className="inline-grid place-items-center size-6 rounded-full bg-destructive-soft text-destructive">
                    <X className="size-3.5" strokeWidth={3} />
                  </span>
                ) : (
                  r.them
                )}
              </div>
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
    <section className="py-24 lg:py-28 bg-background border-y border-border">
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

/* --------------------------------------------------------- TESTIMONIALS */
function Testimonials() {
  const quotes = [
    {
      q: "We cut a full van off our daily roster in the first month. The routes just make sense to drivers now.",
      n: "Marisol Reyes",
      r: "Ops Director, Harbor Same-Day",
    },
    {
      q: "We dropped Onfleet and a separate optimizer and replaced both with Delivery OS. Billing finally makes sense.",
      n: "Devin Park",
      r: "GM, Northline Logistics",
    },
    {
      q: "We embed their optimization API in our own dispatcher. 1,000 stops back in under two minutes, every time.",
      n: "Aisha Mohammed",
      r: "Head of Product, RouteKit",
    },
  ]
  return (
    <section className="py-24 lg:py-32 bg-secondary/40">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="section-eyebrow">Operators & developers</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
            Trusted to move millions of packages
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {quotes.map((t) => (
            <div key={t.n} className="soft-card p-6 flex flex-col">
              <div className="flex gap-0.5 mb-4 text-warning">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-foreground/90 flex-1">
                “{t.q}”
              </p>
              <div className="mt-5 pt-4 border-t border-border">
                <div className="text-sm font-semibold">{t.n}</div>
                <div className="text-xs text-muted-foreground">{t.r}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- PRICING */
function Pricing() {
  const tiers = [
    {
      name: "Starter",
      price: "Free",
      sub: "Up to 100 stops / month",
      features: ["1 dispatcher seat", "Unlimited drivers", "POD photo + signature", "Email notifications"],
      cta: "Start free",
      href: "/auth/sign-up",
      featured: false,
    },
    {
      name: "Growth",
      price: "$149",
      sub: "per month · up to 1,000 stops",
      features: ["Everything in Starter", "Advanced optimization", "Live dispatch map", "Usage-based overages", "Priority support"],
      cta: "Get a demo",
      href: "/auth/sign-up",
      featured: true,
    },
    {
      name: "Optimization API",
      price: "Custom",
      sub: "Buy the engine on its own",
      features: ["Standalone optimization API", "Volume usage pricing", "Full documentation access", "99.9% uptime SLA", "Solution architect"],
      cta: "Request access",
      href: "/route-optimization#contact",
      featured: false,
    },
  ]
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="section-eyebrow">Pricing</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
            Transparent pricing. Start free, scale on usage.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl p-7 flex flex-col ${
                t.featured
                  ? "bg-foreground text-background shadow-xl"
                  : "soft-card"
              }`}
            >
              {t.featured && (
                <span className="absolute top-5 right-5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-white">
                  Most popular
                </span>
              )}
              <div className="text-sm font-semibold tracking-tight">{t.name}</div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight">{t.price}</span>
              </div>
              <div className={`mt-1 text-xs ${t.featured ? "text-background/60" : "text-muted-foreground"}`}>
                {t.sub}
              </div>
              <ul className={`mt-6 space-y-2.5 text-sm flex-1 ${t.featured ? "text-background/80" : "text-foreground/80"}`}>
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`size-4 mt-0.5 shrink-0 ${t.featured ? "text-primary" : "text-success"}`} strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={t.href} className="mt-7">
                <Button
                  className={`w-full ${
                    t.featured ? "bg-background text-foreground hover:bg-background/90" : ""
                  }`}
                  variant={t.featured ? "default" : "outline"}
                >
                  {t.cta}
                </Button>
              </Link>
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
                Get a demo
              </Button>
            </Link>
            <Link href="/route-optimization">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:border-white/60 hover:text-white bg-transparent"
              >
                Explore optimization
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
