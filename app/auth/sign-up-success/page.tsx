import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth-shell"
import { Mail, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <AuthShell
      tag="OPS-PENDING"
      eyebrow="Verification queue"
      serifLine={`Confirm\nyour\nuplink.`}
      subtitle="Your tenant is provisioned. We've fired off a verification email — open it to bring your operator console online."
    >
      <div>
        <div className="mb-8">
          <span className="eyebrow-signal">Sector A · Confirmation</span>
          <h1 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight leading-tight">
            Check your{" "}
            <span className="font-serif italic font-normal text-signal">
              inbox
            </span>
            .
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            We sent a confirmation email. Click the link inside to activate
            your operator account.
          </p>
        </div>

        <div className="border border-border bg-surface px-5 py-6 rounded-sm flex items-start gap-4 mb-6">
          <div className="size-10 grid place-items-center bg-signal/15 border border-signal/40 rounded-sm flex-shrink-0">
            <Mail className="size-5 text-signal" strokeWidth={1.6} />
          </div>
          <div>
            <div className="eyebrow mb-1">Awaiting confirmation</div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              Verification typically arrives within 30 seconds. If it doesn't,
              check your spam folder or contact{" "}
              <span className="font-mono text-signal">ops@damn99</span>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { v: "01", l: "Open email" },
            { v: "02", l: "Click link" },
            { v: "03", l: "Sign in" },
          ].map((s) => (
            <div
              key={s.v}
              className="border border-border bg-card px-3 py-4 text-center rounded-sm"
            >
              <div className="font-serif italic text-2xl text-signal">
                {s.v}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                {s.l}
              </div>
            </div>
          ))}
        </div>

        <Button asChild variant="signal" size="lg" className="w-full">
          <Link href="/auth/login">
            Return to sign in
            <ArrowUpRight className="size-4" strokeWidth={2.5} />
          </Link>
        </Button>
      </div>
    </AuthShell>
  )
}
