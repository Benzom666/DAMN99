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
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-8">
              <Badge className="inline-flex items-center gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-1.5">
                <Zap className="h-3.5 w-3.5" />
                Enterprise-Grade Delivery Platform
              </Badge>
              
              <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  Last-Mile Delivery
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                  Without the Chaos
                </span>
              </h1>
              
              <p className="text-xl leading-relaxed text-slate-600 max-w-2xl">
                Complete delivery management platform with intelligent route optimization, real-time tracking, 
                and cost-controlled API usage. Built for scale, priced for growth.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-xl shadow-emerald-500/30 text-lg h-14 px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 text-lg h-14 px-8">
                    View Demo
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">14-day free trial</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl opacity-20 blur-3xl" />
              <div className="relative rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <div className="text-sm text-slate-500">Active Routes</div>
                      <div className="text-3xl font-bold text-slate-900">247</div>
                    </div>
                    <div className="rounded-full bg-emerald-100 p-3">
                      <Route className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <div className="text-2xl font-bold text-emerald-700">89%</div>
                      <div className="text-xs text-emerald-600">On-Time</div>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4">
                      <div className="text-2xl font-bold text-blue-700">1.2k</div>
                      <div className="text-xs text-blue-600">Deliveries</div>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-4">
                      <div className="text-2xl font-bold text-purple-700">$0.12</div>
                      <div className="text-xs text-purple-600">Cost/Stop</div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    {[
                      { driver: "Sarah M.", stops: "24/32", status: "active" },
                      { driver: "Mike R.", stops: "18/28", status: "active" },
                      { driver: "Alex K.", stops: "31/31", status: "complete" }
                    ].map((d, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border bg-slate-50 p-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${d.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span className="font-medium text-sm">{d.driver}</span>
                        </div>
                        <span className="text-sm text-slate-600">{d.stops}</span>
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
      <section className="border-y bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "99.8%", label: "Uptime SLA", icon: Shield },
              { value: "<100ms", label: "API Response", icon: Zap },
              { value: "50k+", label: "Daily Deliveries", icon: Package },
              { value: "$0.08", label: "Avg Cost/Stop", icon: DollarSign }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <stat.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
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

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Package,
                title: "Smart Order Management",
                description: "CSV batch import, automatic geocoding with persistent cache, address validation, and customer email verification",
                features: ["Batch CSV import", "Auto-geocoding", "Duplicate detection", "Email validation"]
              },
              {
                icon: Route,
                title: "Intelligent Route Optimization",
                description: "Multi-algorithm optimization with cost controls. Local nearest-neighbor by default, HERE Tour Planning on-demand",
                features: ["Multi-route creation", "Geographic clustering", "Driver assignment", "Cost-aware optimization"]
              },
              {
                icon: Smartphone,
                title: "Mobile Driver App",
                description: "Native mobile experience with offline support, photo compression, digital signatures, and real-time GPS tracking",
                features: ["Turn-by-turn navigation", "Photo POD", "Digital signatures", "Offline mode"]
              },
              {
                icon: MapPinned,
                title: "Real-Time Dispatch",
                description: "Live driver tracking, route progress monitoring, exception alerts, and interactive map visualization",
                features: ["Live GPS tracking", "Route progress", "Exception alerts", "Map visualization"]
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Route metrics, driver performance, delivery success rates, cost per stop, and API usage tracking",
                features: ["Performance metrics", "Cost analytics", "Success rates", "API monitoring"]
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Multi-tenant isolation, role-based access control, audit logging, and account suspension controls",
                features: ["Multi-tenancy", "RBAC", "Audit logs", "Account controls"]
              }
            ].map((feature, i) => (
              <div key={i} className="group relative rounded-2xl border-2 border-slate-200 bg-white p-8 transition-all hover:border-emerald-300 hover:shadow-xl">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="mb-4 text-slate-600 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
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
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <Badge className="mb-4 border-emerald-400/30 bg-emerald-500/20 text-emerald-300">Cost Intelligence</Badge>
              <h2 className="text-4xl font-bold mb-6">
                API Costs Under Control
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Unlike other platforms that let API costs spiral out of control, DAMN99 treats external APIs 
                as billable infrastructure with built-in budget guards and intelligent caching.
              </p>
              <div className="space-y-4">
                {[
                  { label: "Persistent Geocode Cache", value: "95% cache hit rate" },
                  { label: "Daily Budget Caps", value: "Per-service limits" },
                  { label: "Request Rate Limiting", value: "Automatic throttling" },
                  { label: "Real-Time Cost Tracking", value: "Live dashboard" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-emerald-400">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold">Cost Analytics</h3>
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Geocoding API</span>
                    <span className="text-emerald-400">$2.34</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700">
                    <div className="h-2 w-[23%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Routing API</span>
                    <span className="text-emerald-400">$0.89</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700">
                    <div className="h-2 w-[9%] rounded-full bg-gradient-to-r from-blue-500 to-blue-400" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Tour Planning</span>
                    <span className="text-emerald-400">$0.00</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700">
                    <div className="h-2 w-[0%] rounded-full bg-gradient-to-r from-purple-500 to-purple-400" />
                  </div>
                </div>
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total (24h)</span>
                    <span className="text-2xl font-bold text-emerald-400">$3.23</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    <span className="text-emerald-400">↓ 67%</span> vs. unoptimized
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
