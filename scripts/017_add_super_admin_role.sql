-- Add super_admin role to the system
-- This migration adds a super admin role with full system access

-- Update the role check constraint to include super_admin
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('admin', 'driver', 'super_admin'));

-- Update the get_user_role function to handle super_admin
create or replace function public.get_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$ 
  select role from public.profiles where id = auth.uid(); 
$$;

-- Function to check if user is super admin
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$ 
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'super_admin'
  ); 
$$;

grant execute on function public.is_super_admin() to authenticated;

-- Protect super admin profiles from modification by regular admins
create policy "profiles_super_admin_protected"
  on public.profiles for update
  using (
    -- Super admins can update anyone
    public.is_super_admin() or 
    -- Regular users can only update themselves, not super admins
    (id = auth.uid() and role != 'super_admin')
  )
  with check (
    -- Cannot change to or from super_admin role unless you are super_admin
    public.is_super_admin() or 
    (id = auth.uid() and role != 'super_admin')
  );

-- Super admin can view all profiles
create policy "profiles_super_admin_view_all"
  on public.profiles for select
  using (
    public.is_super_admin() or 
    id = auth.uid()
  );

-- Prevent deletion of super admin accounts
create policy "profiles_delete_protection"
  on public.profiles for delete
  using (
    public.is_super_admin() and 
    (select role from public.profiles where id = auth.uid()) != 'super_admin'
  );

-- Update all table policies to grant super_admin full access

-- Orders policies - super admin can do everything
drop policy if exists "orders_select" on public.orders;
create policy "orders_select"
  on public.orders for select
  using ( 
    public.is_super_admin() or
    public.get_user_role() = 'admin' or 
    exists (select 1 from public.routes where id = orders.route_id and driver_id = auth.uid())
  );

drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert"
  on public.orders for insert
  with check ( 
    public.is_super_admin() or
    public.get_user_role() = 'admin'
  );

drop policy if exists "orders_update" on public.orders;
create policy "orders_update"
  on public.orders for update
  using ( 
    public.is_super_admin() or
    public.get_user_role() = 'admin' or 
    exists (select 1 from public.routes where id = orders.route_id and driver_id = auth.uid())
  );

drop policy if exists "orders_delete" on public.orders;
create policy "orders_delete"
  on public.orders for delete
  using ( 
    public.is_super_admin() or
    public.get_user_role() = 'admin'
  );

-- Routes policies
drop policy if exists "routes_select" on public.routes;
create policy "routes_select"
  on public.routes for select
  using ( 
    public.is_super_admin() or
    public.get_user_role() = 'admin' or 
    driver_id = auth.uid()
  );

drop policy if exists "routes_insert" on public.routes;
create policy "routes_insert"
  on public.routes for insert
  with check ( 
    public.is_super_admin() or
    public.get_user_role() = 'admin'
  );

drop policy if exists "routes_update" on public.routes;
create policy "routes_update"
  on public.routes for update
  using ( 
    public.is_super_admin() or
    public.get_user_role() = 'admin' or 
    driver_id = auth.uid()
  );

drop policy if exists "routes_delete" on public.routes;
create policy "routes_delete"
  on public.routes for delete
  using ( 
    public.is_super_admin() or
    public.get_user_role() = 'admin'
  );

-- PODs policies
drop policy if exists "pods_select" on public.pods;
create policy "pods_select"
  on public.pods for select
  using ( 
    public.is_super_admin() or
    public.get_user_role() = 'admin' or 
    driver_id = auth.uid()
  );

drop policy if exists "pods_insert" on public.pods;
create policy "pods_insert"
  on public.pods for insert
  with check ( 
    public.is_super_admin() or
    driver_id = auth.uid()
  );

-- Stop events policies
drop policy if exists "stop_events_select" on public.stop_events;
create policy "stop_events_select"
  on public.stop_events for select
  using ( 
    public.is_super_admin() or
    public.get_user_role() = 'admin' or 
    driver_id = auth.uid()
  );

drop policy if exists "stop_events_insert" on public.stop_events;
create policy "stop_events_insert"
  on public.stop_events for insert
  with check ( 
    public.is_super_admin() or
    driver_id = auth.uid()
  );

-- Driver positions policies (if exists)
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'driver_positions') then
    execute 'drop policy if exists "driver_positions_select" on public.driver_positions';
    execute 'create policy "driver_positions_select"
      on public.driver_positions for select
      using ( 
        public.is_super_admin() or
        public.get_user_role() = ''admin'' or 
        driver_id = auth.uid()
      )';
    
    execute 'drop policy if exists "driver_positions_insert" on public.driver_positions';
    execute 'create policy "driver_positions_insert"
      on public.driver_positions for insert
      with check ( 
        public.is_super_admin() or
        driver_id = auth.uid()
      )';
  end if;
end $$;

-- Create audit log table for super admin actions
create table if not exists public.super_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  super_admin_id uuid not null references public.profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- Enable RLS on audit log
alter table public.super_admin_audit_log enable row level security;

-- Only super admins can view audit logs
create policy "audit_log_super_admin_only"
  on public.super_admin_audit_log for select
  using (public.is_super_admin());

-- Anyone authenticated can insert (for logging), but function will verify
create policy "audit_log_insert"
  on public.super_admin_audit_log for insert
  with check (public.is_super_admin());

create index if not exists idx_audit_log_super_admin_id on public.super_admin_audit_log(super_admin_id);
create index if not exists idx_audit_log_created_at on public.super_admin_audit_log(created_at desc);

-- Function to log super admin actions
create or replace function public.log_super_admin_action(
  p_action text,
  p_target_table text default null,
  p_target_id uuid default null,
  p_details jsonb default null
)
returns void
language plpgsql
security definer
as $$
begin
  if public.is_super_admin() then
    insert into public.super_admin_audit_log (
      super_admin_id,
      action,
      target_table,
      target_id,
      details
    ) values (
      auth.uid(),
      p_action,
      p_target_table,
      p_target_id,
      p_details
    );
  end if;
end;
$$;

grant execute on function public.log_super_admin_action to authenticated;
