/**
 * Minimal CSV builder. Escapes commas, quotes, and newlines per RFC 4180.
 * Server-safe (no DOM). Used for exporting route history and stop data.
 */

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = typeof value === "string" ? value : String(value)
  if (str === "") return ""
  // Always quote when the cell contains delimiter, quote, or newline.
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const headerLine = headers.map(escapeCsvCell).join(",")
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(","))
  // Use CRLF as required by RFC 4180; Excel handles either, but spreadsheets
  // are most consistent with CRLF.
  return [headerLine, ...bodyLines].join("\r\n") + "\r\n"
}
