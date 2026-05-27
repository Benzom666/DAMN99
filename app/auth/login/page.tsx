"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AuthShell } from "@/components/auth-shell"
import { Ban, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect } from "react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const isSuspended = searchParams.get("suspended") === "true"

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        if (!profile) {
          router.replace("/auth/complete-profile")
          return
        }

        if (profile.role === "super_admin") {
          router.replace("/super-admin")
        } else if (profile.role === "admin") {
          router.replace("/admin")
        } else {
          router.replace("/driver")
        }
        return
      }

      setIsChecking(false)
    }
    checkUser()
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Login failed")

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (!profile) {
        router.replace("/auth/complete-profile")
        return
      }

      if (profile.role === "super_admin") {
        router.replace("/super-admin")
      } else if (profile.role === "admin") {
        router.replace("/admin")
      } else {
        router.replace("/driver")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Checking session…</span>
        </div>
      </div>
    )
  }

  return (
    <AuthShell
      headline="Welcome back. Routes are still moving."
      pitch="Resume your dispatch session and pick up where you left off."
      footer={<span>By signing in you accept the terms of service.</span>}
    >
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight leading-tight text-foreground">
            Sign in to Delivery OS
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your credentials to access your dashboard.
          </p>
        </div>

        {isSuspended && (
          <Alert variant="destructive" className="mb-6">
            <Ban className="size-4" />
            <AlertTitle>Account suspended</AlertTitle>
            <AlertDescription>
              Your account has been suspended. Contact support@deliveryos.com
              to reinstate access.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            New to Delivery OS?{" "}
            <Link
              href="/auth/sign-up"
              className="text-primary hover:underline underline-offset-4 font-medium"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center bg-background text-muted-foreground">
          <div className="flex items-center gap-3 text-sm">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Loading…</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
