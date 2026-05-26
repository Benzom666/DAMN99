-- Enable RLS on storage.objects for pod-media bucket
-- This allows drivers to upload photos and admins to view them

-- Allow drivers to upload to pod-media bucket
create policy "Drivers can upload POD media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pod-media' 
  and auth.uid() in (
    select id from public.profiles where role = 'driver'
  )
);

-- Allow drivers to update their own POD media
create policy "Drivers can update their POD media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'pod-media'
  and auth.uid() in (
    select id from public.profiles where role = 'driver'
  )
);

-- Allow everyone to view POD media (public bucket)
create policy "Anyone can view POD media"
on storage.objects for select
to public
using (bucket_id = 'pod-media');

-- Allow admins to view POD media
create policy "Admins can view POD media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'pod-media'
  and auth.uid() in (
    select id from public.profiles where role in ('admin', 'super_admin')
  )
);
