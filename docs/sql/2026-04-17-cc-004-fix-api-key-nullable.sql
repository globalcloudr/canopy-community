-- Fix: api_key column should allow NULL values.
-- The shared CAMPAIGN_MONITOR_API_KEY env var is the primary auth method;
-- a per-workspace api_key is only needed as an override.
-- If a NOT NULL constraint was added after the initial migration, this removes it.

alter table public.community_campaign_monitor_connections
  alter column api_key drop not null;
