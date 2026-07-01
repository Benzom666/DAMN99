import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiKeysManager } from "@/components/settings/api-keys-manager"
import { HereKeyForm } from "@/components/settings/here-key-form"
import { listApiKeys, getHereKeyStatus } from "./actions"
import { Terminal } from "lucide-react"

export const dynamic = "force-dynamic"

const ENDPOINTS: Array<{ method: string; path: string; desc: string }> = [
  { method: "POST", path: "/api/v1/optimize", desc: "Optimize stops into sequenced routes (stateless)" },
  { method: "POST", path: "/api/v1/geocode", desc: "Geocode addresses to coordinates" },
  { method: "GET", path: "/api/v1/orders", desc: "List orders" },
  { method: "POST", path: "/api/v1/orders", desc: "Create an order" },
  { method: "GET", path: "/api/v1/orders/:id", desc: "Get an order" },
  { method: "PATCH", path: "/api/v1/orders/:id", desc: "Update an order" },
  { method: "DELETE", path: "/api/v1/orders/:id", desc: "Delete an order" },
  { method: "GET", path: "/api/v1/routes", desc: "List routes" },
  { method: "POST", path: "/api/v1/routes", desc: "Optimize + create route(s) from order IDs" },
  { method: "GET", path: "/api/v1/routes/:id", desc: "Get a route with ordered stops" },
  { method: "GET", path: "/api/v1/drivers", desc: "List drivers" },
]

const CURL_EXAMPLE = `curl -X POST https://your-domain.com/api/v1/optimize \\
  -H "Authorization: Bearer dos_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "stops": [
      { "id": "a", "lat": 45.4215, "lng": -75.6972 },
      { "id": "b", "lat": 45.4470, "lng": -75.6900 }
    ],
    "vehicles": [{ "id": "van-1", "capacity": 50 }]
  }'`

export default async function SettingsPage() {
  const [keys, hereStatus] = await Promise.all([listApiKeys(), getHereKeyStatus()])

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage API keys and integrations for your delivery operation."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-6 max-w-5xl">
        <ApiKeysManager initialKeys={keys} />

        <HereKeyForm hasKey={hereStatus.hasKey} lastFour={hereStatus.lastFour} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="size-4 text-primary" strokeWidth={1.8} />
              API reference
            </CardTitle>
            <CardDescription>
              Every endpoint is authenticated with an API key. Send it as{" "}
              <code className="text-xs">Authorization: Bearer &lt;key&gt;</code> (or the{" "}
              <code className="text-xs">x-api-key</code> header). Data is scoped to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              {ENDPOINTS.map((e) => (
                <div key={`${e.method} ${e.path}`} className="flex items-center gap-3 text-sm">
                  <span className="inline-block w-16 shrink-0 font-mono text-xs font-semibold text-primary">
                    {e.method}
                  </span>
                  <code className="w-64 shrink-0 text-xs">{e.path}</code>
                  <span className="text-muted-foreground">{e.desc}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Example</div>
              <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed">
                <code>{CURL_EXAMPLE}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
