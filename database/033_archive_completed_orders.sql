-- 033_archive_completed_orders.sql
--
-- When a route is marked completed, its delivered orders are archived off the
-- active order manifest (they remain in route_history and stay queryable).
-- Adds the column the app sets/filters on. Idempotent.

alter table public.orders add column if not exists archived_at timestamptz;
create index if not exists idx_orders_archived_at on public.orders(archived_at);

comment on column public.orders.archived_at is
  'Set when the order''s route is completed (delivered orders). Archived orders are hidden from the active manifest but preserved in route_history and still queryable.';
