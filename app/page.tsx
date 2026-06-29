import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  Route as RouteIcon,
  Navigation,
  PackageCheck,
  Building2,
  Crown,
  Check,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
   LANDING — premium enterprise · delivery platform first, API second
   ===================================================================== */
function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <MarketingNav variant="dark" />
      </div>
      <Hero />
      <Logos />
      <Platform />
      <RouteOptimization />
      <DeveloperApi />
      <Stats />
      <FinalCTA />
      <MarketingFooter />
    </div>
  )
}

/* --------------------------------------------------------- HERO */
function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 70% -10%, var(--color-primary-soft), transparent 60%)",
      }}
    >
      <div className="max-w-[1180px] mx-auto px-7 pt-20 lg:pt-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card px-3.5 py-1.5 text-sm text-muted-foreground shadow-sm">
          <span className="font-semibold text-primary">DeliveryOS</span> · the last-mile delivery platform
        </span>

        <h1 className="mt-6 mx-auto max-w-3xl text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.05] tracking-tight">
          Run your entire delivery operation — with{" "}
          <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            route optimization
          </span>{" "}
          that saves real miles
        </h1>

        <p className="mt-5 mx-auto max-w-xl text-lg text-muted-foreground">
          Import orders, optimize routes, dispatch drivers, and capture proof of delivery — one
          system from depot to doorstep. The optimization engine builds clean, geographic routes
          that cut distance and time on every run.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3.5">
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2">
              Get a demo <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="#platform">
            <Button size="lg" variant="outline">
              See the platform
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground/80">
          CSV import · live dispatch · proof of delivery · multi-tenant isolation
        </p>
      </div>

      <ProductShot />
    </section>
  )
}

