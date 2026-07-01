"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import { saveHereKey, clearHereKey } from "@/app/admin/settings/actions"

export function HereKeyForm({ hasKey, lastFour }: { hasKey: boolean; lastFour: string | null }) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    setMessage(null)
    setSaving(true)
    try {
      await saveHereKey(value)
      setValue("")
      setMessage("HERE key saved. Optimization and geocoding will now use your key.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save key")
    } finally {
      setSaving(false)
    }
  }

  async function handleClear() {
    setError(null)
    setMessage(null)
    setClearing(true)
    try {
      await clearHereKey()
      setMessage("Reverted to the platform HERE key.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear key")
    } finally {
      setClearing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" strokeWidth={1.8} />
          HERE Maps key
          {hasKey ? (
            <Badge variant="secondary">Using your key ····{lastFour}</Badge>
          ) : (
            <Badge variant="outline">Platform key</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Optionally bring your own HERE Maps API key. When set, all geocoding and route optimization — including via the
          API — run on your HERE account. Leave empty to use the platform key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="here-key">{hasKey ? "Replace key" : "HERE API key"}</Label>
          <Input
            id="here-key"
            type="password"
            placeholder="Paste your HERE API key"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !value.trim()} size="sm">
            {saving ? "Saving…" : "Save key"}
          </Button>
          {hasKey && (
            <Button onClick={handleClear} disabled={clearing} variant="outline" size="sm">
              {clearing ? "Removing…" : "Use platform key"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
