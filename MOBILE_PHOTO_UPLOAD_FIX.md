# Mobile Photo Upload Fix

## Problem
Photos and signatures uploaded from mobile devices were not showing to dispatch/admin. The uploads were succeeding, but the URLs were not accessible.

## Root Cause
The `pod-media` Supabase Storage bucket was not configured as **public**. When `getPublicUrl()` is called on a non-public bucket, it returns a URL, but that URL is not accessible without authentication.

## Solution
Run the migration `027_ensure_pod_media_bucket_public.sql` to:
1. Create the `pod-media` bucket if it doesn't exist
2. Set the bucket to `public = true`

## How to Apply

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database/027_ensure_pod_media_bucket_public.sql`
4. Click **Run**

### Option 2: Via Supabase CLI
```bash
supabase db push
```

### Option 3: Manual Configuration
1. Go to **Storage** in Supabase Dashboard
2. Find the `pod-media` bucket
3. Click on the bucket settings
4. Toggle **Public bucket** to ON

## Verification

After applying the fix:

1. **Test mobile upload:**
   - Open the driver app on a mobile device
   - Navigate to a delivery stop
   - Take a photo or capture a signature
   - Mark the delivery as complete

2. **Verify in dispatch:**
   - Open the admin dispatch page
   - Click on the delivered order
   - The photo and signature should now be visible

3. **Check the URL:**
   - The photo URL should look like:
     ```
     https://[project-ref].supabase.co/storage/v1/object/public/pod-media/pod-photos/[uuid]-[timestamp].jpg
     ```
   - Note the `/public/` in the path - this indicates the bucket is public

## Technical Details

### Before Fix
- Bucket: `pod-media` (private or non-existent)
- URL format: `https://[project-ref].supabase.co/storage/v1/object/public/pod-media/...`
- Result: 404 or 403 error when accessing the URL

### After Fix
- Bucket: `pod-media` (public)
- URL format: Same
- Result: Image loads successfully

### Why This Happened
The RLS policies in `026_pod_media_storage_policies.sql` were correctly configured to allow:
- Drivers to upload
- Public to view
- Admins to view

However, RLS policies on `storage.objects` only control access **through the Supabase client**. For public URLs to work, the **bucket itself** must be marked as public.

## Related Files
- `database/027_ensure_pod_media_bucket_public.sql` - The fix
- `database/026_pod_media_storage_policies.sql` - RLS policies (already correct)
- `app/api/driver/pod-media/upload/route.ts` - Upload API
- `app/driver/routes/[id]/[orderId]/stop-detail.tsx` - Driver upload UI
- `app/admin/dispatch/dispatch-monitor.tsx` - Admin view UI

## Prevention
When creating new Supabase Storage buckets for public content:
1. Always set `public = true` in the bucket configuration
2. Add RLS policies for fine-grained access control
3. Test with `getPublicUrl()` to ensure URLs are accessible
