-- togo-kanri-tool schema (tk_ prefix, shared Supabase project)
-- Run this once in the Supabase SQL Editor for the shared project.

create table if not exists tk_sites (
  id uuid primary key default gen_random_uuid(),
  repo_name text not null unique,
  display_name text not null,
  domain text,
  github_url text,
  vercel_url text,
  gsc_property text, -- e.g. 'sc-domain:example.jp' or 'https://example.jp/'
  category text,
  is_active boolean not null default true,
  gsc_connected boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tk_gsc_daily (
  id bigint generated always as identity primary key,
  site_id uuid not null references tk_sites(id) on delete cascade,
  date date not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr numeric(8,5) not null default 0,
  position numeric(6,2) not null default 0,
  unique (site_id, date)
);
create index if not exists tk_gsc_daily_site_date_idx on tk_gsc_daily (site_id, date desc);

create table if not exists tk_suggestions (
  id bigint generated always as identity primary key,
  site_id uuid not null references tk_sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  category text not null,
  message text not null,
  is_resolved boolean not null default false
);
create index if not exists tk_suggestions_site_idx on tk_suggestions (site_id, is_resolved);

create table if not exists tk_sync_log (
  id bigint generated always as identity primary key,
  site_id uuid references tk_sites(id) on delete cascade,
  synced_at timestamptz not null default now(),
  status text not null check (status in ('success', 'error')),
  error_message text
);

alter table tk_sites enable row level security;
alter table tk_gsc_daily enable row level security;
alter table tk_suggestions enable row level security;
alter table tk_sync_log enable row level security;

-- Single-admin internal tool: any authenticated user in this Supabase project may read/write.
-- (Server-side routes use the service_role key and bypass RLS entirely; this policy only
-- covers the rare direct-from-browser read via the anon key.)
create policy "authenticated read tk_sites" on tk_sites for select to authenticated using (true);
create policy "authenticated read tk_gsc_daily" on tk_gsc_daily for select to authenticated using (true);
create policy "authenticated read tk_suggestions" on tk_suggestions for select to authenticated using (true);
create policy "authenticated read tk_sync_log" on tk_sync_log for select to authenticated using (true);
