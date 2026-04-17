# Canopy Community

Canopy Community is the school newsletter product in the Canopy portfolio. It lets Canopy workspaces connect a Campaign Monitor client, create and send newsletters from Canopy, review newsletter activity, and manage reusable templates.

## Current Scope

- Portal handoff and workspace-aware app shell
- Dashboard with drafts, sent campaigns, and mailing lists
- Campaigns, compose, audiences, templates, and settings pages
- Workspace-scoped Campaign Monitor connection storage
- Shared master Campaign Monitor API key support with per-workspace `Client ID`
- Native campaign compose and send flow backed by Campaign Monitor
- Workspace-scoped reusable templates stored in Supabase
- Billing-aware send confirmation and scheduled sends

This repo now includes the first working compose/send flow. Subscriber management and deeper analytics are still future phases.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase
- Campaign Monitor API
- `react-email-editor` for the template builder
- `@canopy/ui` v0.1.4 vendored locally

## Local Development

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Local dev runs on `http://localhost:3003`.

Use Node 20 as pinned in [.nvmrc](/Users/zylstra/Code/canopy-community/.nvmrc).

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

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` should use your actual Supabase project URL on `supabase.co`.
- `CAMPAIGN_MONITOR_API_KEY` is intended to be the shared master account key.
- Each school workspace typically stores its own Campaign Monitor `Client ID`, not its own API key.

## Campaign Monitor Model

Canopy Community supports the common Canopy setup where one master Campaign Monitor account contains multiple client accounts.

Recommended setup:

- store one shared `CAMPAIGN_MONITOR_API_KEY` in the app environment
- save the correct Campaign Monitor `Client ID` per workspace in Community Settings
- use the optional per-workspace API key field only if a workspace needs an override

The Settings page validates the connection server-side before saving it.

## Required Database Setup

Apply all Community setup migrations before testing real data:

```bash
docs/sql/2026-04-08-cc-001-campaign-monitor-connections.sql
docs/sql/2026-04-08-cc-002-html-upload-bucket.sql
docs/sql/2026-04-10-cc-003-community-templates.sql
```

These create:

- `community_campaign_monitor_connections` for workspace connection storage
- `community-html-uploads` storage bucket for temporary HTML upload handoff
- `community_templates` for saved reusable templates inside Canopy

## Routes

Workspace routes:

- `/`
- `/campaigns`
- `/compose`
- `/audiences`
- `/templates`
- `/settings`

API routes:

- `GET /api/app-session`
- `POST /api/auth/exchange-handoff`
- `GET /api/launcher-products`
- `GET /api/community/overview`
- `POST /api/community/compose`
- `GET/POST /api/community/templates`
- `PUT/DELETE /api/community/templates/:id`
- `GET/PUT/DELETE /api/integrations/campaign-monitor`

## Compose And Send

Community now supports a native newsletter workflow inside the app.

Current flow:

- open `New campaign`
- choose or build a template
- upload or edit newsletter HTML
- select one or more subscriber lists
- review estimated send cost
- save as draft, send immediately, or schedule

Campaigns are still sent through Campaign Monitor. Community is the authoring and workflow layer on top of that account.

## Templates

Community templates are stored in Supabase and managed from the Templates page.

Current template capabilities:

- create a reusable template
- edit template content in the builder
- rename, duplicate, and delete templates
- load a saved template into the compose flow

## Portal Integration

Community is launched from `canopy-platform` using Canopy's product handoff flow.

For a workspace to access Community:

- the workspace must be provisioned with `community_canopy`
- the Portal app must know the Community app URL
- the Community app must share the same Supabase project as the rest of Canopy

Local portal setup:

```env
COMMUNITY_APP_URL=http://localhost:3003
```

Production portal setup:

```env
COMMUNITY_APP_URL=https://canopy-community.vercel.app
```

Directly opening Community without a valid handoff or session will send the user back to the configured portal URL.

## Deployment Notes

Community is designed to run on Vercel.

Before testing production:

- confirm `NEXT_PUBLIC_APP_URL` matches the deployed Community URL
- confirm `NEXT_PUBLIC_PORTAL_URL` matches the deployed portal URL
- confirm `NEXT_PUBLIC_SUPABASE_URL` uses the real `supabase.co` project URL
- confirm the Community storage bucket and template table migrations have been applied
- redeploy after any Vercel environment variable change

## Verification

Type-check the app with:

```bash
npx tsc --noEmit --incremental false
```
