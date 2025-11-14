-- Add support for multiple photos in POD
-- Change photo_url from text to text[] to support up to 4 photos

-- Add new column for multiple photos
alter table public.pods add column if not exists photo_urls text[] default array[]::text[];

-- Migrate existing single photo_url to photo_urls array
update public.pods 
set photo_urls = array[photo_url]::text[]
where photo_url is not null and (photo_urls is null or array_length(photo_urls, 1) is null);

-- Note: Keep photo_url column for backward compatibility during migration
-- Can be dropped after confirming all systems are updated
