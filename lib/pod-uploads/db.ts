/**
 * Durable POD delivery queue backed by IndexedDB.
 *
 * Rebuilt to match the new single-request, storage-first delivery pipeline.
 * Instead of storing a half-finished POD id and only the media, we now persist
 * the ENTIRE delivery (order id, notes, recipient, photo + signature blobs) the
 * moment the driver taps "Delivered". A background flusher
 * (components/pending-uploads.tsx) re-submits each entry to
 * `/api/driver/deliver` — which is idempotent — until it succeeds.
 *
 * This survives navigation, refresh, app backgrounding, and full browser
 * restarts, and because the delivery endpoint is idempotent it is always safe
 * to retry. Dependency-free — native IndexedDB only.
 */

const DB_NAME = "delivery-os-pod-uploads"
const DB_VERSION = 2
const STORE = "pending"

export interface PodDeliveryEntry {
  /** Primary key — the order we're delivering. */
  orderId: string
  /** Free-text delivery notes. */
  notes?: string | null
  /** Recipient name, if captured. */
  recipientName?: string | null
  /** Optional photo blob (compressed before being placed here). */
  photo?: Blob
  /** Optional signature blob (PNG). */
  signature?: Blob
  /** Timestamp of the original capture, in ms. */
  capturedAt: number
  /** Number of submit attempts so far. */
  attempts: number
  /** Last error message, for debugging. */
  lastError?: string
}

let _dbPromise: Promise<IDBDatabase> | null = null

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined"
}

function openDb(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    return Promise.reject(new Error("IndexedDB unavailable (server-side)"))
  }
  if (_dbPromise) return _dbPromise

  _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      // v2 re-keys the store on orderId. Drop any old store (it held a
      // different shape keyed on podId) and recreate cleanly.
      if (db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE)
      }
      db.createObjectStore(STORE, { keyPath: "orderId" })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error("Failed to open IndexedDB"))
    req.onblocked = () => reject(new Error("IndexedDB open blocked"))
  })

  return _dbPromise
}

function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const store = transaction.objectStore(STORE)
        const result = fn(store)

        if (result instanceof Promise) {
          result.then(resolve, reject)
          return
        }

        result.onsuccess = () => resolve(result.result as T)
        result.onerror = () => reject(result.error || new Error("IndexedDB request failed"))
      }),
  )
}

/**
 * Enqueue (or replace) a pending delivery. Stores blobs natively.
 * Keyed by orderId so a retry with newer data overrides the old one.
 */
export async function enqueueDelivery(
  entry: Omit<PodDeliveryEntry, "attempts" | "capturedAt"> & {
    capturedAt?: number
  },
): Promise<void> {
  if (!isBrowser()) return

  const record: PodDeliveryEntry = {
    orderId: entry.orderId,
    notes: entry.notes ?? null,
    recipientName: entry.recipientName ?? null,
    photo: entry.photo,
    signature: entry.signature,
    capturedAt: entry.capturedAt ?? Date.now(),
    attempts: 0,
    lastError: entry.lastError,
  }

  await tx("readwrite", (store) => store.put(record))
}

/** Bump attempt count + lastError on an existing entry, without touching blobs. */
export async function recordAttempt(orderId: string, errorMessage?: string): Promise<void> {
  if (!isBrowser()) return
  const existing = await peek(orderId)
  if (!existing) return
  existing.attempts = (existing.attempts || 0) + 1
  if (errorMessage) existing.lastError = errorMessage
  await tx("readwrite", (store) => store.put(existing))
}

/** Read one entry by orderId. */
export async function peek(orderId: string): Promise<PodDeliveryEntry | undefined> {
  if (!isBrowser()) return undefined
  return tx<PodDeliveryEntry | undefined>(
    "readonly",
    (store) => store.get(orderId) as IDBRequest<PodDeliveryEntry | undefined>,
  )
}

/** Read every entry currently in the queue (oldest first). */
export async function peekAll(): Promise<PodDeliveryEntry[]> {
  if (!isBrowser()) return []
  const all = await tx<PodDeliveryEntry[]>(
    "readonly",
    (store) => store.getAll() as IDBRequest<PodDeliveryEntry[]>,
  )
  return (all || []).sort((a, b) => a.capturedAt - b.capturedAt)
}

/** Number of entries waiting. */
export async function count(): Promise<number> {
  if (!isBrowser()) return 0
  return tx<number>("readonly", (store) => store.count() as IDBRequest<number>)
}

/** Remove a single entry — call this AFTER a successful delivery. */
export async function removeByOrderId(orderId: string): Promise<void> {
  if (!isBrowser()) return
  await tx("readwrite", (store) => store.delete(orderId))
}

/** In-flight guard — prevents two concurrent flushes from racing. */
let _flushing = false
export function tryAcquireFlushLock(): boolean {
  if (_flushing) return false
  _flushing = true
  return true
}
export function releaseFlushLock() {
  _flushing = false
}
