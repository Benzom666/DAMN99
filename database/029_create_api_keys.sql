-- 029_create_api_keys.sql
-- Admin-issued API keys that authenticate the public /api/v1 surface.
--
-- Each admin can mint one or more keys from Settings. Only a SHA-256 hash of
-- the token is ever stored; the plaintext token is shown to the admin exactly
-- once at creation time. Requests present the token as `Authorization: Bearer
-- <token>` (or `x-api-key`), the server hashes it, and looks the row up here to
-- resolve the owning admin_id — which then drives per-tenant data isolation and
-- HERE cost attribution, exactly like the cookie-session path.
--
-- Idempotent: safe to run multiple times (consolidated apply script / run-migration).

create extension if not exists pgcrypto;

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  key_prefix text not null,          -- e.g. "dos_live_a1b2c3" — safe to display, not secret
  key_hash text not null unique,     -- sha256 hex of the full token; only the hash is stored
  last_four text not null,           -- last 4 chars of the token, for display in the UI
  scopes text[] not null default array['*'],
  last_used_at timestamptz,
  revoked_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_keys_admin on public.api_keys(admin_id, created_at desc);
create unique index if not exists idx_api_keys_hash on public.api_keys(key_hash);

-- Attribute HERE usage to the calling API key so /super-admin/costs can break
-- spend down per key (nullable: cookie-session calls have no key).
alter table public.here_api_usage
  add column if not exists api_key_id uuid references public.api_keys(id) on delete set null;

create index if not exists idx_here_api_usage_api_key_created_at
  on public.here_api_usage(api_key_id, created_at desc);

-- RLS: admins manage only their own keys; super admins can see all. The public
-- API validates keys with the service-role client (which bypasses RLS), so
-- these policies only govern the Settings UI (cookie session).
alter table public.api_keys enable row level security;

drop policy if exists "api_keys_owner_select" on public.api_keys;
create policy "api_keys_owner_select" on public.api_keys for select
  using (admin_id = auth.uid() or public.get_user_role() = 'super_admin');

drop policy if exists "api_keys_owner_insert" on public.api_keys;
create policy "api_keys_owner_insert" on public.api_keys for insert
  with check (admin_id = auth.uid());

drop policy if exists "api_keys_owner_update" on public.api_keys;
create policy "api_keys_owner_update" on public.api_keys for update
  using (admin_id = auth.uid() or public.get_user_role() = 'super_admin')
  with check (admin_id = auth.uid() or public.get_user_role() = 'super_admin');

drop policy if exists "api_keys_owner_delete" on public.api_keys;
create policy "api_keys_owner_delete" on public.api_keys for delete
  using (admin_id = auth.uid() or public.get_user_role() = 'super_admin');
