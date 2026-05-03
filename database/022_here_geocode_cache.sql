-- Persistent HERE geocoding cache to avoid paying repeatedly for the same address.

create table if not exists public.here_geocode_cache (
  cache_key text primary key,
  query text not null,
  latitude double precision,
  longitude double precision,
  formatted_address text,
  result_found boolean not null default false,
  hit_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_hit_at timestamptz
);

create index if not exists idx_here_geocode_cache_updated_at on public.here_geocode_cache(updated_at desc);

alter table public.here_geocode_cache enable row level security;

-- Service role bypasses RLS for cache reads/writes. Do not add public policies.
