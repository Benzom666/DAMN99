-- 032_repair_orders_schema.sql
--
-- Fixes: CSV / manual order import failing with
--   PGRST204 "Could not find the 'geocode_at' column of 'orders' in the schema cache"
--
-- Root cause: the production `orders` table was created from the base schema but
-- several later migrations (geocoding columns, multi-tenancy, order numbers,
-- failed-delivery retry) were never applied, so the columns the app writes to
-- on insert/update don't exist. This migration brings the table up to what the
-- code expects. It is idempotent and safe to re-run.

-- ── Geocoding metadata (migration 004) ──────────────────────────────────────
alter table public.orders add column if not exists geocode_at     timestamptz;
alter table public.orders add column if not exists geocode_label  text;
alter table public.orders add column if not exists geocode_status text;
alter table public.orders add column if not exists geocode_error  text;
alter table public.orders add column if not exists latitude       double precision;
alter table public.orders add column if not exists longitude      double precision;

-- ── Multi-tenancy + order numbers (migrations 012, 014) ─────────────────────
alter table public.orders add column if not exists admin_id      uuid;
alter table public.orders add column if not exists order_number  text;

-- ── Customer email for POD notifications (migration 011) ────────────────────
alter table public.orders add column if not exists customer_email text;

-- ── Item quantity / service time used by route optimization ─────────────────
alter table public.orders add column if not exists quantity        integer default 1;
alter table public.orders add column if not exists service_seconds integer;

-- ── Failed-delivery retry / re-route (migration 030) ────────────────────────
alter table public.orders add column if not exists retry_count       integer default 0;
alter table public.orders add column if not exists last_failed_at    timestamptz;
alter table public.orders add column if not exists original_route_id uuid;

-- ── Helpful indexes (no-ops if already present) ─────────────────────────────
create index if not exists idx_orders_geocode_status on public.orders(geocode_status);
create index if not exists idx_orders_coordinates
  on public.orders(latitude, longitude)
  where latitude is not null and longitude is not null;
create index if not exists idx_orders_admin_id on public.orders(admin_id);

-- One order_number per admin (matches the import's duplicate guard). Partial so
-- legacy rows without an order_number are unaffected. Skips silently if the
-- data currently contains duplicates — clean those first, then re-run.
do $$
begin
  create unique index if not exists orders_admin_order_number_key
    on public.orders(admin_id, order_number)
    where order_number is not null;
exception when others then
  raise notice 'Skipped unique index on (admin_id, order_number): %', sqlerrm;
end $$;
