/**
 * Durable POD upload queue backed by IndexedDB.
 *
 * Captured photo and signature blobs are persisted here the moment we attempt
 * an upload, so they survive page navigation, refresh, app backgrounding, and
 * even browser restarts. A background flusher (components/pending-uploads.tsx)
 * sweeps this queue and retries until each entry uploads successfully.
 *
 * Dependency-free — uses the native IndexedDB API only.
 */

const DB_NAME = "delivery-os-pod-uploads"
const DB_VERSION = 1
const STORE = "pending"

export interface PodUploadEntry {
  /** Primary key — the POD row id we're attaching media to */
  podId: string
  /** For UX (so we can show a stop label next to the queue entry) */
  orderId: string
  /** Optional photo blob. Compressed before being placed here. */
  photo?: Blob
  /** Optional signature blob (PNG). */
  signature?: Blob
  /** Timestamp of the original capture, in ms. */
  capturedAt: number
  /** Number of upload attempts so far. */
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
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "podId" })
      }
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
        result.onerror = () =>
          reject(result.error || new Error("IndexedDB request failed"))
      }),
  )
}

/**
 * Enqueue (or update) a pending upload. Stores blobs natively.
 * If an entry already exists for `podId`, it's replaced — meaning a retry
 * with newer captured data overrides the old one.
 */
export async function enqueue(
  entry: Omit<PodUploadEntry, "attempts" | "lastError" | "capturedAt"> & {
    capturedAt?: number
    lastError?: string
  },
): Promise<void> {
  if (!isBrowser()) return

  const record: PodUploadEntry = {
    podId: entry.podId,
    orderId: entry.orderId,
    photo: entry.photo,
    signature: entry.signature,
    capturedAt: entry.capturedAt ?? Date.now(),
    attempts: 0,
    lastError: entry.lastError,
  }

  await tx("readwrite", (store) => store.put(record))
}

/** Bump attempt count + lastError on an existing entry, without touching blobs. */
export async function recordAttempt(
  podId: string,
  errorMessage?: string,
): Promise<void> {
  if (!isBrowser()) return
  const existing = await peek(podId)
  if (!existing) return
  existing.attempts = (existing.attempts || 0) + 1
  if (errorMessage) existing.lastError = errorMessage
  await tx("readwrite", (store) => store.put(existing))
}

/** Read one entry by podId. */
export async function peek(podId: string): Promise<PodUploadEntry | undefined> {
  if (!isBrowser()) return undefined
  return tx<PodUploadEntry | undefined>("readonly", (store) =>
    store.get(podId) as IDBRequest<PodUploadEntry | undefined>,
  )
}

/** Read every entry currently in the queue (oldest first). */
export async function peekAll(): Promise<PodUploadEntry[]> {
  if (!isBrowser()) return []
  const all = await tx<PodUploadEntry[]>("readonly", (store) =>
    store.getAll() as IDBRequest<PodUploadEntry[]>,
  )
  return (all || []).sort((a, b) => a.capturedAt - b.capturedAt)
}

/** Number of entries waiting. */
export async function count(): Promise<number> {
  if (!isBrowser()) return 0
  return tx<number>("readonly", (store) => store.count() as IDBRequest<number>)
}

/** Remove a single entry — call this AFTER a successful upload. */
export async function removeByPodId(podId: string): Promise<void> {
  if (!isBrowser()) return
  await tx("readwrite", (store) => store.delete(podId))
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
