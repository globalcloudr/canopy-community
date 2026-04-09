# Canopy Community — Agent Guide

This repo is the active Canopy Community product. It is not a starter scaffold anymore.

## Product Purpose

Canopy Community gives school workspaces a Canopy-native place to work with their newsletter program. Today the app focuses on connecting to Campaign Monitor, validating access, and surfacing workspace-specific campaigns, audiences, and templates.

## Current Product Shape

- Product key: `community_canopy`
- Local dev URL: `http://localhost:3003`
- Production URL: `https://canopy-community.vercel.app`
- Portal: `https://usecanopy.school`
- Shared Supabase project with the rest of Canopy

## Core User Flow

1. A school workspace is provisioned for `community_canopy` in `canopy-platform`.
2. The user launches Community from the Portal.
3. Portal creates a product handoff and redirects into Community.
4. Community exchanges the handoff, resolves the active workspace session, and loads workspace data.
5. The workspace enters its Campaign Monitor `Client ID` in Settings.
6. Community uses the shared `CAMPAIGN_MONITOR_API_KEY` plus that `Client ID` to read data for that school.

## Major Files

### App shell and routes

- `app/_components/product-shell.tsx`
- `app/page.tsx`
- `app/campaigns/page.tsx`
- `app/audiences/page.tsx`
- `app/templates/page.tsx`
- `app/settings/page.tsx`

### API routes

- `app/api/app-session/route.ts`
- `app/api/auth/exchange-handoff/route.ts`
- `app/api/community/overview/route.ts`
- `app/api/integrations/campaign-monitor/route.ts`
- `app/api/launcher-products/route.ts`

### Data and integrations

- `lib/community-data.ts`
- `lib/community-schema.ts`
- `lib/campaign-monitor.ts`
- `lib/server-auth.ts`
- `lib/supabase-client.ts`
- `lib/workspace-client.ts`

### SQL

- `docs/sql/2026-04-08-cc-001-campaign-monitor-connections.sql`

## Environment Variables

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3003
NEXT_PUBLIC_PORTAL_URL=https://usecanopy.school
CAMPAIGN_MONITOR_API_KEY=
```

Optional:

```env
CAMPAIGN_MONITOR_API_BASE_URL=https://api.createsend.com/api/v3.3
```

Important:

- `NEXT_PUBLIC_SUPABASE_URL` must use the real `supabase.co` project URL.
- Keep `.env.local` out of git.
- Restart Next after any env change.

## Campaign Monitor Rules

- Prefer the shared master `CAMPAIGN_MONITOR_API_KEY` from environment.
- Store one Campaign Monitor `Client ID` per workspace.
- Treat a per-workspace API key as an override only.
- Validate the client connection server-side before saving it.

## Portal Dependencies

Community depends on `canopy-platform` for:

- authentication
- workspace membership
- product provisioning
- product launch handoffs

Portal must include:

- product registration for `community_canopy`
- a Community launch route
- `COMMUNITY_APP_URL` in environment

The launch-handoff database constraint in Portal must also allow `community_canopy`.

## Local Testing Notes

To test the full launch flow locally:

1. Run `canopy-platform/apps/portal`.
2. Set `COMMUNITY_APP_URL=http://localhost:3003` in the portal `.env.local`.
3. Run Community locally on port `3003`.
4. Launch Community from the local portal while using the target workspace.

Opening Community directly without a valid launch/session can redirect back to the configured portal URL.

## Deployment Notes

- Community is deployed on Vercel.
- Vercel env changes require a redeploy to take effect.
- Production launch depends on both Portal and Community having correct env values.

## Working Agreements For Future Changes

- Keep all Community database access in `lib/community-data.ts`.
- Keep all Campaign Monitor API behavior in `lib/campaign-monitor.ts`.
- Filter all data by `workspace_id`.
- Preserve Canopy handoff auth rather than creating ad hoc auth flows.
- Run `npx tsc --noEmit --incremental false` before considering work done.

## Next Product Phase

The next major implementation area is native newsletter composition and sending inside Community, building on the existing connection and visibility layer.
