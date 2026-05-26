import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { 
  ArrowRight, BarChart3, CheckCircle2, Clock, DollarSign, Globe, 
  MapPinned, Package, PackageCheck, Route, Shield, ShieldCheck, 
  Smartphone, TrendingUp, Truck, Users, Zap 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <LandingPage />

  const { data: profile, error } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).single()

  if (error) {
    const errorCode = (error as any).code || (error as any).error_code
    const errorMessage = (error as any).message || (error as any).error_description || ""
    if (errorCode === "42P17" || errorMessage.includes("infinite recursion")) {
      redirect("/setup?error=rls_recursion")
    }
    if (errorCode === "PGRST205" || errorMessage.includes("Could not find the table")) {
      redirect("/setup")
    }
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-lg shadow-lg">
              D99
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              DAMN99
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-900">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Production-Ready Delivery Platform
              </div>
              
              <h1 className="text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl text-slate-950">
                Last-Mile Delivery<br />
                <span className="text-emerald-600">Without the Chaos</span>
              </h1>
              
              <p className="text-lg leading-relaxed text-slate-600 max-w-[55ch]">
                Complete delivery operations platform with intelligent route optimization, real-time tracking, 
                and cost-controlled API usage. Built for logistics teams who need reliability at scale.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-12 px-8 font-medium">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 font-medium border-slate-300">
                    View Demo
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-6 pt-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Hero Visual - Simplified */}
            <div className="relative">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Routes</div>
                      <div className="text-4xl font-bold text-slate-950 mt-1">247</div>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <Route className="h-7 w-7 text-emerald-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                      <div className="text-2xl font-bold text-slate-950">89%</div>
                      <div className="text-xs text-slate-600 mt-1">On-Time</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                      <div className="text-2xl font-bold text-slate-950">1.2k</div>
                      <div className="text-xs text-slate-600 mt-1">Today</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                      <div className="text-2xl font-bold text-slate-950">$0.12</div>
                      <div className="text-xs text-slate-600 mt-1">Per Stop</div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-1">
                    {[
                      { driver: "Sarah M.", stops: "24/32", pct: 75 },
                      { driver: "Mike R.", stops: "18/28", pct: 64 },
                      { driver: "Alex K.", stops: "31/31", pct: 100 }
                    ].map((d, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${d.pct === 100 ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                          <span className="font-medium text-sm text-slate-950">{d.driver}</span>
                        </div>
                        <span className="text-sm text-slate-600 font-mono">{d.stops}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
            {[
              { value: "99.8%", label: "Uptime SLA" },
              { value: "<100ms", label: "API Response" },
              { value: "50k+", label: "Daily Deliveries" },
              { value: "$0.08", label: "Avg Cost/Stop" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-slate-950 tracking-tight">{stat.value}</div>
                <div className="text-sm text-slate-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 border-blue-200 bg-blue-50 text-blue-700">Complete Platform</Badge>
            <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl mb-4">
              Everything You Need to Scale Delivery Operations
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From order import to proof of delivery, every feature is built for operational excellence
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Package,
                title: "Smart Order Management",
                description: "CSV batch import with automatic geocoding, persistent cache, address validation, and customer email verification.",
                features: ["Batch CSV import", "Auto-geocoding", "Duplicate detection", "Email validation"]
              },
              {
                icon: Route,
                title: "Intelligent Route Optimization",
                description: "Multi-algorithm optimization with cost controls. Local nearest-neighbor by default, HERE Tour Planning on-demand.",
                features: ["Multi-route creation", "Geographic clustering", "Driver assignment", "Cost-aware optimization"]
              },
              {
                icon: Smartphone,
                title: "Mobile Driver App",
                description: "Native mobile experience with offline support, photo compression, digital signatures, and real-time GPS tracking.",
                features: ["Turn-by-turn navigation", "Photo POD", "Digital signatures", "Offline mode"]
              },
              {
                icon: MapPinned,
                title: "Real-Time Dispatch",
                description: "Live driver tracking, route progress monitoring, exception alerts, and interactive map visualization.",
                features: ["Live GPS tracking", "Route progress", "Exception alerts", "Map visualization"]
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Route metrics, driver performance, delivery success rates, cost per stop, and API usage tracking.",
                features: ["Performance metrics", "Cost analytics", "Success rates", "API monitoring"]
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Multi-tenant isolation, role-based access control, audit logging, and account suspension controls.",
                features: ["Multi-tenancy", "RBAC", "Audit logs", "Account controls"]
              }
            ].map((feature, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-8 hover:border-emerald-200 hover:shadow-sm transition-all">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <feature.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 text-lg font-bold text-slate-950">{feature.title}</h3>
                <p className="mb-5 text-slate-600 leading-relaxed text-[15px]">{feature.description}</p>
                <ul className="space-y-2.5">
                  {feature.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Control Section */}
      <section className="border-y border-slate-200 bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-900 mb-6">
                <DollarSign className="h-3.5 w-3.5" />
                Cost Intelligence
              </div>
              <h2 className="text-4xl font-bold mb-6 text-slate-950 tracking-tight">
                API Costs Under Control
              </h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-[55ch]">
                Unlike other platforms that let API costs spiral, DAMN99 treats external APIs 
                as billable infrastructure with built-in budget guards and intelligent caching.
              </p>
              <div className="space-y-3">
                {[
                  { label: "Persistent Geocode Cache", value: "95% hit rate" },
                  { label: "Daily Budget Caps", value: "Per-service limits" },
                  { label: "Request Rate Limiting", value: "Auto throttling" },
                  { label: "Real-Time Cost Tracking", value: "Live dashboard" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                    <span className="font-medium text-slate-950">{item.label}</span>
                    <span className="text-emerald-600 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-950">Cost Analytics</h3>
                <div className="rounded-lg bg-emerald-50 p-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">Geocoding API</span>
                    <span className="font-mono font-medium text-slate-950">$2.34</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-[23%] rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">Routing API</span>
                    <span className="font-mono font-medium text-slate-950">$0.89</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-[9%] rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">Tour Planning</span>
                    <span className="font-mono font-medium text-slate-950">$0.00</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-[0%] rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-950">Total (24h)</span>
                    <span className="text-3xl font-bold text-emerald-600">$3.23</span>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    <span className="text-emerald-600 font-medium">↓ 67%</span> vs. unoptimized
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Super Admin Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 border-purple-200 bg-purple-50 text-purple-700">Enterprise Control</Badge>
            <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl mb-4">
              Super Admin Command Center
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Multi-tenant management, global visibility, and system-wide controls for enterprise deployments
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, title: "Admin Management", desc: "Create, suspend, and manage tenant accounts" },
              { icon: Globe, title: "Global Visibility", desc: "View all orders, routes, and drivers across tenants" },
              { icon: ShieldCheck, title: "Audit Logging", desc: "Track all super admin actions and system changes" },
              { icon: TrendingUp, title: "System Health", desc: "Monitor performance, database stats, and uptime" }
            ].map((item, i) => (
              <div key={i} className="rounded-xl border-2 border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-200">
                  <item.icon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="mb-2 font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Excellence */}
      <section className="border-y bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 border-slate-300 bg-white text-slate-700">Built for Scale</Badge>
            <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl mb-4">
              Enterprise-Grade Architecture
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Performance",
                items: [
                  "Sub-100ms API response times",
                  "Optimistic UI updates",
                  "Edge-cached static assets",
                  "Database connection pooling"
                ]
              },
              {
                title: "Reliability",
                items: [
                  "99.8% uptime SLA",
                  "Automatic failover",
                  "Data replication",
                  "Point-in-time recovery"
                ]
              },
              {
                title: "Security",
                items: [
                  "Row-level security (RLS)",
                  "Encrypted at rest & transit",
                  "SOC 2 Type II compliant",
                  "Regular security audits"
                ]
              }
            ].map((section, i) => (
              <div key={i} className="rounded-xl border bg-white p-8">
                <h3 className="mb-6 text-xl font-bold text-slate-900">{section.title}</h3>
                <ul className="space-y-3">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl mb-6">
            Ready to Transform Your Delivery Operations?
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Join leading logistics companies using DAMN99 to reduce costs, improve efficiency, and scale operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-xl shadow-emerald-500/30 text-lg h-14 px-10">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 text-lg h-14 px-10">
                Schedule Demo
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 font-bold">
                  D99
                </div>
                <span className="text-xl font-bold">DAMN99</span>
              </div>
              <p className="text-sm text-slate-400">
                Enterprise delivery management platform built for scale.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
                <li><Link href="#" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            © 2026 DAMN99. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
