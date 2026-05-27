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
