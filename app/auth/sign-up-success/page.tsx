import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth-shell"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <AuthShell
      headline="One last step. Check your email."
      pitch="Verification typically arrives in under a minute. Click the link inside to bring your account online."
    >
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight leading-tight text-foreground">
            Check your inbox
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            We sent a confirmation email. Click the link inside to activate
            your account.
          </p>
        </div>

        <div className="soft-card p-5 flex items-start gap-4 mb-6">
          <div className="size-10 grid place-items-center bg-primary-soft rounded-full flex-shrink-0">
            <Mail className="size-5 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground mb-1">
              Awaiting confirmation
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If it doesn't arrive within a few minutes, check your spam folder
              or contact{" "}
              <span className="text-primary">support@deliveryos.com</span>.
            </p>
          </div>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href="/auth/login">Return to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
