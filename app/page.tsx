import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, BarChart3, Clock, MapPinned, PackageCheck, Route, ShieldCheck, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  // Get user profile to determine role
  const { data: profile, error } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).single()

  // Check if there are database errors
  if (error) {
    console.log("[v0] Profile fetch error:", error)

    // @ts-ignore - error might have code or message properties
    const errorCode = error.code || error.error_code
    // @ts-ignore
    const errorMessage = error.message || error.error_description || ""

    if (errorCode === "42P17" || errorMessage.includes("infinite recursion")) {
      console.log("[v0] RLS infinite recursion detected, redirecting to /setup")
      redirect("/setup?error=rls_recursion")
    }

    // PostgreSQL error code PGRST205 means relation (table) does not exist
    if (errorCode === "PGRST205" || errorMessage.includes("Could not find the table")) {
      console.log("[v0] Database not set up, redirecting to /setup")
      redirect("/setup")
    }

    // For other errors, redirect to login
    console.log("[v0] Other error, redirecting to login")
    redirect("/auth/login")
  }

  if (!profile) {
    redirect("/auth/login")
  }

  if (profile.is_active === false) {
    console.log("[v0] User is inactive/deleted, signing out")
    await supabase.auth.signOut()
    redirect("/auth/login?error=account_inactive")
  }

  // Redirect based on role
  if (profile.role === "admin") {
    redirect("/admin")
  } else {
    redirect("/driver")
  }
}

