"use client"

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
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2, ShieldCheck } from "lucide-react"
import { checkAndCreateProfile, getProfileBypass } from "./actions"

export default function CompleteProfilePage() {
  const [displayName, setDisplayName] = useState("")
  const [role, setRole] = useState<"admin" | "driver">("admin")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/auth/login")
        return
      }

      setUserId(user.id)
      setEmail(user.email || "")
      setDisplayName(user.email?.split("@")[0] || "")

      try {
        const profile = await getProfileBypass(user.id)

        if (profile) {
          if (profile.role === "super_admin") {
            router.replace("/super-admin")
          } else if (profile.role === "admin") {
            router.replace("/admin")
          } else {
            router.replace("/driver")
          }
          return
        }
      } catch (err) {
        console.error("[v0] Profile check error:", err)
      }

      setIsLoading(false)
    }

    checkProfile()
  }, [router, supabase])

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !email) return

    setIsSaving(true)
    setError(null)

    try {
      const result = await checkAndCreateProfile(
        userId,
        email,
        displayName,
        role,
      )

      if (!result.success) {
        throw new Error(result.error || "Failed to create profile")
      }

      if (result.role === "super_admin") {
        router.replace("/super-admin")
      } else if (result.role === "admin") {
        router.replace("/admin")
      } else {
        router.replace("/driver")
      }
    } catch (error: unknown) {
      console.error("[v0] Profile creation error:", error)
      setError(
        error instanceof Error ? error.message : "Failed to create profile",
      )
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <AuthShell
      headline="Almost there. Tell us who you are."
      pitch="One last step before your dashboard comes online. This takes about 12 seconds."
    >
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight leading-tight text-foreground">
            Complete your profile
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            We just need a name and a role to wire up your account.
          </p>
        </div>

        <form onSubmit={handleComplete} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email || ""} disabled />
          </div>

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
            {email === "benzom59@gmail.com" && (
              <Alert variant="success">
                <ShieldCheck className="size-4" />
                <AlertDescription>
                  Super Admin role will be auto-assigned for this email.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={isSaving}
            className="w-full mt-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Setting up…
              </>
            ) : (
              "Complete setup"
            )}
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