/* Clean product-UI mock (browser chrome + sidebar + KPIs + live dispatch). */
function ProductShot() {
  const pins = [
    { c: "var(--color-primary)", l: "44%", t: "42%" },
    { c: "var(--color-primary)", l: "62%", t: "50%" },
    { c: "#16a34a", l: "80%", t: "44%" },
    { c: "#e11d48", l: "34%", t: "80%" },
  ]
  return (
    <div className="max-w-[1000px] mx-auto px-7 mt-14 pb-24">
      <div className="mockup-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2">
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="ml-3 text-xs text-muted-foreground">app.deliveryos.ca / admin / dispatch</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
          <div className="hidden md:block border-r border-border bg-surface-2 p-3">
            {([
              ["Orders", false],
              ["Dispatch", true],
              ["Routes", false],
              ["Drivers", false],
              ["Costs", false],
            ] as const).map(([label, on]) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] mb-0.5 ${
                  on ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                <span className={`size-4 rounded-[5px] ${on ? "bg-primary" : "bg-border-strong"}`} />
                {label}
              </div>
            ))}
          </div>
          <div className="p-5 text-left">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold">Live dispatch</h4>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary-soft text-primary">
                4 routes active
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                ["Stops today", "412"],
                ["Delivered", "287"],
                ["On-time", "96%"],
                ["Dist. saved", "38%"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-surface p-3">
                  <div className="text-[11.5px] text-muted-foreground">{k}</div>
                  <div className="text-[22px] font-semibold tabular-nums mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-3.5">
              <div
                className="relative h-[194px] rounded-xl border border-border overflow-hidden"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--color-surface-3) 1px, transparent 1px), linear-gradient(90deg, var(--color-surface-3) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                <Seg left="20%" top="64%" width="28%" rot={-24} />
                <Seg left="44%" top="42%" width="24%" rot={12} />
                <Seg left="62%" top="50%" width="20%" rot={-6} />
                <span
                  className="absolute size-[18px] rounded-md border-2 border-white"
                  style={{ background: "#111827", left: "20%", top: "64%", transform: "translate(-50%,-50%)" }}
                />
                {pins.map((p, i) => (
                  <span
                    key={i}
                    className="absolute size-3.5 rounded-full border-2 border-white shadow"
                    style={{ background: p.c, left: p.l, top: p.t, transform: "translate(-50%,-50%)" }}
                  />
                ))}
              </div>
              <div>
                {[
                  ["1", "A. Okafor", "142 King St W", "done", "ok"],
                  ["2", "R. Mehta", "9 Banner Ave", "en route", "go"],
                  ["3", "L. Chen", "88 Lake Blvd", "queued", "wt"],
                  ["4", "S. Park", "5 Maple Ct", "queued", "wt"],
                ].map(([seq, nm, ad, st, cls]) => (
                  <div key={seq} className="flex items-center gap-2.5 py-2 border-b border-border last:border-0">
                    <span className="grid place-items-center size-6 rounded-[7px] bg-primary-soft text-primary text-xs font-semibold shrink-0">
                      {seq}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">{nm}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{ad}</div>
                    </div>
                    <span
                      className={`ml-auto text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${
                        cls === "ok"
                          ? "bg-success-soft text-success"
                          : cls === "go"
                            ? "bg-primary-soft text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {st}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Seg({ left, top, width, rot }: { left: string; top: string; width: string; rot: number }) {
  return (
    <span
      className="absolute h-[2.5px] rounded"
      style={{
        left,
        top,
        width,
        transformOrigin: "left",
        transform: `rotate(${rot}deg)`,
        background: "linear-gradient(90deg, var(--color-primary), #9b8bff)",
      }}
    />
  )
}

/* --------------------------------------------------------- LOGOS */
function Logos() {
  return (
    <div className="border-y border-border bg-surface-2">
      <div className="max-w-[1180px] mx-auto px-7 py-6 flex items-center justify-center gap-x-12 gap-y-3 flex-wrap">
        <span className="text-[12.5px] text-muted-foreground">Trusted by last-mile teams</span>
        {["NORTHWIND", "CARGOLINE", "METRO FRESH", "RELAY·9", "HAULPOINT"].map((n) => (
          <span key={n} className="text-[15px] font-semibold tracking-wide text-muted-foreground/55">
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}

/* --------------------------------------------------------- PLATFORM */
const MODULES = [
  { icon: Boxes, h: "Orders", p: "CSV import, manual entry, or API. Dedupe, geocode, and validate before they hit a route." },
  { icon: RouteIcon, h: "Route optimization", p: "Optimize one driver or a whole fleet into clean geographic territories — no spaghetti, no crossing." },
  { icon: Navigation, h: "Dispatch", p: "Live map, driver positions, ETAs, and a styled detail card on every stop." },
  { icon: PackageCheck, h: "Proof of delivery", p: "Photo + signature capture, durable upload, and an automatic customer email on completion." },
  { icon: Building2, h: "Multi-tenant", p: "Full data isolation between admins, with role-based access enforced end to end." },
  { icon: Crown, h: "Super-admin", p: "God-mode oversight of every admin, driver, route, and cost — with a full audit trail." },
]

function Platform() {
  return (
    <section id="platform" className="py-24">
      <div className="max-w-[1180px] mx-auto px-7">
        <div className="max-w-2xl mx-auto text-center">
          <span className="eyebrow">The platform</span>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">One system, depot to doorstep</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything an operator needs to run last-mile delivery — orders to proof of delivery, with a
            super-admin layer over it all.
          </p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {MODULES.map(({ icon: Icon, h, p }) => (
            <div key={h} className="soft-card p-6">
              <div className="grid place-items-center size-11 rounded-xl bg-primary-soft text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-[17px] font-semibold">{h}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- ROUTE OPTIMIZATION */
function RouteOptimization() {
  const feats: [string, string][] = [
    ["Whole-fleet optimization", "Decide who delivers what and in which order — together, not as separate guesses."],
    ["Geographic territories", "Nearby stops stay on the same route. No overlap, no crossing across the city."],
    ["Real-world constraints", "Vehicle capacities, time windows, shift limits, and depot start/return all respected."],
  ]
  return (
    <section id="optimize" className="py-24 bg-surface-2 border-y border-border">
      <div className="max-w-[1180px] mx-auto px-7 grid lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-lg">
          <span className="eyebrow">Route optimization</span>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Routes that save real miles</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The core of DeliveryOS. Assignment and sequencing are solved together, so every driver gets a
            coherent territory and the shortest sensible path through it.
          </p>
          <div className="mt-7 space-y-4">
            {feats.map(([b, p]) => (
              <div key={b} className="flex gap-3">
                <span className="grid place-items-center size-6 rounded-[7px] bg-primary-soft text-primary shrink-0">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <div>
                  <div className="text-[14.5px] font-semibold">{b}</div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <BeforeAfter />
      </div>
    </section>
  )
}

function BeforeAfter() {
  return (
    <div className="mockup-card overflow-hidden">
      <div className="flex text-xs font-semibold text-muted-foreground border-b border-border">
        <div className="flex-1 px-4 py-3 border-r border-border">Before · manual</div>
        <div className="flex-1 px-4 py-3">After · optimized</div>
      </div>
      <div className="grid grid-cols-2">
        <MiniMap kind="bad" />
        <MiniMap kind="good" />
      </div>
      <div className="flex text-xs border-t border-border">
        <div className="flex-1 px-4 py-2.5 border-r border-border text-muted-foreground">
          Distance <b className="text-foreground font-semibold">32.6 km</b>
        </div>
        <div className="flex-1 px-4 py-2.5 text-muted-foreground">
          Distance <b className="text-foreground font-semibold">20.1 km</b>{" "}
          <span className="text-success font-semibold">· −38%</span>
        </div>
      </div>
    </div>
  )
}

function MiniMap({ kind }: { kind: "bad" | "good" }) {
  const bad = kind === "bad"
  const segs: [string, string, string, number][] = bad
    ? [
        ["30%", "30%", "42%", 38],
        ["65%", "62%", "38%", 168],
        ["32%", "72%", "46%", -46],
        ["55%", "28%", "34%", 120],
      ]
    : [
        ["20%", "50%", "20%", -32],
        ["33%", "31%", "26%", 10],
        ["58%", "33%", "22%", 52],
        ["78%", "55%", "18%", 150],
        ["60%", "70%", "30%", 196],
      ]
  const dots: [string, string][] = bad
    ? [["30%", "30%"], ["65%", "62%"], ["32%", "72%"], ["78%", "34%"], ["55%", "28%"]]
    : [["33%", "31%"], ["58%", "33%"], ["78%", "55%"], ["60%", "70%"]]
  return (
    <div
      className={`relative h-[230px] ${bad ? "border-r border-border" : ""}`}
      style={{
        backgroundImage:
          "linear-gradient(var(--color-surface-3) 1px, transparent 1px), linear-gradient(90deg, var(--color-surface-3) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <span
        className={`absolute top-2.5 left-3 z-10 text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${
          bad ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success"
        }`}
      >
        {bad ? "tangled" : "clean loop"}
      </span>
      {segs.map((s, i) => (
        <span
          key={i}
          className="absolute h-[2px] rounded"
          style={{
            left: s[0],
            top: s[1],
            width: s[2],
            transformOrigin: "left",
            transform: `rotate(${s[3]}deg)`,
            background: bad ? "#e5849a" : "var(--color-primary)",
            opacity: bad ? 0.85 : 1,
          }}
        />
      ))}
      <span
        className="absolute size-[13px] rounded border-2 border-white"
        style={{ background: "#111827", left: "20%", top: "50%", transform: "translate(-50%,-50%)" }}
      />
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute size-[9px] rounded-full border border-white"
          style={{
            background: bad ? "#c2566f" : "var(--color-primary-hover)",
            left: d[0],
            top: d[1],
            transform: "translate(-50%,-50%)",
          }}
        />
      ))}
    </div>
  )
}

/* --------------------------------------------------------- DEVELOPER API (compact, secondary) */
function DeveloperApi() {
  return (
    <section id="developers" className="py-24">
      <div className="max-w-[1180px] mx-auto px-7">
        <div className="soft-card grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center p-9">
          <div>
            <div className="font-mono text-[11.5px] tracking-wide text-primary font-medium">// for developers</div>
            <h3 className="mt-2.5 text-2xl font-semibold tracking-tight">
              That same optimization is available as an API
            </h3>
            <p className="mt-2.5 text-[14.5px] text-muted-foreground max-w-md">
              Already have a delivery stack? Skip the platform and call the optimization engine directly —
              send stops and vehicles, get assigned, sequenced routes back in seconds.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["POST /v1/optimize", "/v1/geocode", "/v1/dispatch"].map((e) => (
                <span
                  key={e}
                  className="font-mono text-[11.5px] text-foreground/80 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5"
                >
                  {e}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-5">
              <Link href="/route-optimization" className="text-sm font-medium text-primary hover:underline">
                Read the API overview →
              </Link>
              <Link href="/route-optimization#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Talk to us about access
              </Link>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-[12.5px] text-muted-foreground/80">
              <Lock className="size-3.5" /> Capabilities documented, optimization internals kept private.
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg" style={{ background: "#0E1118" }}>
            <div
              className="flex items-center gap-2 px-4 py-3 text-[11px]"
              style={{ color: "#8B94A6", borderBottom: "1px solid rgba(255,255,255,.08)" }}
            >
              <span className="size-2 rounded-full" style={{ background: "#2A3140" }} />
              <span className="size-2 rounded-full" style={{ background: "#2A3140" }} />
              <span className="size-2 rounded-full" style={{ background: "#2A3140" }} />
              <span className="ml-1.5">optimize</span>
              <span className="ml-auto" style={{ color: "#37D399" }}>200 · 3.8s</span>
            </div>
            <pre className="m-0 p-4 overflow-auto font-mono text-[12px] leading-[1.7]" style={{ color: "#CBD4E1" }}>
{`POST /v1/optimize
{
  "vehicles":[ {"id":"v1","capacity":50} ],
  "stops":[ {"id":"o1","lat":43.6,"lng":-79.4} ]
}
→ { "routes":[ {
      "vehicle":"v1",
      "sequence":["o7","o3","o1"],
      "distance_km":21.4 } ] }`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- STATS */
function Stats() {
  const stats: [string, string][] = [
    ["38%", "shorter total drive distance"],
    ["1,000+", "stops optimized per run"],
    ["<5s", "median optimize time"],
    ["99.9%", "POD capture success"],
  ]
  return (
    <section className="py-24 bg-surface-2 border-y border-border">
      <div className="max-w-[1180px] mx-auto px-7">
        <div className="max-w-2xl mx-auto text-center">
          <span className="eyebrow">In production</span>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Numbers operators feel</h2>
        </div>
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-5 text-center">
          {stats.map(([n, l]) => (
            <div key={l}>
              <div className="text-5xl font-semibold tracking-tight tabular-nums">{n}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- FINAL CTA */
function FinalCTA() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-[1180px] mx-auto px-7">
        <div
          className="relative overflow-hidden rounded-[24px] px-12 py-16 text-center text-white"
          style={{ background: "linear-gradient(135deg, var(--color-primary-hover), #7c3aed)" }}
        >
          <h2 className="relative text-4xl font-semibold tracking-tight">
            Move every delivery on the shortest sensible route.
          </h2>
          <p className="relative mt-3.5 text-lg text-white/85">
            Run the whole platform, or plug the optimization into what you already have.
          </p>
          <div className="relative mt-7 flex items-center justify-center gap-3.5">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                Get a demo <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/route-optimization">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent">
                For developers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
