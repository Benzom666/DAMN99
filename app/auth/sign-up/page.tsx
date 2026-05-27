"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AuthShell } from "@/components/auth-shell"
import { ArrowUpRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [role, setRole] = useState<"admin" | "driver">("admin")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}`,
          data: {
            role,
            display_name: displayName,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      tag="OPS-NEW"
      eyebrow="Tenant initiation"
      serifLine={`Open a\nnew\nterminal.`}
      subtitle="Spin up a tenant in 90 seconds. No sales call, no contract, no card. We'll get you running before your coffee gets cold."
      footer={
        <span>
          By creating an account you accept the operator agreement &nbsp;◆&nbsp; v1.0
        </span>
      }
    >
      <div>
        <div className="mb-8">
          <span className="eyebrow-signal">Sector A · Onboarding</span>
          <h1 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight leading-tight">
            Create your{" "}
            <span className="font-serif italic font-normal text-signal">
              operator
            </span>
            .
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            One account. One tenant. Routes start the moment you log in.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              type="text"
              placeholder="Marisol Reyes"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Operator email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@operator.co"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
              Min 8 characters · stored encrypted
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value: "admin" | "driver") => setRole(value)}
            >
              <SelectTrigger id="role" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin · Dispatch operator</SelectItem>
                <SelectItem value="driver">Driver · Field operator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            variant="signal"
            size="lg"
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Provisioning tenant…
              </>
            ) : (
              <>
                Initiate operator
                <ArrowUpRight className="size-4" strokeWidth={2.5} />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already running?{" "}
            <Link
              href="/auth/login"
              className="font-mono text-[12px] uppercase tracking-[0.14em] text-signal hover:underline underline-offset-4"
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  )
}
