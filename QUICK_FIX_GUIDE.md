# Quick Fix Guide: Mobile Photo Upload Issue

## The Problem
Photos and signatures uploaded from mobile devices were not showing to dispatch/admin.

## The Root Cause
The `pod-media` Supabase Storage bucket was not configured as **public**. While uploads succeeded and URLs were generated, those URLs were not accessible because the bucket wasn't public.

## The Fix (Choose One Method)

### Method 1: Run the Migration (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database/027_ensure_pod_media_bucket_public.sql`
4. Click **Run**

### Method 2: Manual Configuration (Fastest)
1. Go to **Storage** in Supabase Dashboard
2. Find or create the `pod-media` bucket
3. Click on the bucket settings (gear icon)
4. Toggle **Public bucket** to **ON**
5. Save changes

### Method 3: Run Master Setup (If Starting Fresh)
If you're setting up a new database, just run `database/00_master_setup.sql` which now includes this fix.

## Verification

After applying the fix:

1. **Test on mobile:**
   - Open driver app on mobile
   - Navigate to a delivery stop
   - Take a photo or capture signature
   - Mark delivery as complete

2. **Check in dispatch:**
   - Open admin dispatch page
   - Click on the delivered order
   - Photo and signature should now be visible

3. **Verify URL format:**
   - Photo URLs should contain `/public/` in the path:
   ```
   https://[project].supabase.co/storage/v1/object/public/pod-media/pod-photos/...
   ```

## Why This Happened

- **RLS policies** (Row Level Security) control access through the Supabase client
- **Bucket public flag** controls direct URL access
- We had correct RLS policies but forgot to make the bucket public
- `getPublicUrl()` returns URLs regardless, but they only work if bucket is public

## Files Changed
- ✅ `database/027_ensure_pod_media_bucket_public.sql` - The migration
- ✅ `database/00_master_setup.sql` - Updated to include bucket creation
- ✅ `MOBILE_PHOTO_UPLOAD_FIX.md` - Detailed documentation
- ✅ `SUPABASE_STORAGE_MIGRATION.md` - Updated migration checklist

## Commit
Committed and pushed as: `1de762f - Fix mobile photo upload visibility issue`
