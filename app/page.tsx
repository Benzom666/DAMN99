import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, Package, Route, Radio, Users, DollarSign, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <LandingPage />

  const { data: profile, error } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).single()

  if (error) {
    const errorCode = (error as any).code || (error as any).error_code
    const errorMessage = (error as any).message || (error as any).error_description || ""
    if (errorCode === "42P17" || errorMessage.includes("infinite recursion")) redirect("/setup?error=rls_recursion")
    if (errorCode === "PGRST205" || errorMessage.includes("Could not find the table")) redirect("/setup")
    redirect("/auth/login")
  }

  if (!profile) redirect("/auth/login")
  if (profile.is_active === false) {
    await supabase.auth.signOut()
    redirect("/auth/login?error=account_inactive")
  }

  redirect(profile.role === "admin" ? "/admin" : "/driver")
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">DAMN99</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800">Start Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Asymmetric Split */}
      <section className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-none mb-6">
              Route optimization<br />for delivery teams
            </h1>
            <p className="text-xl text-zinc-600 leading-relaxed mb-8 max-w-[540px]">
              Cut fuel costs 40%. Track every delivery. Optimize 100+ stops in seconds.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 h-12 px-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Active</div>
                  <div className="text-3xl font-bold tracking-tight">247</div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center">
                  <Route className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "On-time", value: "94%" },
                  { label: "Today", value: "1.2k" },
                  { label: "Saved", value: "$4k" }
                ].map((stat, i) => (
                  <div key={i} className="text-center p-3 rounded-lg border border-zinc-100">
                    <div className="text-lg font-bold">{stat.value}</div>
                    <div className="text-xs text-zinc-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {[
                  { name: "Sarah M.", progress: 85 },
                  { name: "Mike R.", progress: 60 },
                  { name: "Alex K.", progress: 100 }
                ].map((driver, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded border border-zinc-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1.5">{driver.name}</div>
                      <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-900 rounded-full" style={{ width: `${driver.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "40%", label: "Cost reduction" },
              { value: "94%", label: "On-time rate" },
              { value: "2.5h", label: "Saved daily" },
              { value: "500+", label: "Teams" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-bold tracking-tight mb-1">{stat.value}</div>
                <div className="text-sm text-zinc-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Asymmetric Grid */}
      <section className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Built for logistics teams</h2>
            <p className="text-xl text-zinc-600 max-w-2xl">
              Everything you need to manage deliveries at scale
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {[
              {
                icon: Route,
                title: "Smart routing",
                description: "AI-powered optimization. 100+ stops in seconds."
              },
              {
                icon: Radio,
                title: "Live tracking",
                description: "GPS updates. Real-time ETAs. Full visibility."
              },
              {
                icon: Package,
                title: "Proof of delivery",
                description: "Photos, signatures, notes. Complete records."
              },
              {
                icon: Users,
                title: "Driver management",
                description: "Assign routes. Track performance. Manage fleet."
              },
              {
                icon: DollarSign,
                title: "Cost control",
                description: "Monitor API usage. Optimize spending."
              },
              {
                icon: Shield,
                title: "Enterprise security",
                description: "Encryption. Access control. Audit logs."
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-zinc-900" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Three steps to optimize</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              { num: "1", title: "Import orders", desc: "CSV upload or API" },
              { num: "2", title: "Optimize routes", desc: "AI creates efficient paths" },
              { num: "3", title: "Track deliveries", desc: "Live updates for drivers" }
            ].map((step, i) => (
              <div key={i}>
                <div className="w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xl font-bold mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-zinc-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Start optimizing deliveries
          </h2>
          <p className="text-xl text-zinc-600 mb-8 max-w-2xl mx-auto">
            Join 500+ logistics teams using DAMN99
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 h-12 px-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="h-12 px-6">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">DAMN99</span>
            </div>
            <p className="text-sm text-zinc-600">© 2024 DAMN99</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
