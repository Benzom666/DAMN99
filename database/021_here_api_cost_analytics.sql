-- HERE API usage telemetry and cost analytics.
-- Cost is estimated from environment-configured per-1000 request rates:
-- HERE_GEOCODING_COST_PER_1000_CENTS, HERE_ROUTING_COST_PER_1000_CENTS,
-- HERE_TOUR_PLANNING_COST_PER_1000_CENTS, HERE_MAPS_JS_COST_PER_1000_CENTS.

create table if not exists public.here_api_usage (
  id uuid primary key default gen_random_uuid(),
  service text not null check (service in ('geocoding', 'routing', 'tour_planning', 'maps_js', 'unknown')),
  operation text not null,
  admin_id uuid references public.profiles(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  route_id uuid references public.routes(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  request_count integer not null default 1 check (request_count >= 0),
  unit_count integer not null default 1 check (unit_count >= 0),
  estimated_cost_cents numeric(12, 4) not null default 0,
  status text not null default 'success' check (status in ('success', 'error', 'blocked', 'cache_hit')),
  http_status integer,
  cache_hit boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

-- Older installs may already have a here_api_usage table with a partial shape.
-- Add every analytics column before creating indexes/policies that reference them.
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
  if not exists (
    select 1 from pg_constraint where conname = 'here_api_usage_service_check'
  ) then
    alter table public.here_api_usage
      add constraint here_api_usage_service_check
      check (service in ('geocoding', 'routing', 'tour_planning', 'maps_js', 'unknown'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'here_api_usage_status_check'
  ) then
    alter table public.here_api_usage
      add constraint here_api_usage_status_check
      check (status in ('success', 'error', 'blocked', 'cache_hit'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'here_api_usage_request_count_check'
  ) then
    alter table public.here_api_usage
      add constraint here_api_usage_request_count_check
      check (request_count >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'here_api_usage_unit_count_check'
  ) then
    alter table public.here_api_usage
      add constraint here_api_usage_unit_count_check
      check (unit_count >= 0);
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'here_api_usage' and column_name = 'created_at'
  ) then
    execute 'create index if not exists idx_here_api_usage_created_at on public.here_api_usage(created_at desc)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'here_api_usage' and column_name = 'service'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'here_api_usage' and column_name = 'created_at'
  ) then
    execute 'create index if not exists idx_here_api_usage_service_created_at on public.here_api_usage(service, created_at desc)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'here_api_usage' and column_name = 'admin_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'here_api_usage' and column_name = 'created_at'
  ) then
    execute 'create index if not exists idx_here_api_usage_admin_created_at on public.here_api_usage(admin_id, created_at desc)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'here_api_usage' and column_name = 'route_id'
  ) then
    execute 'create index if not exists idx_here_api_usage_route_id on public.here_api_usage(route_id) where route_id is not null';
  end if;
end $$;

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

-- Service role bypasses RLS for telemetry inserts. Do not add a public insert policy.
