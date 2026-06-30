-- ============================================================================
-- APPLY_OUTSTANDING_MIGRATIONS.sql
-- ----------------------------------------------------------------------------
-- One-shot, idempotent script that brings a DeliveryOS database up to what the
-- application code expects. Safe to run multiple times. Run it once in the
-- Supabase SQL editor (paste the whole file, Run).
--
-- It applies, in dependency order:
--   1. orders schema repair        (geocode/admin/order_number/etc. columns)
--   2. pods schema repair          (photo_url/signature_url/recipient/etc.)
--   3. pods media update policy
--   4. route history + order-number sequence/trigger + failed-retry columns
--   5. pods de-duplication + one-POD-per-order unique index
--
-- Requires: tables profiles, orders, routes, stop_events, pods and the
-- public.get_user_role() function (already present on any working DeliveryOS DB).
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1) ORDERS SCHEMA  (from 032_repair_orders_schema.sql, columns only)
-- ============================================================================

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

-- ── Order archival (migration 033) ──────────────────────────────────────────
-- Set when a delivered order's route is completed (or when an admin archives an
-- order manually). Archived orders are hidden from the active manifest but
-- preserved in route_history and still queryable by super_admin.
alter table public.orders add column if not exists archived_at timestamptz;

-- ── Helpful indexes (no-ops if already present) ─────────────────────────────
create index if not exists idx_orders_geocode_status on public.orders(geocode_status);
create index if not exists idx_orders_coordinates
  on public.orders(latitude, longitude)
  where latitude is not null and longitude is not null;
create index if not exists idx_orders_admin_id on public.orders(admin_id);
create index if not exists idx_orders_archived_at on public.orders(archived_at);


-- ============================================================================
-- 2) PODS SCHEMA  (from 024_repair_pod_schema.sql)
-- ============================================================================
-- Repair older POD schemas used by the mobile delivery flow.

alter table public.pods add column if not exists photo_url text;
alter table public.pods add column if not exists signature_url text;
alter table public.pods add column if not exists recipient_name text;
alter table public.pods add column if not exists notes text;
alter table public.pods add column if not exists delivered_at timestamptz default now();

create index if not exists idx_pods_order_id on public.pods(order_id);

-- ============================================================================
-- 3) PODS MEDIA UPDATE POLICY  (from 025_pod_media_update_policy.sql)
-- ============================================================================
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

-- ============================================================================
-- 4) ROUTE HISTORY + ORDER NUMBERS + RETRY  (from 030)
-- ============================================================================
-- ============================================================================
-- SCRIPT 030: ROUTE HISTORY, UNIQUE ORDER NUMBERS, FAILED-DELIVERY RETRY
-- ============================================================================
-- This migration is fully idempotent and additive. It adds:
--   1. Route history / archival columns + route_history snapshot table
--   2. Sequence + trigger + partial unique index for order_number
--   3. retry/reroute columns on orders, additional stop_events event_types
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ROUTE HISTORY / ARCHIVAL
-- ----------------------------------------------------------------------------

-- Add archive + completed timestamps on routes (non-breaking)
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS archived_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_routes_archived_at  ON public.routes(archived_at);
CREATE INDEX IF NOT EXISTS idx_routes_completed_at ON public.routes(completed_at);

COMMENT ON COLUMN public.routes.archived_at  IS 'Timestamp when the route was archived. NULL means visible in active list.';
COMMENT ON COLUMN public.routes.completed_at IS 'Timestamp when the route was marked completed.';

-- Backfill completed_at for already-completed routes (best-effort)
UPDATE public.routes
   SET completed_at = COALESCE(completed_at, updated_at, created_at)
 WHERE status = 'completed' AND completed_at IS NULL;

-- Immutable snapshot of completed routes for permanent record-keeping
CREATE TABLE IF NOT EXISTS public.route_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id        UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  admin_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  driver_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  driver_name     TEXT,
  driver_email    TEXT,
  status          TEXT NOT NULL,
  total_stops     INTEGER NOT NULL DEFAULT 0,
  completed_stops INTEGER NOT NULL DEFAULT 0,
  failed_stops    INTEGER NOT NULL DEFAULT 0,
  distance_km     DOUBLE PRECISION,
  duration_sec    INTEGER,
  created_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- snapshot is a JSONB document containing the route + ordered stops
  -- (customer info, address, status, POD URLs, stop_events). This means the
  -- archive survives deletion of the original orders.
  snapshot        JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_route_history_admin_id    ON public.route_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_route_history_route_id    ON public.route_history(route_id);
