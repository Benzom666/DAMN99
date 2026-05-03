-- Repair older POD schemas used by the mobile delivery flow.

alter table public.pods add column if not exists photo_url text;
alter table public.pods add column if not exists signature_url text;
alter table public.pods add column if not exists recipient_name text;
alter table public.pods add column if not exists notes text;
alter table public.pods add column if not exists delivered_at timestamptz default now();

create index if not exists idx_pods_order_id on public.pods(order_id);
