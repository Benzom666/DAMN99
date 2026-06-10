import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Gauge,
  Layers,
  Clock3,
  Truck,
  ShieldCheck,
  Code2,
  Lock,
  Check,
  Network,
  Boxes,
  Route as RouteIcon,
  Workflow,
  LineChart,
  KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketingNav } from "@/components/marketing/nav"
import { MarketingFooter } from "@/components/marketing/footer"

export const metadata: Metadata = {
  title: "Route Optimization API & Engine — Delivery OS",
  description:
    "The Delivery OS route optimization engine — sequence thousands of stops in seconds with time windows, capacity and shift constraints. Use it in-app or buy it as a standalone API.",
  keywords: [
    "route optimization API",
    "vehicle routing problem",
    "VRP solver",
    "last-mile optimization",
    "delivery route planner API",
    "fleet routing engine",
  ],
}

export default function RouteOptimizationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <OptiHero />
      <ValueStrip />
      <HowItWorks />
      <Capabilities />
      <Benchmarks />
      <ApiSection />
      <GatedDocs />
      <OptiPricing />
      <Faq />
      <ContactCta />
      <MarketingFooter />
    </div>
  )
}

/* --------------------------------------------------------- HERO */
function OptiHero() {
  return (
    <section className="relative">
      <div className="hero-gradient hero-clip pb-32 pt-0">
        <div className="aurora" aria-hidden="true" />
        <div className="aurora-grid" aria-hidden="true" />

        <MarketingNav variant="light" active="/route-optimization" />

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 pt-14 pb-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm mb-6">
              <Sparkles className="size-3.5" />
              Optimization Engine · in-app & as an API
            </div>
            <h1 className="text-[2.25rem] sm:text-[2.9rem] lg:text-[3.5rem] leading-[1.06] font-bold tracking-tight text-white">
              Sequence thousands of stops into clean, drivable routes — in
              seconds
            </h1>
            <p className="mt-6 text-base lg:text-lg leading-relaxed text-white/85 max-w-2xl">
              The same engine that powers Delivery OS dispatch is available on
              its own. Send us stops, vehicles and constraints; get back
              optimized, sequenced routes your drivers will actually follow.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="#contact">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 shadow-sm">
                  Request API access
                </Button>
              </Link>
              <Link
                href="#api"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/40 px-4 h-12 text-sm font-medium text-white hover:bg-white/10 transition-all"
              >
                <Code2 className="size-4" />
                See a sample request
              </Link>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
            {[
              { v: "1,000+", l: "stops per solve" },
              { v: "94 sec", l: "typical solve time" },
              { v: "41%", l: "avg fewer miles" },
              { v: "99.9%", l: "API uptime SLA" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <div className="text-2xl font-bold tracking-tight text-white">{s.v}</div>
                <div className="text-[11px] text-white/70 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- VALUE STRIP */
function ValueStrip() {
  const items = [
    { icon: RouteIcon, t: "No more spaghetti", d: "Geographically clustered, non-overlapping territories drivers trust." },
    { icon: Clock3, t: "Time windows honored", d: "Per-stop windows, service times, and driver shift limits respected." },
    { icon: Boxes, t: "Capacity aware", d: "Volume, weight and package count constraints per vehicle." },
    { icon: ShieldCheck, t: "Production-grade", d: "Idempotent jobs, retries, and an uptime SLA you can build on." },
  ]
  return (
    <section className="bg-background border-b border-border py-14">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((it) => (
          <div key={it.t} className="flex gap-3">
            <div className="size-10 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
              <it.icon className="size-5" strokeWidth={1.9} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">{it.t}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{it.d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* --------------------------------------------------------- HOW IT WORKS (free overview) */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: Layers,
      t: "Send your stops",
      d: "Post addresses or coordinates with optional time windows, service durations, and package sizes. We geocode anything that needs it.",
    },
    {
      n: "02",
      icon: Workflow,
      t: "Define your fleet",
      d: "Describe vehicles, capacities, start/end depots, shift windows and breaks. Mixed fleets and multi-depot are supported.",
    },
    {
      n: "03",
      icon: Gauge,
      t: "Get optimized routes",
      d: "Receive sequenced routes per vehicle with ETAs, distance and drive time — ready to dispatch or render on a map.",
    },
  ]
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="section-eyebrow">How it works</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
            Three calls from a pile of addresses to a finished plan
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            This is the free overview. The full request/response reference,
            constraint catalog and tuning guide live in the developer docs
            below.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="soft-card p-7">
              <div className="flex items-center justify-between">
                <div className="feature-icon feature-icon--violet">
                  <s.icon className="size-6" strokeWidth={2} />
                </div>
                <span className="text-3xl font-bold text-secondary-foreground/15">{s.n}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- CAPABILITIES */
function Capabilities() {
  const caps = [
    { icon: Clock3, t: "Time windows", d: "Hard and soft windows per stop." },
    { icon: Boxes, t: "Capacity & volume", d: "Weight, volume and unit constraints." },
    { icon: Truck, t: "Mixed fleets", d: "Different vehicle profiles & costs." },
    { icon: Network, t: "Multi-depot", d: "Many start/end locations." },
    { icon: Workflow, t: "Shifts & breaks", d: "Driver hours and mandated breaks." },
    { icon: RouteIcon, t: "Balanced routes", d: "Even workloads across drivers." },
    { icon: LineChart, t: "Live re-optimize", d: "Recompute as stops change." },
    { icon: ShieldCheck, t: "Priorities & SLAs", d: "Must-serve and penalty handling." },
  ]
  return (
    <section className="py-24 lg:py-32 bg-secondary/40">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="section-eyebrow">Capabilities</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
            A real VRP solver, not a nearest-neighbor toy
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {caps.map((c) => (
            <div key={c.t} className="soft-card p-5">
              <c.icon className="size-5 text-primary" strokeWidth={1.9} />
              <div className="mt-3 text-sm font-semibold tracking-tight">{c.t}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- BENCHMARKS */
function Benchmarks() {
  const rows = [
    { n: "100 stops · 4 vehicles", t: "3.1 sec", m: "−38% miles" },
    { n: "500 stops · 12 vehicles", t: "28 sec", m: "−42% miles" },
    { n: "1,000 stops · 25 vehicles", t: "94 sec", m: "−41% miles" },
    { n: "2,500 stops · 60 vehicles", t: "4.5 min", m: "−39% miles" },
  ]
  return (
    <section className="py-24 lg:py-28 bg-background">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-10">
          <div className="section-eyebrow">Benchmarks</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
            Fast at scale, measured against unoptimized baselines
          </h2>
        </div>
        <div className="soft-card overflow-hidden">
          <div className="grid grid-cols-[1.8fr_1fr_1fr] bg-foreground text-background text-xs font-semibold">
            <div className="px-5 py-3.5">Problem size</div>
            <div className="px-5 py-3.5 text-center">Solve time</div>
            <div className="px-5 py-3.5 text-center">Distance saved</div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.n}
              className={`grid grid-cols-[1.8fr_1fr_1fr] items-center text-sm ${
                i % 2 ? "bg-secondary/40" : "bg-background"
              }`}
            >
              <div className="px-5 py-3.5 font-medium">{r.n}</div>
              <div className="px-5 py-3.5 text-center tabular-nums text-primary font-semibold">{r.t}</div>
              <div className="px-5 py-3.5 text-center tabular-nums text-success font-semibold">{r.m}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Indicative figures on standard infrastructure; results vary by
          geography and constraint mix. Full methodology available to API
          customers.
        </p>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- API SECTION */
function ApiSection() {
  return (
    <section id="api" className="py-24 lg:py-32 bg-foreground text-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 mb-6">
              <Code2 className="size-3.5" />
              Developer API
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.12]">
              One endpoint. JSON in, optimized routes out.
            </h2>
            <p className="mt-5 text-base text-background/70 leading-relaxed max-w-lg">
              A single authenticated <code className="text-background/90">POST</code> kicks
              off an optimization job. Poll or subscribe to a webhook for the
              result. SDKs for Node, Python and Go ship with an API key.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-background/80">
              {[
                "Bearer-token auth, scoped per project",
                "Synchronous for small jobs, async + webhook for large",
                "Deterministic, idempotent job ids — safe to retry",
                "Rate limits and usage metering built in",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="size-4 mt-0.5 text-primary shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="#contact">
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90">
                  Get an API key
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Code sample */}
          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <span className="size-3 rounded-full bg-rose-400/70" />
              <span className="size-3 rounded-full bg-amber-400/70" />
              <span className="size-3 rounded-full bg-emerald-400/70" />
              <span className="ml-2 text-[11px] text-background/50 font-mono">POST /v1/optimize</span>
            </div>
            <pre className="p-5 text-[12.5px] leading-relaxed font-mono text-background/85 overflow-x-auto">
{`curl https://api.deliveryos.app/v1/optimize \\
  -H "Authorization: Bearer $DOS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "vehicles": [
      { "id": "van-1", "capacity": 120,
        "start": [43.65, -79.38],
        "shift": ["08:00", "17:00"] }
    ],
    "stops": [
      { "id": "s1", "location": [43.70, -79.40],
        "size": 3, "window": ["09:00", "12:00"] },
      { "id": "s2", "location": [43.66, -79.35],
        "size": 1, "service": 120 }
    ]
  }'`}
            </pre>
            <div className="px-5 pb-5">
              <div className="text-[11px] text-background/50 mb-2 font-mono">200 OK</div>
              <pre className="rounded-lg bg-white/5 p-4 text-[12.5px] leading-relaxed font-mono text-emerald-200/90 overflow-x-auto">
{`{
  "job_id": "opt_3kQ9…",
  "routes": [
    { "vehicle": "van-1",
      "distance_km": 40.2,
      "drive_time_min": 135,
      "sequence": ["s2", "s1"] }
  ],
  "unassigned": []
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- GATED DOCS */
function GatedDocs() {
  const free = [
    { icon: Sparkles, t: "Quickstart", d: "Authenticate and run your first optimization in 5 minutes." },
    { icon: Layers, t: "Core concepts", d: "Stops, vehicles, depots, jobs — the mental model, explained." },
    { icon: Code2, t: "Sample request", d: "The annotated POST /v1/optimize shown above." },
  ]
  const gated = [
    { t: "Full constraint catalog", d: "Every window, capacity, skill, priority and penalty field." },
    { t: "Async jobs & webhooks", d: "Large-job lifecycle, polling, signatures, retries." },
    { t: "Tuning & objectives", d: "Balancing miles vs. time vs. fairness; cost models." },
    { t: "SDK reference", d: "Node, Python and Go clients with typed models." },
    { t: "Rate limits & metering", d: "Quotas, burst behavior, and usage accounting." },
    { t: "Multi-depot recipes", d: "Reference architectures for complex fleets." },
  ]
  return (
    <section id="docs" className="py-24 lg:py-32 bg-secondary/40">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-12">
          <div className="section-eyebrow">Documentation</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
            Start reading for free. Unlock the full reference with a key.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            The optimization engine is our product, so the deep reference is
            available to customers and trial keys. Here is what is open, and
            what unlocks when you request access.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Free docs */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground">
              <span className="inline-grid place-items-center size-6 rounded-full bg-success-soft text-success">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              Free to read
            </div>
            <div className="space-y-3">
              {free.map((d) => (
                <div key={d.t} className="soft-card p-5 flex gap-3">
                  <div className="size-10 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
                    <d.icon className="size-5" strokeWidth={1.9} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight">{d.t}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{d.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gated docs */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground">
              <span className="inline-grid place-items-center size-6 rounded-full bg-secondary text-muted-foreground">
                <Lock className="size-3.5" strokeWidth={2.5} />
              </span>
              Unlocks with an API key
            </div>
            <div className="relative">
              <div className="space-y-3">
                {gated.map((d) => (
                  <div
                    key={d.t}
                    className="rounded-[14px] border border-border bg-background/60 p-5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold tracking-tight text-foreground/80">{d.t}</div>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed blur-[2px] select-none">
                        {d.d}
                      </div>
                    </div>
                    <Lock className="size-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
              <div className="mt-5 soft-card p-6 text-center">
                <KeyRound className="size-6 text-primary mx-auto mb-3" />
                <div className="text-sm font-semibold tracking-tight">
                  Request a key to read the full docs
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
                  Trial keys include complete documentation and a sandbox quota.
                  No credit card to start.
                </p>
                <Link href="#contact" className="inline-block mt-4">
                  <Button>Request API access</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- PRICING */
function OptiPricing() {
  const tiers = [
    {
      name: "Trial",
      price: "Free",
      sub: "Sandbox key",
      features: ["Up to 250 stops / month", "Full documentation access", "Community support", "Node / Python / Go SDKs"],
      cta: "Start free",
      featured: false,
    },
    {
      name: "Scale",
      price: "Usage-based",
      sub: "Pay per optimized stop",
      features: ["Volume tiered pricing", "Async jobs + webhooks", "99.9% uptime SLA", "Email & chat support", "Higher rate limits"],
      cta: "Talk to us",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      sub: "Dedicated & on-prem",
      features: ["Private deployment options", "Custom constraints & objectives", "Solution architect", "Security review & DPA", "Premium SLA"],
      cta: "Contact sales",
      featured: false,
    },
  ]
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="section-eyebrow">API pricing</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
            Pay for what you optimize
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Transparent, usage-based pricing — no per-seat tax on your dispatchers.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl p-7 flex flex-col ${
                t.featured ? "bg-foreground text-background shadow-xl" : "soft-card"
              }`}
            >
              {t.featured && (
                <span className="absolute top-5 right-5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-white">
                  Most popular
                </span>
              )}
              <div className="text-sm font-semibold tracking-tight">{t.name}</div>
              <div className="mt-4 text-4xl font-bold tracking-tight">{t.price}</div>
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
              <Link href="#contact" className="mt-7">
                <Button
                  className={`w-full ${t.featured ? "bg-background text-foreground hover:bg-background/90" : ""}`}
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

/* --------------------------------------------------------- FAQ */
function Faq() {
  const faqs = [
    {
      q: "Can I use the optimizer without the full Delivery OS platform?",
      a: "Yes. The optimization engine is available as a standalone API. Many customers embed it in their own dispatch tooling while others use the full platform.",
    },
    {
      q: "How is it priced?",
      a: "Usage-based, billed per optimized stop with volume tiers. There are no per-seat fees. A free trial key includes a monthly sandbox quota.",
    },
    {
      q: "What constraints are supported?",
      a: "Time windows, service durations, vehicle capacity and volume, mixed fleets, multi-depot, shifts and breaks, priorities and SLAs. The full catalog is in the gated docs.",
    },
    {
      q: "How large a problem can it handle?",
      a: "Thousands of stops across dozens of vehicles. Small jobs return synchronously; large jobs run async with a webhook callback.",
    },
    {
      q: "Why are some docs gated?",
      a: "The engine is our core IP. We keep the quickstart and concepts open so you can evaluate the fit, and unlock the full reference the moment you request a key.",
    },
  ]
  return (
    <section className="py-24 lg:py-32 bg-secondary/40">
      <div className="max-w-[860px] mx-auto px-6 lg:px-10">
        <div className="mb-12">
          <div className="section-eyebrow">FAQ</div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
            Questions, answered
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group soft-card p-5 [&_summary]:list-none">
              <summary className="flex items-center justify-between cursor-pointer text-[15px] font-semibold tracking-tight">
                {f.q}
                <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45 text-xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- CONTACT CTA */
function ContactCta() {
  return (
    <section id="contact" className="relative bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="mockup-card p-10 lg:p-14 text-center max-w-3xl mx-auto bg-gradient-to-br from-primary to-[oklch(0.78_0.13_268)] border-0">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white max-w-xl mx-auto leading-[1.2]">
            Request access to the optimization API
          </h2>
          <p className="mt-5 text-base text-white/85 max-w-lg mx-auto leading-relaxed">
            Tell us about your fleet and volumes and we'll set you up with a
            trial key, full documentation, and a sandbox quota.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="mailto:sales@deliveryos.app?subject=Route%20Optimization%20API%20access">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 shadow-sm">
                Request API access
              </Button>
            </a>
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:border-white/60 hover:text-white bg-transparent"
              >
                Try the full platform
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-xs text-white/70">
            Prefer email? <span className="font-medium text-white">sales@deliveryos.app</span>
          </p>
        </div>
      </div>
    </section>
  )
}
