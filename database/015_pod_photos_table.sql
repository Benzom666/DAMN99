-- Create pod_photos table for storing multiple photos per delivery
create table if not exists public.pod_photos (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods(id) on delete cascade,
  photo_url text not null,
  photo_order integer not null default 1,
  uploaded_at timestamptz default now(),
  constraint pod_photos_order_check check (photo_order >= 1 and photo_order <= 4)
);

-- Create index for better query performance
create index if not exists idx_pod_photos_pod_id on public.pod_photos(pod_id);
create index if not exists idx_pod_photos_order on public.pod_photos(pod_id, photo_order);

-- Enable RLS
alter table public.pod_photos enable row level security;

-- Drivers can view photos for their own PODs
create policy "Drivers can view their own POD photos"
  on public.pod_photos for select
  using (
    exists (
      select 1 from public.pods
      where pods.id = pod_photos.pod_id
      and pods.driver_id = auth.uid()
    )
  );

-- Drivers can insert photos for their own PODs
create policy "Drivers can insert POD photos for their orders"
  on public.pod_photos for insert
  with check (
    exists (
      select 1 from public.pods
      where pods.id = pod_photos.pod_id
      and pods.driver_id = auth.uid()
    )
  );

-- Admins can view all POD photos
create policy "Admins can view all POD photos"
  on public.pod_photos for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
