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

-- Service role bypasses RLS for telemetry inserts. Do not add a public insert policy.