CREATE INDEX IF NOT EXISTS idx_route_history_archived_at ON public.route_history(archived_at DESC);

-- RLS for route_history
ALTER TABLE public.route_history ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
            WHERE schemaname='public' AND tablename='route_history'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.route_history', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "route_history_admin_select"
  ON public.route_history FOR SELECT
  USING (admin_id = auth.uid() OR public.get_user_role() = 'super_admin');

CREATE POLICY "route_history_admin_insert"
  ON public.route_history FOR INSERT
  WITH CHECK (admin_id = auth.uid() OR public.get_user_role() = 'super_admin');

CREATE POLICY "route_history_admin_delete"
  ON public.route_history FOR DELETE
  USING (admin_id = auth.uid() OR public.get_user_role() = 'super_admin');

-- ----------------------------------------------------------------------------
-- 2. UNIQUE ORDER NUMBERS (sequence + trigger + partial unique index)
-- ----------------------------------------------------------------------------

-- Global sequence used to generate deterministic, monotonically-increasing
-- order numbers. Multi-tenancy uniqueness is enforced via the partial index
-- below; the sequence guarantees no collision within an admin either.
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1 INCREMENT BY 1;

-- Function to mint a new order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_id BIGINT;
BEGIN
  next_id := nextval('public.order_number_seq');
  RETURN 'ORD-' || lpad(next_id::text, 8, '0');
END;
$$;

-- BEFORE INSERT trigger: auto-fill order_number when missing
CREATE OR REPLACE FUNCTION public.orders_set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR length(trim(NEW.order_number)) = 0 THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_set_order_number();

-- Backfill any existing rows that have NULL or empty order_number
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.orders
     WHERE order_number IS NULL OR length(trim(order_number)) = 0
     ORDER BY created_at ASC
  LOOP
    UPDATE public.orders
       SET order_number = public.generate_order_number()
     WHERE id = r.id;
  END LOOP;
END $$;

-- Resolve any historical duplicates by appending a short suffix to all but the
-- earliest occurrence, so the unique index can be created safely.
DO $$
DECLARE
  r RECORD;
  suffix TEXT;
BEGIN
  FOR r IN
    SELECT id, admin_id, order_number,
           ROW_NUMBER() OVER (
             PARTITION BY admin_id, order_number
             ORDER BY created_at ASC, id ASC
           ) AS rn
      FROM public.orders
     WHERE order_number IS NOT NULL
  LOOP
    IF r.rn > 1 THEN
      suffix := substring(replace(gen_random_uuid()::text, '-', '') for 6);
      UPDATE public.orders
         SET order_number = r.order_number || '-' || suffix
       WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- Partial unique index: enforces uniqueness per admin
CREATE UNIQUE INDEX IF NOT EXISTS unique_order_number_per_admin
  ON public.orders (admin_id, order_number)
  WHERE order_number IS NOT NULL;

COMMENT ON INDEX public.unique_order_number_per_admin
  IS 'Order numbers must be unique within a single admin tenant.';

-- ----------------------------------------------------------------------------
-- 3. FAILED DELIVERY RE-ROUTE / RETRY
-- ----------------------------------------------------------------------------

-- Track retry count and original route on each order
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS retry_count       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_route_id UUID;

CREATE INDEX IF NOT EXISTS idx_orders_last_failed_at ON public.orders(last_failed_at);
CREATE INDEX IF NOT EXISTS idx_orders_retry_count    ON public.orders(retry_count) WHERE retry_count > 0;

COMMENT ON COLUMN public.orders.retry_count
  IS 'Number of times this order has been re-queued after a failed delivery.';
COMMENT ON COLUMN public.orders.last_failed_at
  IS 'Timestamp of the most recent failed delivery attempt.';
