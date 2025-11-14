import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, Zap, ArrowRight, TrendingDown, Shield } from 'lucide-react'

export const metadata = {
  title: "Pricing - Delivery OS | Better Value, Better Results",
  description: "Compare Delivery OS pricing with competitors. Get more features at lower prices with our transparent, value-driven pricing model.",
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/home" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Delivery OS</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/home">
                <Button variant="ghost" size="sm">Back to Home</Button>
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
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-6">
              <TrendingDown className="h-4 w-4" />
              Up to 40% Less Than Competitors
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Transparent Pricing, <span className="text-primary">Exceptional Value</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
              Get more features at better prices. Start with a 14-day free trial—no credit card required. Scale as you grow with flexible, affordable pricing.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              See How We Compare
            </h2>
            <p className="text-lg text-muted-foreground">
              Same features, better prices, superior support
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center p-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                      <Zap className="h-4 w-4 text-accent" />
                      <span className="font-bold text-accent">Delivery OS</span>
                    </div>
                  </th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Competitor A</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Competitor B</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Competitor C</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-accent/5">
                  <td className="p-4 font-semibold text-foreground">Starting Price/Month</td>
                  <td className="p-4 text-center">
                    <span className="text-2xl font-bold text-accent">$49</span>
                  </td>
                  <td className="p-4 text-center text-muted-foreground line-through">$79</td>
                  <td className="p-4 text-center text-muted-foreground line-through">$89</td>
                  <td className="p-4 text-center text-muted-foreground line-through">$75</td>
                </tr>
                <tr>
                  <td className="p-4 text-foreground">Route Optimization</td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-accent mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="p-4 text-foreground">Real-Time GPS Tracking</td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-accent mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="p-4 text-center text-muted-foreground">Limited</td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-foreground">Driver Management</td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-accent mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="p-4 text-center text-muted-foreground">Basic</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="p-4 text-foreground">Advanced Analytics</td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-accent mx-auto" /></td>
                  <td className="p-4 text-center text-muted-foreground">Add-on $20</td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="p-4 text-center text-muted-foreground">Add-on $15</td>
                </tr>
                <tr>
                  <td className="p-4 text-foreground">API Access</td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-accent mx-auto" /></td>
                  <td className="p-4 text-center text-muted-foreground">Add-on $30</td>
                  <td className="p-4 text-center text-muted-foreground">Enterprise Only</td>
                  <td className="p-4 text-center text-muted-foreground">Add-on $25</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="p-4 text-foreground">Mobile Apps (iOS & Android)</td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-accent mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="p-4 text-center text-muted-foreground">iOS Only</td>
                </tr>
                <tr>
                  <td className="p-4 text-foreground">24/7 Support</td>
                  <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-accent mx-auto" /></td>
                  <td className="p-4 text-center text-muted-foreground">Business Hours</td>
                  <td className="p-4 text-center text-muted-foreground">Email Only</td>
                  <td className="p-4 text-center text-muted-foreground">Business Hours</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="p-4 text-foreground">Free Trial Period</td>
                  <td className="p-4 text-center"><span className="font-bold text-accent">14 days</span></td>
                  <td className="p-4 text-center text-muted-foreground">7 days</td>
                  <td className="p-4 text-center text-muted-foreground">No trial</td>
                  <td className="p-4 text-center text-muted-foreground">7 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-muted-foreground">
              All plans include 14-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="p-8 border-border flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Starter</h3>
                <p className="text-muted-foreground">Perfect for small teams</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-foreground">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Up to 100 deliveries/month</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {[
                  "Route optimization",
                  "Real-time GPS tracking",
                  "Driver mobile app",
                  "Basic analytics",
                  "Email support",
                  "API access",
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full" variant="outline">
                  Start Free Trial
                </Button>
              </Link>
            </Card>

            {/* Professional Plan */}
            <Card className="p-8 border-2 border-accent shadow-xl flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Professional</h3>
                <p className="text-muted-foreground">For growing businesses</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-foreground">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Up to 500 deliveries/month</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {[
                  "Everything in Starter",
                  "Advanced route optimization",
                  "Automated dispatch",
                  "Advanced analytics & reports",
                  "Priority support (24/7)",
                  "Custom integrations",
                  "Multi-user access",
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full bg-accent hover:bg-accent/90">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>

            {/* Enterprise Plan */}
            <Card className="p-8 border-border flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
                <p className="text-muted-foreground">For large operations</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-foreground">$299</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Unlimited deliveries</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
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
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Delivery OS Offers Better Value
              </h2>
              <p className="text-lg text-muted-foreground">
                We believe in transparent pricing with no hidden fees
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
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
                <div key={index} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "Is the 14-day trial really free?",
                  a: "Yes! No credit card required, no commitments. Get full access to all features for 14 days. Cancel anytime.",
                },
                {
                  q: "Can I change plans later?",
                  a: "Absolutely. Upgrade or downgrade anytime. Changes take effect on your next billing cycle with prorated adjustments.",
                },
                {
                  q: "What happens if I exceed my delivery limit?",
                  a: "We'll notify you before you hit the limit. You can upgrade your plan or purchase additional delivery credits at discounted rates.",
                },
                {
                  q: "Do you offer annual discounts?",
                  a: "Yes! Save 20% when you pay annually. Contact our sales team for custom pricing on multi-year contracts.",
                },
              ].map((faq, index) => (
                <Card key={index} className="p-6 border-border">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              Start Your Free 14-Day Trial Today
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90 text-pretty">
              No credit card required. Full access to all features. Cancel anytime. Join 1,000+ businesses transforming their delivery operations.
            </p>
            <Link href="/auth/login">
              <Button size="lg" variant="secondary" className="text-lg h-12 px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/home" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Delivery OS</span>
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
