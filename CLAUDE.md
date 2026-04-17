# Canopy Community — Agent Guide

This repo is the active Canopy Community product. It is not a starter scaffold anymore.

## Product Purpose

Canopy Community gives school workspaces a Canopy-native place to manage their newsletter program. The app connects to Campaign Monitor, surfaces workspace-specific campaigns, audiences, and templates, and allows users to compose and send HTML newsletters directly from Canopy — without logging into Campaign Monitor.

## Current Product Shape

- Product key: `community_canopy`
- Local dev URL: `http://localhost:3003`
- Production URL: `https://canopy-community.vercel.app`
- Portal: `https://app.usecanopy.school`
- Shared Supabase project with the rest of Canopy

## Core User Flow

1. A school workspace is provisioned for `community_canopy` in `canopy-platform`.
2. The user launches Community from the Portal.
3. Portal creates a product handoff and redirects into Community.
4. Community exchanges the handoff, resolves the active workspace session, and loads workspace data.
5. The workspace enters its Campaign Monitor `Client ID` in Settings.
6. Community uses the shared `CAMPAIGN_MONITOR_API_KEY` plus that `Client ID` to read and send data for that school.
7. Users compose campaigns by uploading an HTML file, selecting subscriber lists, and sending or saving as a draft.

## Major Files

### App shell and routes

- `app/_components/product-shell.tsx`
- `app/page.tsx` — dashboard (Drafts, Sent, Lists)
- `app/campaigns/page.tsx`
- `app/audiences/page.tsx`
- `app/templates/page.tsx`
- `app/settings/page.tsx`
- `app/compose/page.tsx` — native campaign compose and send

### API routes

- `app/api/app-session/route.ts`
- `app/api/auth/exchange-handoff/route.ts`
- `app/api/community/overview/route.ts`
- `app/api/community/compose/route.ts` — create and send campaigns
- `app/api/integrations/campaign-monitor/route.ts`
- `app/api/launcher-products/route.ts`

### Data and integrations

- `lib/community-data.ts` — all DB access and campaign orchestration
- `lib/community-schema.ts` — shared TypeScript types
- `lib/campaign-monitor.ts` — all Campaign Monitor API calls
- `lib/server-auth.ts`
- `lib/supabase-client.ts`
- `lib/workspace-client.ts`

### UI components

- `app/_components/community-nav.tsx` — sidebar nav items
- `app/_components/community-ui.tsx` — shared UI primitives
- `app/_components/community-sections.tsx` — page-level section components
- `app/_components/community-data.tsx` — client-side data hooks

### SQL

- `docs/sql/2026-04-08-cc-001-campaign-monitor-connections.sql`
- `docs/sql/2026-04-08-cc-002-html-upload-bucket.sql`
- `docs/sql/2026-04-10-cc-003-community-templates.sql`

## Environment Variables

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3003
NEXT_PUBLIC_PORTAL_URL=https://app.usecanopy.school
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
- CM returns client details (name, country, timezone) nested under `BasicDetails` in `GET /clients/{clientId}.json`.
- CM assigns per-account sending domain addresses (e.g. `SMACE_info@ditnld.createsend7.com`). These are not exposed via the API — pre-populate from/reply-to fields using the most recent sent campaign's `fromEmail`.
- Campaign creation requires an `HtmlUrl` (a publicly accessible URL). Use a signed Supabase Storage URL.
- Billing is pay-per-subscriber. Calculate estimated cost as `recipients × BaseRatePerRecipient` from `GET /clients/{clientId}.json` → `BillingDetails`.

## Campaign Compose Flow

The compose page (`/compose`) handles the full send lifecycle:

1. User uploads an HTML file (read client-side via `FileReader`, previewed in an iframe).
2. User fills subject, from name, from email, reply-to, and selects one or more lists.
3. User enters a confirmation email address and reviews estimated cost before sending.
4. On submit, the API route (`POST /api/community/compose`) calls `composeCampaign()` in `lib/community-data.ts`.
5. `composeCampaign()` orchestrates:
   - Upload HTML to private Supabase Storage bucket (`community-html-uploads`)
   - Generate a 15-minute signed URL
   - Create the campaign in CM via `POST /campaigns/{clientId}.json` using the signed URL as `HtmlUrl`
   - Send immediately via `POST /campaigns/{campaignId}/send.json` (skipped if `draft: true`)
   - Delete the HTML file from storage in a `finally` block (always runs)
6. Draft saves skip the send step and skip `confirmationEmail` validation.

The compose flow can also start from a saved Community template instead of only a raw HTML upload.

## Template Management

Templates are stored in the `community_templates` table and managed from `/templates`.

- `GET /api/community/templates` loads workspace templates
- `POST /api/community/templates` creates a template
- `PATCH /api/community/templates/:id` updates name, design JSON, or HTML preview
- `DELETE /api/community/templates/:id` removes a template

The compose page can load a saved template into the editor for reuse.

## Storage Security

The `community-html-uploads` Supabase Storage bucket is **private** (`public: false`).

- Files are uploaded server-side using the service role key.
- Access is via signed URLs with a 15-minute expiry — sufficient for Campaign Monitor to fetch the HTML.
- Files are deleted immediately after campaign creation, whether the send succeeds or fails.
- Storage should be near-empty at all times.
- No RLS policies are needed; the service role bypasses RLS.

## Workspace Isolation

Every API route calls `requireWorkspaceAccess(request, workspaceId)` before touching any data. All Campaign Monitor data is scoped to the workspace's stored `Client ID`. No cross-workspace data access is possible.

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
- The `community-html-uploads` Supabase Storage bucket must be created before compose/send can work (run `docs/sql/2026-04-08-cc-002-html-upload-bucket.sql`).

## Working Agreements For Future Changes

- Keep all Community database access in `lib/community-data.ts`.
- Keep all Campaign Monitor API behavior in `lib/campaign-monitor.ts`.
- Filter all data by `workspace_id`.
- Preserve Canopy handoff auth rather than creating ad hoc auth flows.
- Run `npx tsc --noEmit --incremental false` before considering work done.

## Next Product Phase

- Subscriber management (add/remove/search subscribers within Canopy)
- Campaign analytics detail view (per-campaign recipient list, click map)
- Richer dashboard actions and send workflow polish
