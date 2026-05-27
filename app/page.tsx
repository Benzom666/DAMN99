import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  ArrowUpRight,
  ArrowRight,
  Radio,
  Cpu,
  Truck,
  ShieldCheck,
  Layers,
  Activity,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
   LANDING PAGE
   Aesthetic: Dispatch-Terminal — asphalt-black, hi-vis cargo-yellow,
   editorial italic display, monospace data. Designed to feel like a
   serious logistics operator, not a SaaS template.
   ===================================================================== */

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased relative overflow-x-hidden">
      {/* Decorative grid-paper backdrop */}
      <div className="pointer-events-none fixed inset-0 bg-grid-paper-fine opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="pointer-events-none fixed inset-0 bg-noise opacity-[0.18]" />

      <TopBar />
      <Ticker />
      <Hero />
      <Manifesto />
      <CapabilityGrid />
      <OpsConsole />
      <Numbers />
      <ProcessFlow />
      <CTABand />
      <Footer />
    </div>
  )
}

/* --------------------------------------------------------- TOP BAR */
function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="size-7 grid place-items-center bg-signal text-signal-foreground font-mono text-[11px] font-bold tracking-tight">
              99
            </div>
            <div className="absolute inset-0 bg-signal animate-pulse-signal opacity-0 group-hover:opacity-100" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-sm font-semibold tracking-[0.18em] text-foreground">
              DAMN
            </span>
            <span className="font-serif italic text-sm text-signal">
              ninety-nine
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: "Capabilities", href: "#capabilities" },
            { label: "Console", href: "#console" },
            { label: "Numbers", href: "#numbers" },
            { label: "Process", href: "#process" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button variant="signal" size="sm">
              Start Operating
              <ArrowUpRight className="size-3.5" strokeWidth={2.5} />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

/* --------------------------------------------------------- TICKER */
function Ticker() {
  const items = [
    { code: "RTE-0421", text: "Optimized · 47 stops · LA Metro" },
    { code: "POD-1109", text: "Delivered · Long Beach · 14:22 PT" },
    { code: "DRV-007", text: "On route · 3 stops remaining" },
    { code: "BATCH-2047", text: "Imported · 312 orders · CSV" },
    { code: "RTE-0422", text: "Dispatched · 5 drivers · 124 stops" },
    { code: "OPS-LIVE", text: "Uptime 99.97% · 22 regions active" },
    { code: "FLEET-A", text: "Fuel saved 41% · this quarter" },
    { code: "POD-1110", text: "Signature captured · Inglewood" },
  ]

  return (
    <div className="border-b border-border bg-surface/60 overflow-hidden">
      <div className="flex items-center gap-3 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-2 px-4 py-2 border-r border-border flex-shrink-0 bg-background">
          <span className="pulse-dot pulse-dot--signal" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal">
            LIVE OPS
          </span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker py-2">
            {[...items, ...items, ...items].map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-6 font-mono text-[11px] tracking-wide text-muted-foreground whitespace-nowrap"
              >
                <span className="text-signal">{item.code}</span>
                <span className="text-border-strong">→</span>
                <span>{item.text}</span>
                <span className="text-border ml-4">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------- HERO */
function Hero() {
  return (
    <section className="relative border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-16 lg:pb-24">
        {/* Sector tag */}
        <div className="flex items-center gap-3 mb-10 animate-fade-in">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-signal border border-signal/40 px-2 py-1 rounded-[2px]">
            SECTOR-A · v1.0
          </span>
          <span className="hairline flex-1 max-w-24" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            Dispatch Terminal
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          {/* Headline column */}
          <div className="lg:col-span-7 animate-rise stagger-1">
            <h1 className="text-[clamp(3rem,7.5vw,7rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
              Routes
              <br />
              that don't{" "}
              <span className="font-serif italic font-normal text-signal">
                break
              </span>
              <br />
              under pressure.
            </h1>

            <p className="mt-8 text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-[58ch]">
              DAMN99 is the dispatch terminal for serious logistics operators.
              Optimize 10,000 stops before lunch. Track every drop. Ship the
              day, every day.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/auth/sign-up">
                <Button variant="signal" size="xl">
                  Run Your First Route
                  <ArrowUpRight className="size-4" strokeWidth={2.5} />
                </Button>
              </Link>
              <Link href="#console">
                <Button variant="outline" size="xl">
                  Open the Console
                </Button>
              </Link>
            </div>

            {/* Trust strip */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: "10K+", v: "Stops/day" },
                { k: "41%", v: "Fuel saved" },
                { k: "99.97%", v: "Uptime" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="border-l border-border pl-4 animate-rise"
                  style={{ animationDelay: `${0.2 + i * 0.05}s` }}
                >
                  <div className="font-mono text-2xl font-semibold tracking-tight">
                    {s.k}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operations console preview */}
          <div className="lg:col-span-5 animate-rise stagger-3">
            <ConsolePreview />
          </div>
        </div>
      </div>

      {/* Hi-vis cargo strip */}
      <div className="hazard-stripe h-2 w-full opacity-90" />
    </section>
  )
}

function ConsolePreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-2 border border-border rounded-sm -z-10" />
      <div className="bg-card border border-border-strong rounded-sm overflow-hidden shadow-2xl">
        {/* Console header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="size-2.5 rounded-full bg-destructive/70" />
              <div className="size-2.5 rounded-full bg-warning/70" />
              <div className="size-2.5 rounded-full bg-success/70" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground ml-3">
              ops-console.damn99
            </span>
          </div>
          <span className="pulse-dot" />
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 border-b border-border">
          {[
            { l: "Active Routes", v: "47", d: "+12 today" },
            { l: "Live Stops", v: "1,284", d: "98% on-time" },
            { l: "Drivers Out", v: "23", d: "all green" },
          ].map((s, i) => (
            <div
              key={i}
              className="px-4 py-4 border-r border-border last:border-r-0"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {s.l}
              </div>
              <div className="font-mono text-2xl mt-1 font-semibold">
                {s.v}
              </div>
              <div className="font-mono text-[10px] text-success mt-1">
                {s.d}
              </div>
            </div>
          ))}
        </div>

        {/* Mini route list */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="eyebrow">Active Manifest</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              03 / 47
            </span>
          </div>

          {[
            { id: "RTE-0421", driver: "M. Reyes", stops: "47", pct: 78, status: "active" },
            { id: "RTE-0422", driver: "S. Patel", stops: "32", pct: 54, status: "active" },
            { id: "RTE-0420", driver: "A. Knox", stops: "28", pct: 100, status: "done" },
          ].map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 py-2 border-b border-border last:border-b-0"
            >
              <span
                className={
                  r.status === "active"
                    ? "pulse-dot"
                    : "size-2 rounded-full bg-muted-foreground/40"
                }
              />
              <div className="font-mono text-[11px] text-signal w-20">
                {r.id}
              </div>
              <div className="text-xs flex-1 truncate">{r.driver}</div>
              <div className="font-mono text-[10px] text-muted-foreground w-12 text-right">
                {r.stops} pts
              </div>
              <div className="w-24 h-1 bg-surface-3 rounded-full overflow-hidden relative">
                <div
                  className={
                    r.pct === 100
                      ? "h-full bg-success"
                      : "h-full bg-signal"
                  }
                  style={{ width: `${r.pct}%` }}
                />
              </div>
              <div className="font-mono text-[10px] text-foreground w-9 text-right">
                {r.pct}%
              </div>
            </div>
          ))}
        </div>

        {/* Bottom command bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="text-success">●</span> sync ok
          </span>
          <span>last refresh · 0.4s</span>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------- MANIFESTO */
function Manifesto() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-3">
            <div className="eyebrow-signal mb-4">§ 01 — Manifesto</div>
            <div className="hairline w-12" />
          </div>
          <div className="lg:col-span-9">
            <p className="text-3xl lg:text-[2.5rem] font-light leading-[1.18] tracking-[-0.015em] text-foreground/95">
              We don't believe in dashboards{" "}
              <span className="font-serif italic text-signal">that look pretty</span>{" "}
              while routes burn fuel. We built DAMN99 for the operator at 5 AM in
              the warehouse, the dispatcher with a dropped pin and a customer on
              the line, the driver with{" "}
              <span className="font-serif italic text-signal">
                forty-seven stops
              </span>{" "}
              and a four-hour window.
              <br />
              <br />
              <span className="text-muted-foreground text-2xl lg:text-3xl">
                It works because we made it work.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- CAPABILITIES */
function CapabilityGrid() {
  const items = [
    {
      icon: Cpu,
      tag: "C-01",
      title: "Optimization Core",
      desc: "HERE-powered tour planning. Solve 1,000-stop VRPs in seconds. Geographic clustering, time windows, capacity constraints.",
      span: "lg:col-span-7",
    },
    {
      icon: Radio,
      tag: "C-02",
      title: "Live Dispatch",
      desc: "Real-time GPS. Driver positions stream every 30s. ETA recalc on the fly.",
      span: "lg:col-span-5",
    },
    {
      icon: Truck,
      tag: "C-03",
      title: "Driver Field App",
      desc: "Mobile manifest. POD with photo + signature. Offline cache for dead-zone deliveries.",
      span: "lg:col-span-5",
    },
    {
      icon: Layers,
      tag: "C-04",
      title: "Multi-Tenant Isolation",
      desc: "Row-level security. Sub-fleets. Sub-admins. White-label ready.",
      span: "lg:col-span-7",
    },
    {
      icon: ShieldCheck,
      tag: "C-05",
      title: "Audit + Compliance",
      desc: "Every action logged. Every override traceable. Built for regulators, not just operators.",
      span: "lg:col-span-4",
    },
    {
      icon: Activity,
      tag: "C-06",
      title: "Cost Controls",
      desc: "API spend guardrails. Per-tenant budgets. No surprise invoices.",
      span: "lg:col-span-4",
    },
    {
      icon: Zap,
      tag: "C-07",
      title: "CSV → Routes in 90s",
      desc: "Drop a spreadsheet. Get optimized routes. Zero training.",
      span: "lg:col-span-4",
    },
  ]

  return (
    <section id="capabilities" className="border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-10 items-end mb-14">
          <div className="lg:col-span-7">
            <div className="eyebrow-signal mb-4">§ 02 — Capabilities</div>
            <h2 className="text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[0.95]">
              Built like a{" "}
              <span className="font-serif italic font-normal text-signal">
                rail-yard
              </span>
              .
              <br />
              Not a startup deck.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pb-2">
            <p className="text-base text-muted-foreground leading-relaxed max-w-[44ch]">
              Seven primitives. One operations layer. Each component is
              productionized, instrumented, and audited. None are stubs.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-3">
          {items.map((it, i) => (
            <CapCard key={i} {...it} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CapCard({
  icon: Icon,
  tag,
  title,
  desc,
  span,
}: {
  icon: any
  tag: string
  title: string
  desc: string
  span: string
}) {
  return (
    <div
      className={`group relative col-span-12 ${span} border border-border bg-card hover:bg-surface-2 hover:border-border-strong transition-all duration-200 p-6 lg:p-7 overflow-hidden`}
    >
      {/* Top label row */}
      <div className="flex items-center justify-between mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
          {tag}
        </span>
        <Icon
          className="size-5 text-muted-foreground group-hover:text-signal transition-colors"
          strokeWidth={1.5}
        />
      </div>

      <h3 className="text-2xl font-semibold tracking-tight mb-2.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[44ch]">
        {desc}
      </p>

      {/* Hover signal stripe */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-signal group-hover:w-full transition-all duration-500" />
    </div>
  )
}

/* --------------------------------------------------------- OPS CONSOLE STRIP */
function OpsConsole() {
  return (
    <section
      id="console"
      className="border-b border-border bg-surface relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-paper opacity-50" />
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <div className="eyebrow-signal mb-4">§ 03 — The Console</div>
            <h2 className="text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[0.95] mb-6">
              The{" "}
              <span className="font-serif italic font-normal text-signal">
                command line
              </span>{" "}
              for fleet ops.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-[44ch] mb-8">
              No bloated CRM. No drag-and-drop kanban. Just routes, drivers,
              packages, and the data you need to ship the day.
            </p>

            <ul className="space-y-3">
              {[
                "Live driver positions on a single map",
                "Per-route progress with stop-level detail",
                "Bulk reassignment when a driver calls out sick",
                "Proof of delivery streaming as it captures",
                "API spend tracked per tenant, per day",
              ].map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-foreground/90"
                >
                  <span className="font-mono text-signal text-[11px] mt-0.5 tracking-tight">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mock console */}
          <div className="lg:col-span-7">
            <div className="border border-border-strong bg-background rounded-sm overflow-hidden corner-brackets">
              {/* Tab bar */}
              <div className="flex border-b border-border bg-surface-2 text-[11px] font-mono uppercase tracking-[0.14em]">
                {["Dispatch", "Routes", "Drivers", "Costs"].map((t, i) => (
                  <div
                    key={t}
                    className={
                      i === 0
                        ? "px-4 py-2.5 text-signal-foreground bg-signal"
                        : "px-4 py-2.5 text-muted-foreground border-r border-border"
                    }
                  >
                    {t}
                  </div>
                ))}
                <div className="flex-1 border-b border-border" />
              </div>

              {/* Faux map area */}
              <div className="relative h-72 bg-background bg-grid-paper-fine border-b border-border overflow-hidden">
                {/* Route paths (svg) */}
                <svg
                  viewBox="0 0 600 280"
                  className="absolute inset-0 w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path
                    d="M 60 220 Q 140 80, 240 130 T 460 80 L 540 60"
                    fill="none"
                    stroke="oklch(0.92 0.19 100)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.9"
                  />
                  <path
                    d="M 80 60 Q 180 180, 280 130 T 520 220"
                    fill="none"
                    stroke="oklch(0.78 0.18 145)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  {[
                    [60, 220, "signal"],
                    [240, 130, "muted"],
                    [340, 100, "muted"],
                    [460, 80, "muted"],
                    [540, 60, "success"],
                    [80, 60, "muted"],
                    [280, 130, "muted"],
                    [520, 220, "destructive"],
                  ].map(([x, y, color], i) => (
                    <g key={i}>
                      <circle
                        cx={x as number}
                        cy={y as number}
                        r="6"
                        fill={
                          color === "signal"
                            ? "oklch(0.92 0.19 100)"
                            : color === "success"
                              ? "oklch(0.78 0.18 145)"
                              : color === "destructive"
                                ? "oklch(0.65 0.245 28)"
                                : "oklch(0.55 0.005 60)"
                        }
                      />
                      <circle
                        cx={x as number}
                        cy={y as number}
                        r="3"
                        fill="oklch(0.115 0.005 60)"
                      />
                    </g>
                  ))}
                </svg>

                {/* HUD overlay */}
                <div className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground bg-background/70 backdrop-blur px-2 py-1 border border-border">
                  34.05° N · 118.24° W
                </div>
                <div className="absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-[0.16em] text-signal bg-background/70 backdrop-blur px-2 py-1 border border-signal/40">
                  ● 12 drivers · live
                </div>
              </div>

              {/* Bottom stat strip */}
              <div className="grid grid-cols-4 text-[11px] font-mono uppercase tracking-[0.14em]">
                {[
                  { l: "On-time", v: "98.2%", c: "text-success" },
                  { l: "Avg ETA", v: "12m", c: "text-foreground" },
                  { l: "Idle", v: "3", c: "text-warning" },
                  { l: "Failed", v: "0", c: "text-foreground" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="px-4 py-3 border-r border-border last:border-r-0"
                  >
                    <div className="text-muted-foreground text-[10px]">
                      {s.l}
                    </div>
                    <div className={`text-base mt-0.5 ${s.c}`}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- NUMBERS */
function Numbers() {
  return (
    <section id="numbers" className="border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="mb-14 max-w-2xl">
          <div className="eyebrow-signal mb-4">§ 04 — Numbers</div>
          <h2 className="text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[0.95]">
            What the{" "}
            <span className="font-serif italic font-normal text-signal">
              ledger
            </span>{" "}
            says.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-border">
          {[
            { v: "10,000+", l: "Stops dispatched daily" },
            { v: "41%", l: "Avg fuel reduction" },
            { v: "94 sec", l: "1,000-stop optimize time" },
            { v: "98.2%", l: "On-time delivery rate" },
            { v: "23 min", l: "Saved per driver, daily" },
            { v: "$0.04", l: "Cost per optimized stop" },
            { v: "99.97%", l: "Platform uptime" },
            { v: "0", l: "Black-Friday outages" },
          ].map((s, i) => (
            <div
              key={i}
              className="border-r border-border last:border-r-0 px-6 py-10 group hover:bg-surface-2 transition-colors odd:bg-background even:bg-background relative"
            >
              <div className="font-serif italic text-[clamp(2.5rem,4vw,4rem)] font-normal leading-none mb-3 text-foreground group-hover:text-signal transition-colors">
                {s.v}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- PROCESS FLOW */
function ProcessFlow() {
  const steps = [
    {
      n: "01",
      title: "Drop the manifest",
      desc: "CSV, API, or manual. Address validation and geocoding run instantly.",
    },
    {
      n: "02",
      title: "Solve the routes",
      desc: "Constraints in. Optimal paths out. Driver capacity, time windows, depot anchors — handled.",
    },
    {
      n: "03",
      title: "Dispatch the fleet",
      desc: "Drivers receive their day. You watch it unfold on a single screen.",
    },
    {
      n: "04",
      title: "Close the loop",
      desc: "POD captured. Customer notified. Receipt filed. Audit trail intact.",
    },
  ]

  return (
    <section id="process" className="border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-10 items-start mb-14">
          <div className="lg:col-span-4">
            <div className="eyebrow-signal mb-4">§ 05 — Operating loop</div>
            <h2 className="text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[0.95]">
              Four
              <br />
              <span className="font-serif italic font-normal text-signal">
                moves
              </span>
              .
            </h2>
          </div>
          <div className="lg:col-span-8">
            <p className="text-lg text-muted-foreground leading-relaxed max-w-[58ch]">
              The whole platform reduces to a four-stroke loop. Anything that
              isn't part of that loop is friction, and we cut it.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 border border-border">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className={`relative p-8 ${i < steps.length - 1 ? "lg:border-r border-border" : ""} border-b lg:border-b-0 ${i < 2 ? "border-b md:border-b" : ""} bg-card hover:bg-surface-2 transition-colors`}
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-8">
                STEP {s.n}
              </div>
              <h3 className="text-2xl font-semibold tracking-tight mb-3 leading-tight">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.desc}
              </p>
              <div className="absolute bottom-3 right-3 font-serif italic text-5xl text-signal/15">
                {s.n}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- CTA */
function CTABand() {
  return (
    <section className="border-b border-border relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-paper opacity-30" />
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
        <div className="eyebrow-signal mb-6 justify-center flex items-center gap-3">
          <span className="hairline w-8" />
          <span>§ 99 — Get on the road</span>
          <span className="hairline w-8" />
        </div>

        <h2 className="text-[clamp(3rem,7vw,6rem)] font-semibold tracking-[-0.04em] leading-[0.95] mb-6 max-w-5xl mx-auto">
          Ten thousand packages.
          <br />
          <span className="font-serif italic font-normal text-signal">
            One terminal.
          </span>
        </h2>

        <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Spin up a tenant in 90 seconds. No sales call. No contract. No
          credit card.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/auth/sign-up">
            <Button variant="signal" size="xl">
              Start Operating
              <ArrowUpRight className="size-4" strokeWidth={2.5} />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="xl">
              Sign In
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="pulse-dot" /> All systems green
          </span>
          <span className="text-border">◆</span>
          <span>SOC2 in progress</span>
          <span className="text-border">◆</span>
          <span>USA · CA · MX</span>
        </div>
      </div>

      <div className="hazard-stripe h-1.5 w-full" />
    </section>
  )
}

/* --------------------------------------------------------- FOOTER */
function Footer() {
  return (
    <footer className="bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-7 grid place-items-center bg-signal text-signal-foreground font-mono text-[11px] font-bold">
                99
              </div>
              <span className="font-mono text-sm font-semibold tracking-[0.18em]">
                DAMN<span className="font-serif italic text-signal ml-1">ninety-nine</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Dispatch terminal for fleets that move real things to real
              addresses. Built on Next.js, Supabase, HERE Maps, and a deep
              suspicion of dashboards.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {[
              {
                h: "Product",
                items: ["Capabilities", "Console", "Numbers", "Process"],
              },
              {
                h: "Operators",
                items: ["Sign in", "Create account", "Driver app", "Status"],
              },
              {
                h: "Company",
                items: ["Manifesto", "Security", "Privacy", "Contact"],
              },
            ].map((col) => (
              <div key={col.h}>
                <div className="eyebrow mb-3">{col.h}</div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {col.items.map((it) => (
                    <li
                      key={it}
                      className="hover:text-foreground transition-colors cursor-pointer"
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>© 2026 DAMN99 · all rights reserved</span>
          <span className="flex items-center gap-2">
            <span className="pulse-dot" />
            Operations green · {new Date().getFullYear()} build
          </span>
        </div>
      </div>
    </footer>
  )
}
