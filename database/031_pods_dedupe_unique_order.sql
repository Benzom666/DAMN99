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
