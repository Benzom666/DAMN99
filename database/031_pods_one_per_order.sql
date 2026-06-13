-- ============================================================================
-- SCRIPT 031: ONE POD ROW PER ORDER
-- ============================================================================
-- Root cause of "delivery photos / signature don't show up later":
-- /api/driver/deliver inserted a NEW pods row on every delivery. With the
-- failed-delivery retry flow (script 030) and any double-submit, an order
-- could accumulate several pods rows. The driver stop view read a single POD
-- per order with `.maybeSingle()`, which returns nothing when more than one
-- row matches, so previously-uploaded media became invisible. Admin views
-- could likewise pick an empty duplicate row.
--
-- This migration is idempotent and additive:
--   1. Collapse duplicate pods rows down to one per order, preserving any
--      stored media and the most recent metadata.
--   2. Add a UNIQUE constraint on pods(order_id) so duplicates can't return.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COLLAPSE DUPLICATES
-- ----------------------------------------------------------------------------
-- For each order, keep one canonical pods row (the most recently delivered),
-- backfill any media/metadata it is missing from its siblings, then delete the
-- siblings. on delete cascade is not involved (pods has no children here).

DO $$
DECLARE
  rec RECORD;
  keeper UUID;
BEGIN
  FOR rec IN
    SELECT order_id
      FROM public.pods
     GROUP BY order_id
    HAVING COUNT(*) > 1
  LOOP
    -- Pick the keeper: prefer a row that has media, then the newest.
    SELECT id INTO keeper
      FROM public.pods
     WHERE order_id = rec.order_id
     ORDER BY (photo_url IS NOT NULL OR signature_url IS NOT NULL) DESC,
              delivered_at DESC NULLS LAST
     LIMIT 1;

    -- Backfill any missing fields on the keeper from its siblings.
    UPDATE public.pods k
       SET photo_url      = COALESCE(k.photo_url,      s.photo_url),
           signature_url  = COALESCE(k.signature_url,  s.signature_url),
           recipient_name = COALESCE(k.recipient_name, s.recipient_name),
           notes          = COALESCE(k.notes,          s.notes)
      FROM (
            SELECT
              MAX(photo_url)      AS photo_url,
              MAX(signature_url)  AS signature_url,
              MAX(recipient_name) AS recipient_name,
              MAX(notes)          AS notes
            FROM public.pods
            WHERE order_id = rec.order_id
              AND id <> keeper
           ) s
     WHERE k.id = keeper;

    -- Remove the now-redundant sibling rows.
    DELETE FROM public.pods
     WHERE order_id = rec.order_id
       AND id <> keeper;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. ENFORCE ONE POD PER ORDER GOING FORWARD
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_pods_order_id ON public.pods(order_id);

COMMENT ON INDEX public.uq_pods_order_id IS
  'One proof-of-delivery row per order. Application reuses the existing row instead of inserting duplicates.';
