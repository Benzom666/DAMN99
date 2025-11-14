import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, MapPin, TrendingUp, Users, Zap, CheckCircle, BarChart3, Clock, Shield, Smartphone } from 'lucide-react'

export const metadata = {
  title: "Delivery OS - Advanced Logistics Management Platform",
  description: "Transform your delivery operations with AI-powered route optimization, real-time tracking, and intelligent driver management. Start your 14-day free trial today.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Delivery OS</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/home/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Customers
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link href="/auth/login">
                <Button size="sm" className="bg-accent hover:bg-accent/90">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-20 pb-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Zap className="h-4 w-4" />
              14-Day Free Trial • No Credit Card Required
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 text-balance">
              The Complete Platform for{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Modern Logistics
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty leading-relaxed">
              Transform your delivery operations with AI-powered route optimization, real-time tracking, and intelligent driver management. Built for teams that demand excellence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/login">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg h-12 px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg h-12 px-8">
                  Explore Features
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Join 1,000+ companies optimizing their delivery operations
            </p>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-16 mx-auto max-w-6xl">
            <div className="relative rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 flex items-center justify-center">
                <img
                  src="/modern-logistics-dashboard-with-route-maps-and-del.jpg"
                  alt="Delivery OS Dashboard"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "45%", label: "Faster Deliveries" },
              { value: "30%", label: "Cost Reduction" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "24/7", label: "Support Available" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Powerful features designed to streamline your logistics operations and delight your customers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: "AI-Powered Route Optimization",
                description: "Automatically calculate the most efficient delivery routes considering traffic, weather, and delivery windows. Save fuel costs and time with intelligent routing algorithms.",
              },
              {
                icon: Smartphone,
                title: "Real-Time GPS Tracking",
                description: "Monitor your entire fleet in real-time with live GPS tracking. Provide customers with accurate ETAs and maintain complete visibility over all deliveries.",
              },
              {
                icon: Users,
                title: "Driver Management Suite",
                description: "Comprehensive tools for managing your delivery team. Track performance metrics, assign deliveries intelligently, and communicate seamlessly with drivers.",
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics Dashboard",
                description: "Gain actionable insights with detailed analytics on delivery performance, driver efficiency, customer satisfaction, and operational costs.",
              },
              {
                icon: Clock,
                title: "Automated Dispatch System",
                description: "Intelligent order assignment based on driver location, capacity, and availability. Reduce manual work and optimize your dispatch operations.",
              },
              {
                icon: Shield,
                title: "Enterprise-Grade Security",
                description: "Bank-level encryption, SOC 2 compliance, and role-based access control. Your data is protected with industry-leading security measures.",
              },
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-border">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
                Deliver Excellence at Scale
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Delivery OS combines cutting-edge technology with intuitive design to help you manage thousands of deliveries effortlessly. Built for businesses that refuse to compromise on quality.
              </p>
              <div className="space-y-4">
                {[
                  "Reduce operational costs by up to 30%",
                  "Improve on-time delivery rates to 99%+",
                  "Scale from 10 to 10,000 deliveries seamlessly",
                  "Integrate with your existing systems in minutes",
                  "Provide exceptional customer experience",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link href="/auth/login" className="inline-block mt-8">
                <Button size="lg" className="bg-accent hover:bg-accent/90">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <img
                  src="/delivery-truck-route-optimization-map-interface.jpg"
                  alt="Route Optimization"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="testimonials" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground">
              See how companies are transforming their delivery operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Delivery OS reduced our delivery times by 40% in the first month. The route optimization alone paid for itself.",
                author: "Sarah Chen",
                role: "Operations Director",
                company: "FastTrack Logistics",
              },
              {
                quote: "The real-time tracking and analytics give us complete control. Our customers love the transparency and accuracy.",
                author: "Michael Rodriguez",
                role: "Fleet Manager",
                company: "Urban Delivery Co",
              },
              {
                quote: "Switching to Delivery OS was the best decision we made. The platform is intuitive and the support team is outstanding.",
                author: "Jessica Williams",
                role: "CEO",
                company: "QuickShip Express",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="p-6 border-border">
                <div className="flex flex-col h-full">
                  <p className="text-foreground mb-6 leading-relaxed flex-grow">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              Ready to Transform Your Delivery Operations?
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90 text-pretty leading-relaxed">
              Join thousands of businesses using Delivery OS to streamline logistics and delight customers. Start your 14-day free trial today—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/login">
                <Button size="lg" variant="secondary" className="text-lg h-12 px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/home/pricing">
                <Button size="lg" variant="outline" className="text-lg h-12 px-8 border-primary-foreground/20 bg-transparent hover:bg-primary-foreground/10 text-primary-foreground">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm mt-6 text-primary-foreground/80">
              Questions? Contact our sales team at sales@deliveryos.com
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">Delivery OS</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete logistics platform for modern delivery businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/home/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/auth/login" className="hover:text-foreground transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 Delivery OS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
