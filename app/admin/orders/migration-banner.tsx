"use client"

import { useState } from "react"

export function MigrationBanner() {
  const [isRunning, setIsRunning] = useState(false)

  async function runMigration() {
    setIsRunning(true)
    try {
      const res = await fetch("/api/run-migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ migration: "012_add_order_number" }),
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(`Migration failed: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      alert("Migration failed. Please check console.")
      console.error(error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Database Migration Required</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            The order_number column needs to be added to support CSV order numbers.
          </p>
        </div>
        <button
          onClick={runMigration}
          disabled={isRunning}
          className="rounded bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
        >
          {isRunning ? "Running..." : "Run Migration"}
        </button>
      </div>
    </div>
  )
}