function LandingPage() {
  const routeStops = [
    { label: "Depot", top: "18%", left: "18%", color: "bg-emerald-500" },
    { label: "12", top: "30%", left: "56%", color: "bg-sky-500" },
    { label: "18", top: "55%", left: "72%", color: "bg-amber-500" },
    { label: "24", top: "72%", left: "36%", color: "bg-rose-500" },
  ]
  const workflow = [
    ["1", "Import and prepare orders", "Upload orders, normalize addresses, reuse cached geocodes, and keep customer delivery details in one clean queue."],
    ["2", "Build routes without runaway spend", "Local route optimization is the default path, so dispatch can keep moving without triggering expensive HERE Tour Planning calls."],
    ["3", "Assign drivers and monitor progress", "Give drivers active routes, watch stop status change, and keep dispatch focused on exceptions instead of manual check-ins."],
    ["4", "Capture proof and close the loop", "Drivers capture compressed delivery photos, optional signatures, recipient names, and notes directly from mobile."],
  ]
  const operatorPanels = [
    { title: "Orders", value: "CSV-ready", text: "Batch import, validate customer emails, geocode missing coordinates, and keep pending orders ready for routing." },
    { title: "Routes", value: "Local-first", text: "Generate single or multi-driver route plans with fallback optimization available before any paid HERE optimization is used." },
    { title: "Drivers", value: "Mobile", text: "Drivers see assigned stops, customer details, click-to-call phone numbers, and proof-of-delivery controls on one stop page." },
    { title: "Super Admin", value: "Global", text: "See app-wide users, routes, orders, audit activity, and HERE API usage across the whole project." },
  ]

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-9 w-9 rounded-md bg-white p-1" />
            <span className="text-lg font-semibold tracking-normal">DAMN99 Dispatch</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="secondary" className="h-10">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/sign-up" className="hidden sm:inline-flex">
              <Button className="h-10 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[1fr_560px] lg:items-center lg:pb-20 lg:pt-12">
          <div className="max-w-3xl">
            <Badge className="mb-5 border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/10">
              Live delivery operations
            </Badge>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal sm:text-6xl lg:text-7xl">
              Delivery management built for dispatch speed.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Plan routes, assign drivers, track proof of delivery, and control HERE API spend from one operational
              workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 sm:w-auto">
                  Start dispatching
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="w-full border-white/25 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
                  Open dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <div className="absolute inset-4 rounded-md bg-slate-900">
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M18 18 C 38 18, 42 28, 56 30 S 78 40, 72 55 S 50 70, 36 72"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeDasharray="4 3"
                />
              </svg>
              {routeStops.map((stop) => (
                <div
                  key={stop.label}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
                  style={{ top: stop.top, left: stop.left }}
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${stop.color} text-sm font-bold text-white shadow-lg`}>
                    {stop.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative ml-auto w-full max-w-xs rounded-md border border-white/15 bg-white p-4 text-slate-950 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Route 14</p>
                  <p className="text-2xl font-semibold">32 stops</p>
                </div>
                <Truck className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-slate-100 p-3">
                  <p className="text-slate-500">Delivered</p>
                  <p className="text-xl font-semibold">21</p>
                </div>
                <div className="rounded-md bg-amber-100 p-3">
                  <p className="text-slate-600">Remaining</p>
                  <p className="text-xl font-semibold">11</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-10 sm:px-8 md:grid-cols-3">
        {[
          { icon: Route, title: "Cost-aware routing", text: "Local optimization runs by default, with HERE enabled only when you choose it." },
          { icon: PackageCheck, title: "Mobile POD capture", text: "Drivers upload delivery photos and return to the route list without getting stuck." },
          { icon: ShieldCheck, title: "Super Admin controls", text: "Monitor app-wide HERE usage, blocked calls, cache hits, and estimated spend." },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <item.icon className="h-6 w-6 text-emerald-600" />
            <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[420px_1fr] lg:items-start">
          <div>
            <Badge className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50">Dispatch workflow</Badge>
            <h2 className="mt-4 text-4xl font-semibold tracking-normal text-slate-950">
              A complete route day from import to proof of delivery.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              DAMN99 is designed around the real dispatch sequence: collect orders, make route decisions, assign
              drivers, monitor exceptions, and confirm the delivery with evidence that admins can review later.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {workflow.map(([step, title, text]) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-950 text-sm font-semibold text-white">
                  {step}
                </div>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-100">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="max-w-3xl">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
              Built for operators
            </Badge>
            <h2 className="mt-4 text-4xl font-semibold tracking-normal">Every panel has a job.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The app avoids marketing fluff inside the workflow. Admins get dense operational tables, drivers get
              simple mobile actions, and Super Admin gets global control with usage telemetry.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {operatorPanels.map((panel) => (
              <div key={panel.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{panel.title}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{panel.value}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{panel.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="rounded-md bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-slate-400">HERE Cost Analytics</p>
                <p className="mt-1 text-3xl font-semibold">$0.00</p>
              </div>
              <BarChart3 className="h-9 w-9 text-emerald-300" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Paid requests", "0 today"],
                ["Cache hits", "Tracked"],
                ["Blocked calls", "Budget-aware"],
                ["Refresh", "30 seconds"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-white/10 p-4">
                  <p className="text-sm text-slate-300">{label}</p>
                  <p className="mt-2 text-xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">Cost control</Badge>
          <h2 className="mt-4 text-4xl font-semibold tracking-normal">HERE APIs are treated like billable infrastructure.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Expensive route optimization is off by default. Geocoding uses memory and database cache layers. Super
            Admin can see request counts, cache hits, blocked events, errors, and estimated spend for the whole app.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {["Daily budget checks", "Per-service request limits", "Persistent geocode cache", "Real-time cost panel"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <Badge className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50">Mobile driver flow</Badge>
            <h2 className="mt-4 text-4xl font-semibold tracking-normal">Designed for the phone in a driver's hand.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The driver stop screen keeps the critical path short: review the customer, take a delivery photo, collect
              an optional signature, mark Delivered or Failed, and immediately return to the route.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {["Compressed photo upload", "Delivered and failed states", "Proof visible to admins"].map((item) => (
                <div key={item} className="rounded-md bg-slate-100 p-4 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 shadow-xl">
            <div className="rounded-md bg-white p-4">
              <p className="text-sm text-slate-500">Stop #18</p>
              <p className="mt-1 text-xl font-semibold">Customer delivery</p>
              <div className="mt-4 aspect-[4/3] rounded-md bg-slate-200" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-rose-600 p-3 text-center text-sm font-semibold text-white">Failed</div>
                <div className="rounded-md bg-emerald-600 p-3 text-center text-sm font-semibold text-white">
                  Delivered
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-8 md:grid-cols-4">
          {[
            ["99.9%", "workflow uptime target", Clock],
            ["30s", "cost panel refresh", BarChart3],
            ["0", "default HERE tour calls", MapPinned],
            ["24/7", "driver route access", Truck],
          ].map(([value, label, Icon]) => (
            <div key={label as string} className="flex items-center gap-3">
              <Icon className="h-8 w-8 text-sky-600" />
              <div>
                <p className="text-2xl font-semibold">{value as string}</p>
                <p className="text-sm text-slate-500">{label as string}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <h2 className="text-4xl font-semibold tracking-normal">Ready for dispatch, drivers, and Super Admin.</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Sign in to continue managing live routes, or create an account and connect your delivery operation to a
                workflow that controls costs while keeping drivers moving.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  Create account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="w-full border-white/25 bg-white/5 text-white hover:bg-white/10">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
