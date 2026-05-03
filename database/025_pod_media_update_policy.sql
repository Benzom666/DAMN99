-- Allow drivers to attach uploaded POD media after the delivery status is saved.

alter table public.pods enable row level security;

drop policy if exists "pods_update" on public.pods;

create policy "pods_update"
  on public.pods for update
  using (
    driver_id = auth.uid()
    or public.get_user_role() in ('admin', 'super_admin')
  )
  with check (
    driver_id = auth.uid()
    or public.get_user_role() in ('admin', 'super_admin')
  );
