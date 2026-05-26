-- Ensure pod-media bucket exists and is public
-- This fixes the issue where photos uploaded from mobile aren't visible to dispatch

-- Insert bucket if it doesn't exist (idempotent)
insert into storage.buckets (id, name, public)
values ('pod-media', 'pod-media', true)
on conflict (id) do update
set public = true;

-- Ensure the bucket is public so getPublicUrl() works
update storage.buckets
set public = true
where id = 'pod-media';
