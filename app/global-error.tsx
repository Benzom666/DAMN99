"use client"

import { useEffect } from "react"

/**
 * Root error boundary. Replaces the root layout when the layout itself (or
 * something it renders) throws, so it must supply its own <html>/<body>.
 * globals.css is not guaranteed to apply here — styles are intentionally
 * inline. Like app/error.tsx, it exposes the production `digest`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app/global-error]", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          color: "#0a0a0a",
          background: "#ffffff",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#737373",
              margin: "0 0 0.5rem",
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
            The application hit an unexpected error
          </h1>
        </div>

        {error.digest ? (
          <code
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.75rem",
              color: "#737373",
              border: "1px solid #e5e5e5",
              borderRadius: "0.375rem",
              padding: "0.375rem 0.75rem",
              background: "#fafafa",
            }}
          >
            digest: {error.digest}
          </code>
        ) : null}

        <button
          onClick={reset}
          style={{
            appearance: "none",
            border: "none",
            borderRadius: "0.5rem",
            background: "#0a0a0a",
            color: "#ffffff",
            fontSize: "0.875rem",
            fontWeight: 500,
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
