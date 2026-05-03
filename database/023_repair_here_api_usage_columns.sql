-- Repair partial HERE usage analytics installs.
-- Run this if migration 021 fails with: column "service" does not exist.

create table if not exists public.here_api_usage (
  id uuid primary key default gen_random_uuid()
);

alter table public.here_api_usage add column if not exists service text not null default 'unknown';
alter table public.here_api_usage add column if not exists operation text not null default 'unknown';
alter table public.here_api_usage add column if not exists admin_id uuid references public.profiles(id) on delete set null;
alter table public.here_api_usage add column if not exists user_id uuid references public.profiles(id) on delete set null;
alter table public.here_api_usage add column if not exists route_id uuid references public.routes(id) on delete set null;
alter table public.here_api_usage add column if not exists order_id uuid references public.orders(id) on delete set null;
alter table public.here_api_usage add column if not exists request_count integer not null default 1;
alter table public.here_api_usage add column if not exists unit_count integer not null default 1;
alter table public.here_api_usage add column if not exists estimated_cost_cents numeric(12, 4) not null default 0;
alter table public.here_api_usage add column if not exists status text not null default 'success';
alter table public.here_api_usage add column if not exists http_status integer;
alter table public.here_api_usage add column if not exists cache_hit boolean not null default false;
alter table public.here_api_usage add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.here_api_usage add column if not exists error_message text;
alter table public.here_api_usage add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'here_api_usage_service_check') then
    alter table public.here_api_usage
      add constraint here_api_usage_service_check
      check (service in ('geocoding', 'routing', 'tour_planning', 'maps_js', 'unknown'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'here_api_usage_status_check') then
    alter table public.here_api_usage
      add constraint here_api_usage_status_check
      check (status in ('success', 'error', 'blocked', 'cache_hit'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'here_api_usage_request_count_check') then
    alter table public.here_api_usage
      add constraint here_api_usage_request_count_check
      check (request_count >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'here_api_usage_unit_count_check') then
    alter table public.here_api_usage
      add constraint here_api_usage_unit_count_check
      check (unit_count >= 0);
  end if;
end $$;

create index if not exists idx_here_api_usage_created_at on public.here_api_usage(created_at desc);
create index if not exists idx_here_api_usage_service_created_at on public.here_api_usage(service, created_at desc);
create index if not exists idx_here_api_usage_admin_created_at on public.here_api_usage(admin_id, created_at desc);
create index if not exists idx_here_api_usage_route_id on public.here_api_usage(route_id) where route_id is not null;

alter table public.here_api_usage enable row level security;

drop policy if exists "Super admins can read HERE usage" on public.here_api_usage;
create policy "Super admins can read HERE usage"
  on public.here_api_usage for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );
