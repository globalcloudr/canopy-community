-- Community Templates
-- Stores Unlayer email template designs per workspace.
-- Service role only — RLS denies all direct access.

create table if not exists public.community_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  design_json jsonb not null default '{}'::jsonb,
  html_preview text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_templates_workspace_idx
  on public.community_templates (workspace_id);

alter table public.community_templates enable row level security;

create policy community_templates_no_direct_access
  on public.community_templates
  for all
  using (false)
  with check (false);
