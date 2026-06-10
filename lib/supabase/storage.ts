import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Self-healing POD media storage.
 *
 * The single most common cause of "photos uploaded but never visible" was the
 * `pod-media` bucket not being public — which previously depended on an
 * operator manually running migration 027 (or toggling a checkbox in the
 * Supabase dashboard). If that step was skipped, dropped during a project
 * restore, or reverted, `getPublicUrl()` returned URLs that 404/403'd and the
 * delivery proof silently disappeared.
 *
 * This helper removes that fragile infra dependency entirely: on the first
 * upload after a cold start it guarantees, in code, that the bucket exists and
 * is public (with sane file-size + mime-type limits). The result is cached for
 * the lifetime of the serverless instance so we pay the round-trip at most
 * once per cold start.
 */

export const POD_MEDIA_BUCKET = "pod-media"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]

// 25 MB — generous headroom for a raw phone photo before client compression.
const FILE_SIZE_LIMIT = 25 * 1024 * 1024

/**
 * Module-level cache. Once we've confirmed the bucket is healthy we never
 * re-check for the life of this instance. We cache a resolved Promise so that
 * concurrent first-requests share one in-flight check instead of racing.
 */
let _ensurePromise: Promise<void> | null = null

export function ensurePodMediaBucket(
  admin: SupabaseClient,
): Promise<void> {
  if (_ensurePromise) return _ensurePromise

  _ensurePromise = (async () => {
    try {
      const { data: bucket, error: getError } =
        await admin.storage.getBucket(POD_MEDIA_BUCKET)

      // Bucket exists — make sure it's public + has correct limits.
      if (bucket && !getError) {
        if (!bucket.public) {
          const { error: updateError } = await admin.storage.updateBucket(
            POD_MEDIA_BUCKET,
            {
              public: true,
              allowedMimeTypes: ALLOWED_MIME_TYPES,
              fileSizeLimit: FILE_SIZE_LIMIT,
            },
          )
          if (updateError) {
            console.warn(
              "[storage] Failed to flip pod-media bucket to public:",
              updateError.message,
            )
          } else {
            console.log("[storage] pod-media bucket updated to public")
          }
        }
        return
      }

      // Bucket missing — create it public.
      const { error: createError } = await admin.storage.createBucket(
        POD_MEDIA_BUCKET,
        {
          public: true,
          allowedMimeTypes: ALLOWED_MIME_TYPES,
          fileSizeLimit: FILE_SIZE_LIMIT,
        },
      )

      // "already exists" can happen under a race — treat as success.
      if (createError && !/already exists/i.test(createError.message)) {
        console.warn(
          "[storage] Failed to create pod-media bucket:",
          createError.message,
        )
        // Don't cache the failure — allow a retry on the next request.
        _ensurePromise = null
        return
      }

      console.log("[storage] pod-media bucket ensured (created public)")
    } catch (err) {
      // Never let a bucket-check failure block an upload attempt; the upload
      // itself will surface a real error if storage is genuinely broken.
      console.warn("[storage] ensurePodMediaBucket threw (non-fatal):", err)
      _ensurePromise = null
    }
  })()

  return _ensurePromise
}
