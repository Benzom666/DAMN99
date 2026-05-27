import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, Check, Package, Route, Radio, Users, DollarSign, Shield, Clock, MapPin, Zap, TrendingUp } from "lucide-react"
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
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DAMN99</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 mb-8">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-900">Trusted by 500+ logistics teams</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-6">
                Delivery management
                <span className="block text-emerald-500 mt-2">made simple</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Optimize routes, track in real-time, reduce costs by 40%. 
                Built for teams managing 50+ deliveries daily.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white h-14 px-8 text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-gray-300">
                    Watch Demo
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  <span>14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                <div className="space-y-6">
                  {/* Stats Header */}
                  <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Active Routes</div>
                      <div className="text-4xl font-bold text-gray-900">247</div>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
                      <Route className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Mini Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                      <div className="text-2xl font-bold text-gray-900">94%</div>
                      <div className="text-xs text-gray-600">On-Time</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <Package className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                      <div className="text-2xl font-bold text-gray-900">1.2k</div>
                      <div className="text-xs text-gray-600">Today</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                      <div className="text-2xl font-bold text-gray-900">$4.2k</div>
                      <div className="text-xs text-gray-600">Saved</div>
                    </div>
                  </div>

                  {/* Driver Progress */}
                  <div className="space-y-3">
                    {[
                      { name: "Sarah M.", progress: 85, stops: "12/15" },
                      { name: "Mike R.", progress: 60, stops: "9/15" },
                      { name: "Alex K.", progress: 100, stops: "15/15" }
                    ].map((driver, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-2">{driver.name}</div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                              style={{ width: `${driver.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-600">{driver.stops}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "40%", label: "Cost Reduction" },
              { value: "94%", label: "On-Time Delivery" },
              { value: "2.5hrs", label: "Time Saved Daily" },
              { value: "500+", label: "Happy Customers" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-emerald-500 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features to streamline your delivery operations
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div 
                key={i} 
                className="group p-8 rounded-2xl border border-gray-200 bg-white hover:shadow-xl hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
                  <feature.icon className="h-7 w-7 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes, not weeks
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden sm:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-emerald-200" style={{ top: '4rem' }} />
            
            {[
              { 
                step: "1", 
                title: "Import Orders", 
                description: "Upload your delivery list via CSV or API integration" 
              },
              { 
                step: "2", 
                title: "Optimize Routes", 
                description: "AI creates the most efficient routes automatically" 
              },
              { 
                step: "3", 
                title: "Track & Deliver", 
                description: "Drivers follow optimized routes with live updates" 
              }
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500 text-white text-4xl font-bold mb-6 shadow-lg z-10">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-500 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to optimize your deliveries?
          </h2>
          <p className="text-xl text-emerald-100 mb-10">
            Join 500+ logistics teams saving time and money with DAMN99
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full sm:w-auto bg-white text-emerald-600 hover:bg-gray-100 h-14 px-8 text-lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 h-14 px-8 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">DAMN99</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2024 DAMN99. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
