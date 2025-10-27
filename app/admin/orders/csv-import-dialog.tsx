"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { importOrdersFromCSV } from "./actions"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const [csvData, setCsvData] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      setResult({ imported: 0, errors: ["Please upload a CSV file"] })
      return
    }

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvData(text)
      setResult(null)
    }

    reader.onerror = () => {
      setResult({ imported: 0, errors: ["Failed to read file"] })
      setFileName(null)
    }

    reader.readAsText(file)
  }

  async function handleImport() {
    setIsLoading(true)
    setResult(null)

    try {
      const importResult = await importOrdersFromCSV(csvData)
      setResult(importResult)
      if (importResult.errors.length === 0) {
        setCsvData("")
        setFileName(null)
        setTimeout(() => onOpenChange(false), 2000)
      }
    } catch (error) {
      console.error("Import error:", error)
      setResult({ imported: 0, errors: ["Failed to import orders"] })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Orders from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste your CSV data below. Required columns: customer_name, address, customer_email.
            Optional: order_number, city, state, zip, phone, notes
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-3 text-xs font-mono">
            order_number,customer_name,address,city,state,zip,phone,notes,customer_email
            <br />
            ORD-12345,John Doe,123 Main St,Springfield,IL,62701,555-0100,Leave at door,john@example.com
          </div>

          <div className="flex items-center gap-2">
            <Input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-file-upload" />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("csv-file-upload")?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {fileName ? fileName : "Upload CSV File"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or paste CSV data</span>
            </div>
          </div>

          <Textarea
            placeholder="Paste CSV data here..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
          {result && (
            <div className="space-y-2">
              {result.imported > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>Successfully imported {result.imported} order(s).</AlertDescription>
                </Alert>
              )}
              {result.errors.length > 0 && (
                <Alert variant={result.imported === 0 ? "destructive" : "default"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {result.errors.map((error, i) => (
                        <li key={i} className="text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading || !csvData.trim()}>
            {isLoading ? "Importing..." : "Import Orders"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
