-- GA4 support for togo-kanri-tool. Run once in the Supabase SQL Editor.

alter table tk_sites add column if not exists ga4_property_id text;
alter table tk_sites add column if not exists ga4_connected boolean not null default false;

create table if not exists tk_ga4_daily (
  id bigint generated always as identity primary key,
  site_id uuid not null references tk_sites(id) on delete cascade,
  date date not null,
  sessions integer not null default 0,
  active_users integer not null default 0,
  page_views integer not null default 0,
  engagement_rate numeric(6,4) not null default 0,
  unique (site_id, date)
);
create index if not exists tk_ga4_daily_site_date_idx on tk_ga4_daily (site_id, date desc);

alter table tk_ga4_daily enable row level security;
create policy "authenticated read tk_ga4_daily" on tk_ga4_daily for select to authenticated using (true);
