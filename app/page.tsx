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
      <nav className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-8 py-6 flex items-center justify-between">
          <div className="text-2xl font-medium tracking-tight">DAMN99</div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="font-normal">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-neutral-900 hover:bg-neutral-800 font-normal">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-8 py-32">
          <div className="max-w-[800px]">
            <h1 className="text-[72px] font-medium leading-[0.95] tracking-tight mb-8">
              Delivery operations<br />without chaos
            </h1>
            <p className="text-xl text-neutral-600 leading-relaxed mb-12 max-w-[600px]">
              Route optimization, real-time tracking, and cost-controlled APIs. 
              Built for logistics teams managing 50+ deliveries daily.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="bg-neutral-900 hover:bg-neutral-800 h-14 px-8 font-normal">
                  Start 14-Day Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="h-14 px-8 font-normal border-neutral-300">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-8 py-20">
          <div className="grid grid-cols-4 gap-16">
            {[
              { value: "99.8%", label: "Uptime" },
              { value: "<100ms", label: "Response" },
              { value: "50k+", label: "Daily Deliveries" },
              { value: "$0.08", label: "Cost/Stop" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-5xl font-medium tracking-tight mb-2">{stat.value}</div>
                <div className="text-neutral-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-8 py-32">
          <div className="mb-20">
            <h2 className="text-5xl font-medium tracking-tight mb-6">Complete platform</h2>
            <p className="text-xl text-neutral-600 max-w-[600px]">
              From CSV import to proof of delivery. Every feature built for operational efficiency.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-px bg-neutral-200">
            {[
              {
                title: "Order Management",
                description: "CSV batch import with automatic geocoding, persistent cache, and address validation.",
                features: ["Batch import", "Auto-geocoding", "Duplicate detection", "Email validation"]
              },
              {
                title: "Route Optimization",
                description: "Multi-algorithm optimization with cost controls. Local by default, HERE on-demand.",
                features: ["Multi-route creation", "Geographic clustering", "Driver assignment", "Cost-aware"]
              },
              {
                title: "Mobile Driver App",
                description: "Offline support, photo compression, digital signatures, and real-time GPS tracking.",
                features: ["Turn-by-turn", "Photo POD", "Signatures", "Offline mode"]
              },
              {
                title: "Real-Time Dispatch",
                description: "Live driver tracking, route progress monitoring, and exception alerts.",
                features: ["Live GPS", "Progress tracking", "Exception alerts", "Map view"]
              },
              {
                title: "Analytics",
                description: "Route metrics, driver performance, success rates, and cost per stop tracking.",
                features: ["Performance metrics", "Cost analytics", "Success rates", "API monitoring"]
              },
              {
                title: "Enterprise Security",
                description: "Multi-tenant isolation, role-based access, audit logging, and account controls.",
                features: ["Multi-tenancy", "RBAC", "Audit logs", "Suspensions"]
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-12">
                <h3 className="text-2xl font-medium tracking-tight mb-4">{feature.title}</h3>
                <p className="text-neutral-600 mb-8 leading-relaxed">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-neutral-700">
                      <Check className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Control */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-8 py-32">
          <div className="grid grid-cols-2 gap-24">
            <div>
              <h2 className="text-5xl font-medium tracking-tight mb-8">API costs under control</h2>
              <p className="text-xl text-neutral-600 leading-relaxed mb-12">
                Built-in budget guards, persistent caching, and real-time cost tracking. 
                External APIs treated as billable infrastructure.
              </p>
              <div className="space-y-4">
                {[
                  { label: "Persistent Cache", value: "95% hit rate" },
                  { label: "Budget Caps", value: "Per-service" },
                  { label: "Rate Limiting", value: "Automatic" },
                  { label: "Cost Tracking", value: "Real-time" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-neutral-200">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-neutral-600">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-neutral-200 p-12">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-medium tracking-tight">24h Cost</h3>
                <div className="text-4xl font-medium tracking-tight">$3.23</div>
              </div>
              <div className="space-y-8">
                {[
                  { label: "Geocoding", value: "$2.34", pct: 72 },
                  { label: "Routing", value: "$0.89", pct: 28 },
                  { label: "Tour Planning", value: "$0.00", pct: 0 }
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-neutral-600">{item.label}</span>
                      <span className="font-mono text-sm">{item.value}</span>
                    </div>
                    <div className="h-1 bg-neutral-100">
                      <div className="h-1 bg-neutral-900" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 pt-8 border-t border-neutral-200">
                <div className="text-sm text-neutral-600">
                  <span className="text-neutral-900 font-medium">↓ 67%</span> vs. unoptimized
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Super Admin */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-8 py-32">
          <div className="mb-20">
            <h2 className="text-5xl font-medium tracking-tight mb-6">Enterprise control</h2>
            <p className="text-xl text-neutral-600 max-w-[600px]">
              Multi-tenant management, global visibility, and system-wide controls.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-px bg-neutral-200">
            {[
              { title: "Admin Management", desc: "Create, suspend, manage tenant accounts" },
              { title: "Global Visibility", desc: "View all orders, routes, drivers" },
              { title: "Audit Logging", desc: "Track all system changes" },
              { title: "System Health", desc: "Monitor performance, uptime" }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8">
                <h3 className="text-lg font-medium mb-3">{item.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-8 py-32">
          <div className="max-w-[700px]">
            <h2 className="text-5xl font-medium tracking-tight mb-8">
              Ready to scale delivery operations?
            </h2>
            <p className="text-xl text-neutral-600 mb-12 leading-relaxed">
              14-day free trial. No credit card required.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="bg-neutral-900 hover:bg-neutral-800 h-14 px-8 font-normal">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="h-14 px-8 font-normal border-neutral-300">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-50">
        <div className="mx-auto max-w-[1400px] px-8 py-16">
          <div className="grid grid-cols-4 gap-16">
            <div>
              <div className="text-xl font-medium mb-4">DAMN99</div>
              <p className="text-sm text-neutral-600">Enterprise delivery management platform.</p>
            </div>
            <div>
              <div className="font-medium mb-4">Product</div>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link href="#" className="hover:text-neutral-900">Features</Link></li>
                <li><Link href="#" className="hover:text-neutral-900">Pricing</Link></li>
                <li><Link href="#" className="hover:text-neutral-900">API</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-4">Company</div>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link href="#" className="hover:text-neutral-900">About</Link></li>
                <li><Link href="#" className="hover:text-neutral-900">Blog</Link></li>
                <li><Link href="#" className="hover:text-neutral-900">Careers</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-4">Legal</div>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link href="#" className="hover:text-neutral-900">Privacy</Link></li>
                <li><Link href="#" className="hover:text-neutral-900">Terms</Link></li>
                <li><Link href="#" className="hover:text-neutral-900">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-neutral-200 text-sm text-neutral-600">
            © 2026 DAMN99. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
