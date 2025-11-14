"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { useState, useEffect } from "react"
import { Loader2 } from 'lucide-react'
import { checkAndCreateProfile, getProfileBypass } from './actions'

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
      const { data: { user } } = await supabase.auth.getUser()
      
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
      const result = await checkAndCreateProfile(userId, email, displayName, role)

      if (!result.success) {
        throw new Error(result.error || "Failed to create profile")
      }

      // Redirect based on role
      if (result.role === "super_admin") {
        router.replace("/super-admin")
      } else if (result.role === "admin") {
        router.replace("/admin")
      } else {
        router.replace("/driver")
      }
    } catch (error: unknown) {
      console.error("[v0] Profile creation error:", error)
      setError(error instanceof Error ? error.message : "Failed to create profile")
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Your account was created but we need a bit more information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleComplete}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email || ""}
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value: "admin" | "driver") => setRole(value)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {email === "benzom59@gmail.com" && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Super Admin role will be automatically assigned
                    </p>
                  )}
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? "Creating profile..." : "Complete Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
