import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, Zap, ArrowRight, TrendingDown, Shield, X } from 'lucide-react'

export const metadata = {
  title: "Pricing - Delivery OS | Better Value, Better Results",
  description: "Compare Delivery OS pricing with competitors. Get more features at lower prices with our transparent, value-driven pricing model.",
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/home" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground tracking-tight">Delivery OS</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/home">
                <Button variant="ghost" size="sm" className="text-foreground">Back to Home</Button>
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
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background"></div>
        <div className="container relative mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-5 py-2 text-sm font-semibold text-accent mb-8 backdrop-blur-sm">
              <TrendingDown className="h-4 w-4" />
              Up to 40% Less Than Competitors
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-8 text-balance tracking-tighter">
              Pricing
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-balance leading-relaxed">
              Get more features at better prices. Start with a 14-day free trial—no credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Starter Plan */}
            <Card className="p-10 border-border/50 bg-card/50 backdrop-blur-sm flex flex-col hover:shadow-2xl transition-shadow">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-foreground mb-3">Starter</h3>
                <p className="text-muted-foreground text-base">Perfect for small teams</p>
              </div>
              <div className="mb-10">
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold text-foreground">$49</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">Up to 100 deliveries/month</p>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Route optimization",
                  "Real-time GPS tracking",
                  "Driver mobile app",
                  "Basic analytics",
                  "Email support",
                  "API access",
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full h-12 text-base font-semibold" variant="outline">
                  Start Free Trial
                </Button>
              </Link>
            </Card>

            {/* Professional Plan */}
            <Card className="p-10 border-2 border-accent shadow-2xl flex flex-col relative bg-card/80 backdrop-blur-sm scale-105">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-6 py-2 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-foreground mb-3">Professional</h3>
                <p className="text-muted-foreground text-base">For growing businesses</p>
              </div>
              <div className="mb-10">
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold text-foreground">$99</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">Up to 500 deliveries/month</p>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Everything in Starter",
                  "Advanced route optimization",
                  "Automated dispatch",
                  "Advanced analytics & reports",
                  "Priority support (24/7)",
                  "Custom integrations",
                  "Multi-user access",
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full h-12 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>

            {/* Enterprise Plan */}
            <Card className="p-10 border-border/50 bg-card/50 backdrop-blur-sm flex flex-col hover:shadow-2xl transition-shadow">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-foreground mb-3">Enterprise</h3>
                <p className="text-muted-foreground text-base">For large operations</p>
              </div>
              <div className="mb-10">
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold text-foreground">$299</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">Unlimited deliveries</p>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Everything in Professional",
                  "Dedicated account manager",
                  "Custom development",
                  "SLA guarantees",
                  "Advanced security features",
                  "White-label options",
                  "Training & onboarding",
                  "Custom contracts",
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full h-12 text-base font-semibold" variant="outline">
                  Contact Sales
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-28 bg-gradient-to-b from-background via-card/30 to-background">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5 tracking-tight">
              See How We Compare
            </h2>
            <p className="text-xl text-muted-foreground">
              Same features, better prices, superior support
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border/50">
                  <th className="text-left p-6 font-bold text-foreground text-lg">Feature</th>
                  <th className="text-center p-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30">
                      <Zap className="h-5 w-5 text-accent" />
                      <span className="font-bold text-accent text-base">Delivery OS</span>
                    </div>
                  </th>
                  <th className="text-center p-6 font-semibold text-muted-foreground">Competitor A</th>
                  <th className="text-center p-6 font-semibold text-muted-foreground">Competitor B</th>
                  <th className="text-center p-6 font-semibold text-muted-foreground">Competitor C</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr className="bg-accent/5">
                  <td className="p-6 font-bold text-foreground text-base">Starting Price/Month</td>
                  <td className="p-6 text-center">
                    <span className="text-3xl font-bold text-accent">$49</span>
                  </td>
                  <td className="p-6 text-center text-muted-foreground line-through text-lg">$79</td>
                  <td className="p-6 text-center text-muted-foreground line-through text-lg">$89</td>
                  <td className="p-6 text-center text-muted-foreground line-through text-lg">$75</td>
                </tr>
                <tr>
                  <td className="p-6 text-foreground">Route Optimization</td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-accent mx-auto" /></td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-muted-foreground mx-auto" /></td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-muted-foreground mx-auto" /></td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-muted-foreground mx-auto" /></td>
                </tr>
                <tr className="bg-card/30">
                  <td className="p-6 text-foreground">Real-Time GPS Tracking</td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-accent mx-auto" /></td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-muted-foreground mx-auto" /></td>
                  <td className="p-6 text-center text-muted-foreground">Limited</td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-muted-foreground mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-6 text-foreground">Advanced Analytics</td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-accent mx-auto" /></td>
                  <td className="p-6 text-center text-muted-foreground">Add-on $20</td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-muted-foreground mx-auto" /></td>
                  <td className="p-6 text-center text-muted-foreground">Add-on $15</td>
                </tr>
                <tr className="bg-card/30">
                  <td className="p-6 text-foreground">API Access</td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-accent mx-auto" /></td>
                  <td className="p-6 text-center text-muted-foreground">Add-on $30</td>
                  <td className="p-6 text-center text-muted-foreground">Enterprise Only</td>
                  <td className="p-6 text-center text-muted-foreground">Add-on $25</td>
                </tr>
                <tr>
                  <td className="p-6 text-foreground">24/7 Support</td>
                  <td className="p-6 text-center"><CheckCircle className="h-6 w-6 text-accent mx-auto" /></td>
                  <td className="p-6 text-center text-muted-foreground">Business Hours</td>
                  <td className="p-6 text-center"><X className="h-6 w-6 text-muted-foreground/30 mx-auto" /></td>
                  <td className="p-6 text-center text-muted-foreground">Business Hours</td>
                </tr>
                <tr className="bg-card/30">
                  <td className="p-6 text-foreground">Free Trial Period</td>
                  <td className="p-6 text-center"><span className="font-bold text-accent text-lg">14 days</span></td>
                  <td className="p-6 text-center text-muted-foreground">7 days</td>
                  <td className="p-6 text-center text-muted-foreground">No trial</td>
                  <td className="p-6 text-center text-muted-foreground">7 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-28">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5 tracking-tight">
                Why Delivery OS Offers Better Value
              </h2>
              <p className="text-xl text-muted-foreground">
                Transparent pricing with no hidden fees
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              {[
                {
                  icon: Shield,
                  title: "No Hidden Fees",
                  description: "What you see is what you pay. No surprise charges, no usage caps, no fee increases after your trial ends.",
                },
                {
                  icon: TrendingDown,
                  title: "Volume Discounts",
                  description: "The more you grow, the less you pay per delivery. Our pricing scales down as your business scales up.",
                },
                {
                  icon: Zap,
                  title: "All Features Included",
                  description: "Every plan includes API access, mobile apps, and core features. No expensive add-ons required.",
                },
                {
                  icon: CheckCircle,
                  title: "14-Day Free Trial",
                  description: "Twice as long as most competitors. Test everything with real deliveries before committing a single dollar.",
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-foreground mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="container relative mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-balance text-white tracking-tight">
              Start Your Free 14-Day Trial Today
            </h2>
            <p className="text-xl mb-12 text-white/90 text-balance">
              No credit card required. Full access to all features. Cancel anytime.
            </p>
            <Link href="/auth/login">
              <Button size="lg" variant="secondary" className="text-lg h-14 px-10 font-semibold">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm py-16">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/home" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">Delivery OS</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © 2025 Delivery OS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
