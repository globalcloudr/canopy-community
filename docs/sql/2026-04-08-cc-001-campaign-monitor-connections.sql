create table if not exists public.community_campaign_monitor_connections (
  workspace_id uuid primary key references public.organizations(id) on delete cascade,
  client_id text not null,
  api_key text,
  auth_type text not null default 'api_key',
  account_name text,
  country text,
  timezone text,
  last_validated_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_campaign_monitor_connections_client_idx
  on public.community_campaign_monitor_connections (client_id);

alter table public.community_campaign_monitor_connections enable row level security;

drop policy if exists community_campaign_monitor_connections_no_direct_access
  on public.community_campaign_monitor_connections;

create policy community_campaign_monitor_connections_no_direct_access
on public.community_campaign_monitor_connections
for all
using (false)
with check (false);
