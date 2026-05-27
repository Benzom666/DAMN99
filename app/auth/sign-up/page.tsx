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
import { Loader2 } from "lucide-react"
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
      headline="Modern logistics, ready in 90 seconds."
      pitch="Spin up a tenant, import your first manifest, and dispatch your first route — all without a sales call."
      footer={<span>By creating an account you accept the terms of service.</span>}
    >
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight leading-tight text-foreground">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            One account. One tenant. Routes start the moment you log in.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="display-name">Full name</Label>
            <Input
              id="display-name"
              type="text"
              placeholder="Jane Doe"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Work email</Label>
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
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters · stored encrypted
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value: "admin" | "driver") => setRole(value)}
            >
              <SelectTrigger id="role" className="h-11 rounded-xl">
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
            size="lg"
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary hover:underline underline-offset-4 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  )
}
