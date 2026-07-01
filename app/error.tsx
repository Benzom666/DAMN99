"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

/**
 * Route-level error boundary. Catches uncaught exceptions thrown while
 * rendering any Server or Client Component under app/ and, crucially,
 * surfaces the production `digest` so a masked "Server Components render"
 * error can be traced to its server log entry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app/error]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Something went wrong
        </p>
        <h1 className="text-2xl font-semibold">This page hit an unexpected error</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The error has been logged. If it keeps happening, share the reference
          below with support so we can trace it.
        </p>
      </div>

      {error.digest ? (
        <code className="rounded-md border bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
          digest: {error.digest}
        </code>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/admin">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
