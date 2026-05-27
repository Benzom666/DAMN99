import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, Check, Package, Route, Radio, TrendingDown, Zap, Shield, Clock, DollarSign, MapPin, Users } from "lucide-react"
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
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">DAMN99</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm" className="sm:px-6">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-primary/5 border-primary/20 mb-6">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs sm:text-sm font-medium">Trusted by 500+ logistics teams</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Delivery management
                <span className="block text-primary mt-2">made simple</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                Optimize routes, track deliveries in real-time, and reduce costs by 40%. 
                Built for teams managing 50+ deliveries daily.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/auth/sign-up" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                    See How It Works
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-3xl" />
              <div className="relative rounded-2xl border bg-card p-4 sm:p-6 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Active Routes</div>
                      <div className="text-3xl sm:text-4xl font-bold">247</div>
                    </div>
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Route className="h-8 w-8 text-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "On-Time", value: "94%", icon: Clock },
                      { label: "Deliveries", value: "1.2k", icon: Package },
                      { label: "Saved", value: "$4.2k", icon: DollarSign }
                    ].map((stat, i) => (
                      <div key={i} className="rounded-lg border bg-muted/50 p-3 text-center">
                        <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                        <div className="text-lg sm:text-xl font-bold">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: "Sarah M.", progress: 85, stops: "12/15" },
                      { name: "Mike R.", progress: 60, stops: "9/15" },
                      { name: "Alex K.", progress: 100, stops: "15/15" }
                    ].map((driver, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium mb-1.5">{driver.name}</div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${driver.progress}%` }} />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">{driver.stops}</div>
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
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: "40%", label: "Cost Reduction" },
              { value: "94%", label: "On-Time Delivery" },
              { value: "2.5hrs", label: "Time Saved Daily" },
              { value: "500+", label: "Happy Customers" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm sm:text-base text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Everything you need</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features to streamline your delivery operations
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Route,
                title: "Smart Route Optimization",
                description: "AI-powered routing saves time and fuel. Optimize 100+ stops in seconds."
              },
              {
                icon: Radio,
                title: "Real-Time Tracking",
                description: "Live GPS tracking and ETA updates. Know exactly where every delivery is."
              },
              {
                icon: Package,
                title: "Proof of Delivery",
                description: "Digital signatures, photos, and notes. Complete delivery documentation."
              },
              {
                icon: Users,
                title: "Driver Management",
                description: "Assign routes, track performance, and manage your entire fleet."
              },
              {
                icon: DollarSign,
                title: "Cost Control",
                description: "Track API costs, monitor usage, and optimize spending automatically."
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level encryption, role-based access, and audit logs."
              }
            ].map((feature, i) => (
              <div key={i} className="group relative">
                <div className="absolute -inset-px bg-gradient-to-b from-primary/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full rounded-2xl border bg-card p-6 sm:p-8 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">How it works</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes, not weeks
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              { step: "1", title: "Import Orders", description: "Upload your delivery list via CSV or API integration" },
              { step: "2", title: "Optimize Routes", description: "AI creates the most efficient routes automatically" },
              { step: "3", title: "Track & Deliver", description: "Drivers follow optimized routes with live updates" }
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                {i < 2 && (
                  <div className="hidden sm:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
                )}
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground text-3xl font-bold mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="relative rounded-3xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 sm:p-12 lg:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Ready to optimize your deliveries?
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join 500+ logistics teams saving time and money with DAMN99
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Link href="/auth/sign-up" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">DAMN99</span>
            </div>
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © 2024 DAMN99. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
