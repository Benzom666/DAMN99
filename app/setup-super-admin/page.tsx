"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from "react"

export default function SetupSuperAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [needsLogin, setNeedsLogin] = useState(false)
  const [superAdminExists, setSuperAdminExists] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkSuperAdmin() {
      try {
        const response = await fetch("/api/setup-super-admin/check")
        const data = await response.json()
        setSuperAdminExists(data.exists)
        
        // If super admin exists, show message
        if (data.exists) {
          setError("A super admin has already been configured. Only the super admin can access this page.")
        }
      } catch (err) {
        console.error("Failed to check super admin status:", err)
      }
    }
    
    checkSuperAdmin()
  }, [])

  const handleSetup = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/setup-super-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to setup super admin")
      }

      setSuccess(data.message)
      setNeedsLogin(data.needsLogin)

      // Redirect to login after 3 seconds if needs login
      if (data.needsLogin) {
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (superAdminExists === true) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldOff className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-2xl">Setup Not Available</CardTitle>
                  <CardDescription>Super admin already configured</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium mb-2">Access Restricted</p>
                <p className="text-muted-foreground">
                  A super admin has already been set up for this system. This setup page is now locked
                  to prevent unauthorized privilege escalation.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-sm bg-warning-soft border border-warning/30 p-3 text-sm text-warning">
                <AlertCircle className="size-4 flex-shrink-0" />
                <p>Only the existing super admin can access this page.</p>
              </div>

              <Button onClick={() => router.push("/auth/login")} className="w-full" variant="outline">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background relative">
      <div className="pointer-events-none fixed inset-0 bg-grid-paper-fine opacity-25 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="absolute top-0 left-0 right-0 h-1 hazard-stripe opacity-80" />
      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-between mb-4">
          <a href="/" className="flex items-center gap-2.5">
            <div className="size-7 grid place-items-center bg-destructive text-destructive-foreground font-mono text-[11px] font-bold rounded-[2px]">99</div>
            <span className="font-mono text-xs font-semibold tracking-[0.18em]">
              DAMN<span className="font-serif italic text-destructive ml-1">ninety-nine</span>
            </span>
          </a>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-destructive border border-destructive/40 px-2 py-1 rounded-[2px]">
            BOOT · SUPER
          </span>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 grid place-items-center bg-destructive/15 border border-destructive/40 rounded-sm flex-shrink-0">
                <ShieldCheck className="size-5 text-destructive" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle className="text-2xl tracking-tight">
                  Sovereign <span className="font-serif italic font-normal text-destructive">activation</span>
                </CardTitle>
                <CardDescription>Activate your super admin privileges.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">What this does:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Verifies your email matches the configured super admin</li>
                <li>Grants you super admin privileges</li>
                <li>Enables access to the super admin dashboard</li>
                <li>Allows management of all system users</li>
              </ul>
            </div>

            {!success && superAdminExists === false && (
              <div className="space-y-2">
                <Label htmlFor="email">Super Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  This must match the SUPER_ADMIN_EMAIL environment variable ({process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "not set"})
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex flex-col gap-2 rounded-sm bg-success-soft border border-success/30 p-3 text-sm text-success">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 flex-shrink-0" />
                  <p>{success}</p>
                </div>
                {needsLogin && (
                  <p className="text-xs opacity-90">Redirecting to login page in 3 seconds…</p>
                )}
              </div>
            )}

            {superAdminExists === false && (
              <Button onClick={handleSetup} disabled={isLoading || !!success} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {needsLogin ? "Redirecting..." : "Success!"}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Activate Super Admin
                  </>
                )}
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Only the email configured in SUPER_ADMIN_EMAIL can activate super admin privileges
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
