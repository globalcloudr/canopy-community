# Canopy Community

Canopy Community is the school newsletter product in the Canopy portfolio. It lets Canopy workspaces connect a Campaign Monitor client, create and send newsletters from Canopy, review newsletter activity, and manage reusable templates.

**Live URL**: https://canopy-community.vercel.app
**Status**: Beta

## Current Scope

- Portal handoff and workspace-aware app shell
- Dashboard with Canopy drafts, sent campaigns, and mailing lists
- Campaigns, compose, audiences, templates, and settings pages
- Workspace-scoped Campaign Monitor connection storage
- Shared master Campaign Monitor API key support with per-workspace `Client ID`
- Native campaign compose and send flow backed by Campaign Monitor
- Campaign name field, billing-aware confirmation, and scheduled sends
- Workspace-scoped reusable templates stored in Supabase
- Canopy-managed drafts stored in Supabase — resume from anywhere via `/compose?draft=<id>`
- Paginated sent campaigns list with per-campaign analytics slide-out drawer

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase
- Campaign Monitor API
- `react-email-editor` for the template builder
- `@globalcloudr/canopy-ui` v0.2.9 — the shared Canopy design system, installed from npm

## Shared UI

`@globalcloudr/canopy-ui` v0.2.9 — used for the shared shell frame, sidebar structure, design tokens, font ownership, and product switcher. Per-product accent color is set via `.product-community { --accent: ... }` in globals.

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

Apply all Community setup migrations in order before testing real data:

```bash
docs/sql/2026-04-08-cc-001-campaign-monitor-connections.sql
docs/sql/2026-04-08-cc-002-html-upload-bucket.sql
docs/sql/2026-04-10-cc-003-community-templates.sql
docs/sql/2026-04-17-cc-004-fix-api-key-nullable.sql
docs/sql/2026-04-17-cc-005-community-campaigns-drafts.sql
```

These create or patch:

- `community_campaign_monitor_connections` — workspace connection storage
- `community-html-uploads` — private storage bucket for temporary HTML upload handoff to Campaign Monitor
- `community_templates` — saved reusable templates inside Canopy
- `api_key` nullable patch — drops the NOT NULL constraint that blocked saving connections without a workspace key override
- `community_campaigns` — Canopy-managed draft campaign storage (status, content, send metadata)

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
- `GET /api/community/campaigns` — paginated sent campaigns
- `GET /api/community/campaigns/:id/analytics` — per-campaign analytics
- `GET/POST /api/community/drafts` — Canopy-managed drafts
- `GET/PATCH/DELETE /api/community/drafts/:id`
- `GET/POST /api/community/templates`
- `PUT/DELETE /api/community/templates/:id`
- `GET/PUT/DELETE /api/integrations/campaign-monitor`

## Compose And Send

Community supports a full native newsletter workflow inside the app.

Current flow:

- open `New campaign`
- enter an internal campaign name
- choose or build a template, or upload HTML
- select one or more subscriber lists
- review estimated send cost
- save as draft (stored in Canopy), send immediately, or schedule

Drafts are stored in Supabase and can be reopened from the Campaigns page via a "Continue" link, which opens `/compose?draft=<id>` and restores all fields. Drafts are automatically deleted when the campaign is sent.

Campaigns are sent through Campaign Monitor. Community is the authoring and workflow layer on top of that account.

## Templates

Community templates are stored in Supabase and managed from the Templates page.

Current template capabilities:

- create a reusable template
- edit template content in the builder
- rename, duplicate, and delete templates
- load a saved template into the compose flow

## Campaign Analytics

Clicking any sent campaign row on the Campaigns page opens a slide-out drawer with:

- **Engagement** — open rate, click rate, clicks-to-opens, unique opens, unique clicks, recipients
- **Delivery** — bounced, unsubscribed, spam complaints
- **Reactions** — forwards, likes, mentions
- **Top Links** — clicked URLs with total and unique click counts

A footer link opens the full report in Campaign Monitor for the graph and engagement score.

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
