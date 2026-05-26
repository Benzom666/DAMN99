import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
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
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-8 py-6 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">DAMN99</div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="font-normal">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-neutral-900 hover:bg-neutral-800 font-normal shadow-lg shadow-neutral-900/10">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative border-b border-neutral-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-white to-neutral-50" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="relative mx-auto max-w-[1400px] px-8 py-32">
          <div className="grid grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm mb-8">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-900">Live Production System</span>
              </div>
              
              <h1 className="text-[72px] font-medium leading-[0.95] tracking-tight mb-8">
                Delivery operations<br />
                <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">without chaos</span>
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed mb-12 max-w-[600px]">
                Route optimization, real-time tracking, and cost-controlled APIs. 
                Built for logistics teams managing 50+ deliveries daily.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="bg-neutral-900 hover:bg-neutral-800 h-14 px-8 font-normal shadow-lg shadow-neutral-900/10">
                    Start 14-Day Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="h-14 px-8 font-normal border-neutral-300 backdrop-blur-sm">
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur-xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
                    <div>
                      <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Active Routes</div>
                      <div className="text-5xl font-bold tracking-tight bg-gradient-to-br from-neutral-900 to-neutral-600 bg-clip-text text-transparent">247</div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
                      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "On-Time", value: "89%", color: "emerald" },
                      { label: "Today", value: "1.2k", color: "blue" },
                      { label: "Per Stop", value: "$0.12", color: "purple" }
                    ].map((stat, i) => (
                      <div key={i} className="relative group">
                        <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5 rounded-xl blur-sm group-hover:blur-md transition-all`} />
                        <div className="relative rounded-xl border border-neutral-100 bg-white/50 backdrop-blur-sm p-4 hover:border-neutral-200 transition-all">
                          <div className="text-2xl font-bold tracking-tight mb-1">{stat.value}</div>
                          <div className="text-xs text-neutral-600">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "Sarah M.", progress: 75, status: "active" },
                      { name: "Mike R.", progress: 64, status: "active" },
                      { name: "Alex K.", progress: 100, status: "complete" }
                    ].map((driver, i) => (
                      <div key={i} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center gap-4 p-4 rounded-lg border border-neutral-100 bg-white/50 backdrop-blur-sm">
                          <div className={`w-2 h-2 rounded-full ${driver.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-2">{driver.name}</div>
                            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
                                style={{ width: `${driver.progress}%` }}
                              />
                            </div>
                          </div>
                          <div className="font-mono text-sm text-neutral-600">{driver.progress}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-20">
          <div className="grid grid-cols-4 gap-12">
            {[
              { value: "50k+", label: "Deliveries Optimized", gradient: "from-emerald-600 to-emerald-500" },
              { value: "89%", label: "On-Time Rate", gradient: "from-blue-600 to-blue-500" },
              { value: "$0.12", label: "Cost Per Stop", gradient: "from-purple-600 to-purple-500" },
              { value: "24/7", label: "Real-Time Tracking", gradient: "from-orange-600 to-orange-500" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-6xl font-bold tracking-tight mb-3 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-neutral-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-neutral-200 bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-[1400px] px-8 py-32">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 bg-white mb-6">
              <span className="text-sm font-medium text-neutral-600">Platform Features</span>
            </div>
            <h2 className="text-[48px] font-medium tracking-tight mb-6">
              Everything you need to<br />
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">scale delivery operations</span>
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                icon: "📦",
                title: "Order Management",
                description: "Bulk import, validation, and assignment. Handle thousands of orders with automated workflows.",
                gradient: "from-emerald-500/10 to-emerald-600/5",
                borderColor: "border-emerald-500/20"
              },
              {
                icon: "🗺️",
                title: "Route Optimization",
                description: "HERE Tour Planning API with cost controls. Multi-vehicle routing with time windows and capacity constraints.",
                gradient: "from-blue-500/10 to-blue-600/5",
                borderColor: "border-blue-500/20"
              },
              {
                icon: "👥",
                title: "Driver Management",
                description: "Mobile app for drivers with turn-by-turn navigation. Real-time status updates and proof of delivery.",
                gradient: "from-purple-500/10 to-purple-600/5",
                borderColor: "border-purple-500/20"
              },
              {
                icon: "📍",
                title: "Live Tracking",
                description: "Real-time GPS tracking with ETA updates. Customer notifications and delivery windows.",
                gradient: "from-orange-500/10 to-orange-600/5",
                borderColor: "border-orange-500/20"
              },
              {
                icon: "📊",
                title: "Analytics Dashboard",
                description: "Performance metrics, cost analysis, and driver efficiency. Export reports for stakeholders.",
                gradient: "from-pink-500/10 to-pink-600/5",
                borderColor: "border-pink-500/20"
              },
              {
                icon: "💰",
                title: "Cost Control",
                description: "API usage monitoring with budget alerts. Prevent runaway costs with configurable limits.",
                gradient: "from-cyan-500/10 to-cyan-600/5",
                borderColor: "border-cyan-500/20"
              }
            ].map((feature, i) => (
              <div key={i} className="group relative">
                <div className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                <div className={`relative h-full rounded-2xl border ${feature.borderColor} bg-white/80 backdrop-blur-sm p-8 hover:border-neutral-300 transition-all duration-300 shadow-lg shadow-neutral-900/5`}>
                  <div className="text-5xl mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-medium tracking-tight mb-4">{feature.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Control */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-32">
          <div className="grid grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur-xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
                    <div>
                      <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">API Cost This Month</div>
                      <div className="text-5xl font-bold tracking-tight bg-gradient-to-br from-neutral-900 to-neutral-600 bg-clip-text text-transparent">$127</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Budget</div>
                      <div className="text-2xl font-bold tracking-tight text-neutral-900">$500</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Usage</span>
                      <span className="font-mono font-medium">25.4%</span>
                    </div>
                    <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: "25.4%" }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    {[
                      { label: "Geocoding", value: "$42", calls: "2.1k" },
                      { label: "Routing", value: "$85", calls: "847" }
                    ].map((api, i) => (
                      <div key={i} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
                        <div className="text-xs text-neutral-500 mb-2">{api.label}</div>
                        <div className="text-2xl font-bold tracking-tight mb-1">{api.value}</div>
                        <div className="text-xs text-neutral-600 font-mono">{api.calls} calls</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[48px] font-medium tracking-tight mb-6">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Cost control</span><br />
                built-in
              </h2>
              <p className="text-xl text-neutral-600 leading-relaxed mb-8">
                Set budget limits, monitor API usage in real-time, and get alerts before costs spiral. 
                No surprises on your bill.
              </p>
              <ul className="space-y-4">
                {[
                  "Real-time cost tracking per API",
                  "Budget alerts and automatic limits",
                  "Usage analytics and forecasting",
                  "Cost optimization recommendations"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-neutral-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-b border-neutral-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="relative mx-auto max-w-[1400px] px-8 py-32 text-center">
          <h2 className="text-[56px] font-medium tracking-tight text-white mb-6">
            Ready to optimize your<br />delivery operations?
          </h2>
          <p className="text-xl text-neutral-300 mb-12 max-w-[600px] mx-auto">
            Start your 14-day free trial. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 h-14 px-8 font-normal shadow-2xl">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="h-14 px-8 font-normal border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-50 border-t border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">DAMN99</div>
            <div className="text-sm text-neutral-600">
              © 2026 DAMN99. Built for logistics teams.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
