# Canopy Community

Newsletter and community communications product for the Canopy portfolio.

**Status**: Early product foundation with Campaign Monitor integration

## What's Included

- Next.js 16, React 19, TypeScript, Tailwind v4, Node 20
- `@canopy/ui` v0.1.4 vendored
- Portal handoff exchange fully wired
- Server-backed workspace session
- In-app product switcher
- Portal return flow
- Centralized server auth pattern
- Workspace-scoped Campaign Monitor connection storage
- Community dashboard, campaigns, audiences, templates, and settings pages
- Server routes for Campaign Monitor overview + connection validation

## Current Direction

Canopy Community uses each school's existing Campaign Monitor account.
The app stores a workspace-scoped `client_id` and API key, validates the
connection server-side, then reads newsletter lists, templates, and campaigns
through the Campaign Monitor API.

Recommended setup:
- store one master `CAMPAIGN_MONITOR_API_KEY` in the app environment
- save each school's Campaign Monitor `Client ID` per workspace in Community settings
- use a workspace-specific API key only if you need an override

SQL for the first integration table lives in:

```bash
docs/sql/2026-04-08-cc-001-campaign-monitor-connections.sql
```

## How to Run

```bash
cp .env.local.example .env.local
# fill in Supabase credentials
npm install
npm run dev     # localhost:3003
```

Requires Node 20 (pinned in `.nvmrc`).

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3003
NEXT_PUBLIC_PORTAL_URL=https://usecanopy.school
CAMPAIGN_MONITOR_API_KEY=
CAMPAIGN_MONITOR_API_BASE_URL=https://api.createsend.com/api/v3.3
```
