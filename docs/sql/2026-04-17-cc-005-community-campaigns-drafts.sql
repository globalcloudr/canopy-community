-- Canopy-managed campaign drafts.
-- Stores draft state locally so users can reopen and continue editing in Canopy.
-- Records are deleted when the campaign is sent — CM remains the source of truth for sent campaigns.

create table if not exists public.community_campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.organizations(id) on delete cascade,
  name text not null default '',
  subject text not null default '',
  from_name text not null default '',
  from_email text not null default '',
  reply_to text not null default '',
  list_ids text[] not null default '{}',
  html_content text,
  design_json jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_campaigns_workspace_idx
  on public.community_campaigns (workspace_id, status, updated_at desc);

alter table public.community_campaigns enable row level security;

drop policy if exists community_campaigns_no_direct_access
  on public.community_campaigns;

create policy community_campaigns_no_direct_access
  on public.community_campaigns
  for all
  using (false)
  with check (false);
