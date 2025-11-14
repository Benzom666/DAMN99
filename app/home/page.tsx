'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, MapPin, TrendingUp, BarChart3, Zap, Shield, Smartphone, CheckCircle, Clock, Star } from 'lucide-react'
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata = {
  title: "Delivery OS - Unified Logistics Platform",
  description: "Unlock unequalled business performance with real-time insights, automation, and intelligent delivery management. Join the logistics revolution.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground tracking-tight">Delivery OS</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a 
                href="#features" 
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Platform
              </a>
              <Link href="/home/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <a 
                href="#testimonials"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Customers
              </a>
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-foreground">Log In</Button>
              </Link>
              <Link href="/auth/login">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-40">
        <div className="absolute inset-0 bg-gradient-to-b from-primary via-background to-background"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="container relative mx-auto px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-5 py-2 text-sm font-semibold text-accent mb-8 backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              14-Day Free Trial • No Credit Card
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-foreground mb-8 text-balance leading-[0.95]">
              Unified Logistics{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-accent">
                Platform
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-balance leading-relaxed">
              Unlock unequalled business performance with real-time insights, automation, an expanding marketplace, and intelligent delivery management. Join the logistics revolution in the making.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/auth/login">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg h-14 px-10 font-semibold">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg h-14 px-10 border-border/50 font-semibold"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore the Product
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-20 border-y border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { value: "98%", label: "faster time to market", logo: "Netflix" },
              { value: "45%", label: "saved on daily operations", logo: "Spotify" },
              { value: "300%", label: "increase in efficiency", logo: "Uber" },
              { value: "6x", label: "faster to deploy", logo: "Airbnb" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-foreground mb-3">{stat.value}</div>
                <div className="text-sm text-muted-foreground mb-4">{stat.label}</div>
                <div className="text-xs font-semibold text-primary">{stat.logo}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance tracking-tight">
              The complete platform <br />to build the web.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              Your team's toolkit to stop configuring and start innovating. Securely build, deploy, and scale the best delivery experiences with Delivery OS.
            </p>
          </div>

          {/* Hero Visual */}
          <div className="mx-auto max-w-7xl mb-20">
            <div className="relative rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden">
              <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center">
                <img
                  src="/modern-logistics-dashboard-with-route-maps-and-del.jpg"
                  alt="Delivery OS Platform"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-gradient-to-b from-background via-card/30 to-background">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="sticky top-32">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-6">
                <Zap className="h-4 w-4" />
                Collaboration
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8 text-balance tracking-tight leading-tight">
                Faster iteration. More innovation.
              </h2>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
                The platform for rapid progress. Let your team focus on shipping features instead of managing infrastructure with automated CI/CD, built-in testing, and integrated collaboration.
              </p>
              <div className="aspect-video rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden">
                <img
                  src="/delivery-truck-route-optimization-map-interface.jpg"
                  alt="Route Optimization"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: MapPin,
                  title: "AI-Powered Route Optimization",
                  description: "Automatically calculate the most efficient delivery routes considering real-time traffic, weather conditions, and dynamic delivery windows. Save up to 40% on fuel costs with intelligent routing algorithms that continuously learn and adapt.",
                },
                {
                  icon: Smartphone,
                  title: "Real-Time GPS Tracking",
                  description: "Monitor your entire fleet in real-time with military-grade GPS tracking. Provide customers with accurate ETAs down to the minute and maintain complete visibility over all deliveries with live updates and geofencing capabilities.",
                },
                {
                  icon: BarChart3,
                  title: "Advanced Analytics Dashboard",
                  description: "Gain actionable insights with detailed analytics on delivery performance, driver efficiency, customer satisfaction scores, and operational costs. Make data-driven decisions with predictive analytics and custom reporting.",
                },
                {
                  icon: Clock,
                  title: "Automated Dispatch System",
                  description: "Intelligent order assignment based on driver location, vehicle capacity, current workload, and skill level. Reduce manual work by 90% and optimize your dispatch operations with machine learning algorithms.",
                },
                {
                  icon: Shield,
                  title: "Enterprise-Grade Security",
                  description: "Bank-level 256-bit encryption, SOC 2 Type II compliance, and granular role-based access control. Your data is protected with industry-leading security measures including end-to-end encryption and regular security audits.",
                },
                {
                  icon: TrendingUp,
                  title: "Scalable Infrastructure",
                  description: "Built on cloud-native architecture that scales automatically from 10 to 10,000 deliveries seamlessly. 99.99% uptime SLA with automatic failover, load balancing, and zero-downtime deployments.",
                },
              ].map((feature, index) => (
                <Card key={index} className="p-8 hover:shadow-2xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm group">
                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-foreground mb-3">{feature.title}</h3>
                      <p className="text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-32">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Make teamwork seamless.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tools for your team and stakeholders to share feedback and iterate faster.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Delivery OS reduced our delivery times by 45% in the first month. The route optimization alone paid for itself within two weeks. Game-changing platform.",
                author: "Sarah Chen",
                role: "VP of Operations",
                company: "FastTrack Logistics",
                rating: 5,
              },
              {
                quote: "The real-time tracking and analytics give us complete control. Our customers love the transparency and accuracy. Customer satisfaction scores increased by 40%.",
                author: "Michael Rodriguez",
                role: "Fleet Manager",
                company: "Urban Delivery Co",
                rating: 5,
              },
              {
                quote: "Switching to Delivery OS was the best decision we made. The platform is intuitive, the support team is outstanding, and the ROI was immediate.",
                author: "Jessica Williams",
                role: "CEO",
                company: "QuickShip Express",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="p-8 border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground mb-8 leading-relaxed text-lg">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{testimonial.author[0]}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-base">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="container relative mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-balance text-white tracking-tight">
              The fastest and most powerful platform for delivery operations
            </h2>
            <p className="text-xl mb-12 text-white/90 text-balance leading-relaxed max-w-2xl mx-auto">
              Build transformative delivery experiences powered by industry-leading automation and tools. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/auth/login">
                <Button size="lg" variant="secondary" className="text-lg h-14 px-10 font-semibold">
                  Start Building
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/home/pricing">
                <Button size="lg" variant="outline" className="text-lg h-14 px-10 border-white/30 bg-transparent hover:bg-white/10 text-white font-semibold">
                  View API Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm py-16">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground tracking-tight">Delivery OS</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The complete logistics platform for modern delivery businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-5">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a 
                    href="#features"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    Platform Overview
                  </a>
                </li>
                <li><Link href="/home/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/auth/login" className="hover:text-foreground transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-5">Company</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Developer Forum</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-5">Legal</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            © 2025 Delivery OS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
