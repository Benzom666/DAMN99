"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Ban, Package } from 'lucide-react'
import Link from "next/link"
import { useRouter, useSearchParams } from 'next/navigation'
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

  const isSuspended = searchParams.get('suspended') === 'true'

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

        // Profile exists, redirect based on role
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

      const { data: { user } } = await supabase.auth.getUser()
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

      // Redirect based on role
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
      <div className="flex min-h-svh w-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">DAMN99</h1>
          <p className="text-muted-foreground mt-1">Delivery Management Platform</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuspended && (
              <Alert variant="destructive" className="mb-6">
                <Ban className="h-4 w-4" />
                <AlertDescription>
                  Your account has been suspended. Please contact support for assistance.
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full h-11 mt-2" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