COMMENT ON COLUMN public.orders.original_route_id
  IS 'The route this order failed on, preserved when the order is re-routed.';

-- Extend stop_events.event_type to allow 'rerouted'.
-- We rebuild the check constraint additively (existing values still valid).
DO $$
DECLARE
  conname TEXT;
BEGIN
  -- Find and drop any existing check constraint on event_type
  FOR conname IN
    SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public'
       AND t.relname = 'stop_events'
       AND c.contype = 'c'
       AND pg_get_constraintdef(c.oid) ILIKE '%event_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.stop_events DROP CONSTRAINT IF EXISTS %I', conname);
  END LOOP;
END $$;

ALTER TABLE public.stop_events
  ADD CONSTRAINT stop_events_event_type_check
  CHECK (event_type IN ('arrived', 'delivered', 'failed', 'rerouted'));

-- ----------------------------------------------------------------------------
-- 4. SET last_failed_at AUTOMATICALLY WHEN AN ORDER GOES TO 'failed'
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.orders_track_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'failed' AND (OLD.status IS DISTINCT FROM 'failed') THEN
    NEW.last_failed_at := now();
    IF NEW.original_route_id IS NULL AND NEW.route_id IS NOT NULL THEN
      NEW.original_route_id := NEW.route_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS track_order_failure_trigger ON public.orders;
CREATE TRIGGER track_order_failure_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_track_failure();

-- ============================================================================
-- DONE: Migration 030 applied successfully.
-- ============================================================================

-- ============================================================================
-- 5) PODS DE-DUPLICATION + UNIQUE  (from 031)
-- ============================================================================
-- 031_pods_dedupe_unique_order.sql
--
-- Fixes "driver uploads photo + signature but neither driver nor admin can see
-- it." Root cause: multiple `pods` rows existed for the same order_id (no unique
-- constraint). The driver stop page read PODs with `.single()/.maybeSingle()`,
-- which errors (PGRST116 "multiple rows returned") whenever duplicates exist, so
-- the page fell back to "no POD" and showed nothing — even though a row WITH the
-- media existed. The admin view picked an arbitrary (often empty) duplicate.
--
-- This migration is idempotent and safe to re-run.

-- 1. Coalesce media onto the row we are going to KEEP, so we never lose a photo
--    or signature that happened to live on a duplicate. The survivor per order
--    is the row with media (if any), then the most recently delivered, then the
--    highest id as a stable tiebreaker.
with ranked as (
  select
    id,
    order_id,
    row_number() over (
      partition by order_id
      order by
        (case when photo_url is not null or signature_url is not null then 0 else 1 end),
        delivered_at desc nulls last,
        id desc
    ) as rn
  from public.pods
),
survivors as (
  select id, order_id from ranked where rn = 1
),
media as (
  -- First non-null media value per order across ALL duplicates.
  select
    order_id,
    (array_remove(array_agg(photo_url order by delivered_at desc nulls last), null))[1]     as any_photo,
    (array_remove(array_agg(signature_url order by delivered_at desc nulls last), null))[1]  as any_signature
  from public.pods
  group by order_id
)
update public.pods p
set
  photo_url     = coalesce(p.photo_url, m.any_photo),
  signature_url = coalesce(p.signature_url, m.any_signature)
from survivors s
join media m on m.order_id = s.order_id
where p.id = s.id;

-- 2. Delete the non-survivor duplicates.
with ranked as (
  select
    id,
    row_number() over (
      partition by order_id
      order by
        (case when photo_url is not null or signature_url is not null then 0 else 1 end),
        delivered_at desc nulls last,
        id desc
    ) as rn
  from public.pods
)
delete from public.pods p
using ranked r
where p.id = r.id
  and r.rn > 1;

-- 3. Enforce one POD per order going forward. The deliver endpoint reads the
--    existing POD by order_id and updates it in place, so a unique index keeps
--    retries / concurrent submits from ever re-creating duplicates.
create unique index if not exists pods_order_id_key on public.pods(order_id);

COMMIT;
-- ============================================================================
-- DONE. Your schema now matches the application code.
-- ============================================================================
