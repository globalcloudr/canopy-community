# Canopy Community — Progress

Append new sessions at the top. Do not overwrite history.

## Current Roadmap

Near-term product work:

- Improve the dashboard so it highlights what needs attention and what staff should do next
- Refine the compose and send workflow for school staff, including clearer draft, schedule, and confirmation states
- Expand template workflows with better starter-template support and smoother reuse across campaigns

Future phases:

- Subscriber management inside Canopy Community
- Deeper campaign analytics and per-campaign reporting
- More polished school-facing workflow guidance across the app

---

## 2026-04-17 — Move roadmap out of README

Adjusted the docs split so `README.md` stays factual and `docs/progress.md` holds the forward-looking roadmap.

### What changed

- Removed the roadmap section from `README.md`
- Added a persistent `Current Roadmap` section to `docs/progress.md`
- Corrected the templates route in `README.md` from `PATCH` to `PUT`

### Notes

- `README.md` should describe what exists right now
- `docs/progress.md` should carry roadmap, open items, and recent decisions

---

## 2026-04-10 — Docs aligned to current repo state

Reviewed the repo docs against the actual codebase and updated the product docs to match current behavior.

### What changed

- Updated `README.md` to reflect that native compose/send is now implemented
- Added `/compose`, template APIs, and newer SQL migrations to the route and setup docs
- Documented Community-managed templates and the current send workflow
- Updated `CLAUDE.md` to include `community_templates` and template API behavior
- Removed stale language that still described compose/send as a future phase

### Notes

- The repo now supports both Campaign Monitor account visibility and native newsletter composition
- Community templates are first-class repo features and need to be represented in setup docs
- SQL setup now requires more than the original connection migration

---

## 2026-04-09 — Native compose, UI redesign, and storage security

Built campaign compose/send, redesigned the UI to match Campaign Monitor's layout, tightened storage security, and fixed Campaign Monitor API response mapping.

### What changed

**Campaign compose and send (`/compose`)**
- New page at `app/compose/page.tsx` with two-column layout: form left, HTML preview right
- HTML file upload via `<input type="file">` read client-side with `FileReader`, previewed in a sandboxed iframe
- `ListMultiSelect` component: compact dropdown trigger, "All lists" indeterminate checkbox, per-list subscriber counts, recipient total footer
- From name / from email / reply-to pre-populated from last sent campaign (`sentCampaigns[0]`) using `useRef` guard to avoid overwriting user edits
- Billing-aware confirmation panel before sending: estimated cost (`recipients × BaseRatePerRecipient`), credit balance, red warning if credits are insufficient
- "Save as draft" flow: skips send step and skips `confirmationEmail` validation
- New API route: `POST /api/community/compose`
- New nav item: "New campaign" linking to `/compose`

**Campaign Monitor API additions (`lib/campaign-monitor.ts`)**
- `createCampaignMonitorCampaign()` — `POST /campaigns/{clientId}.json`
- `sendCampaignMonitorCampaign()` — `POST /campaigns/{campaignId}/send.json`
- `scheduleCampaignMonitorCampaign()` — `POST /campaigns/{campaignId}/schedule.json`
- `getCampaignMonitorListStats()` — `GET /lists/{listId}/stats.json` for subscriber counts
- `getCampaignMonitorClientBilling()` — `BillingDetails` from `GET /clients/{clientId}.json`
- Fixed `openRate`/`clickRate` to use `computeRate()` (was returning raw counts)
- Fixed `BasicDetails` mapping for `GET /clients/{clientId}.json` — country and timezone are nested under `BasicDetails`, not at the root level

**Storage security**
- `community-html-uploads` bucket changed to **private** (`public: false`)
- Upload generates a 15-minute signed URL passed to CM as `HtmlUrl`
- File deleted in `finally` block after CM campaign creation, regardless of send outcome
- `uploadCampaignHtmlForSend()` and `deleteCampaignHtml()` added to `lib/community-data.ts`
- SQL updated: `docs/sql/2026-04-08-cc-002-html-upload-bucket.sql`

**UI redesign to match Campaign Monitor layout**
- Dashboard: removed Templates section, capped Drafts/Sent/Lists at 3 rows each
- Sent rows: stacked stat blocks (number + label) for Recipients / Opened / Clicked
- List rows: each row is a clickable link to `/audiences`, subscriber count stacked
- `CampaignTable` in `community-sections.tsx`: HTML `<table>` with hover actions dropdown
- `PageHeader` replaced gradient `PageIntro` (flat, plain text)
- All border radii flattened to `rounded-lg`

**Community detail page in Portal (`canopy-platform`)**
- Added `CommunityDetailPage` component to `apps/portal/src/app/(portal)/app/products/[slug]/page.tsx`
- Matches Stories and Reach layout: header, "How it works" 3-step section, highlights, CTA card
- Replaces the generic "Coming soon" fallback for `community_canopy`

### Notes

- CM does not expose sending domain addresses via API. Pre-populate from/reply-to from `sentCampaigns[0].fromEmail`.
- Option B (`fromtemplate`) is not viable — CM only supports it for coded HTML templates with CM editable tags, not Email Builder templates.
- Storage is near-empty at all times; files live only for the duration of campaign creation.
- All data remains workspace-isolated; `requireWorkspaceAccess()` is called on every API route.

---

## 2026-04-08 — Documentation refresh and launch notes

Updated the repo docs so they describe the actual Community product instead of the original scaffold.

### What changed

- Rewrote `README.md` with product-specific setup, routes, env vars, and deployment guidance
- Replaced scaffold instructions in `CLAUDE.md` with Community-specific architecture and workflow notes
- Documented the shared master Campaign Monitor key model with per-workspace `Client ID`
- Added explicit notes about Portal provisioning, `COMMUNITY_APP_URL`, and launch handoff dependencies
- Captured important troubleshooting context around Supabase URL format and Vercel redeploy requirements

### Notes

- Community depends on both Portal provisioning and Portal launch config to open correctly for a workspace
- `NEXT_PUBLIC_SUPABASE_URL` must use the real Supabase project URL on `supabase.co`
- Direct opens without a valid session can redirect back to the configured portal URL

---

## 2026-04-08 — Community foundation + Campaign Monitor integration

Turned the starter scaffold into the first real `Canopy Community` app slice.

### What changed

- Rebranded shell, metadata, product identity, and navigation for Canopy Community
- Set product key to `community_canopy` in session and handoff routes
- Added `lib/campaign-monitor.ts` for authenticated Campaign Monitor API access
- Added `lib/community-data.ts` and `lib/community-schema.ts`
- Added `GET /api/community/overview`
- Added `GET/PUT/DELETE /api/integrations/campaign-monitor`
- Built dashboard, campaigns, audiences, templates, and settings pages
- Added SQL for `community_campaign_monitor_connections`
- Updated README, package name, and `.env.local.example`
- Refactored Campaign Monitor auth for one shared master API key plus per-workspace `Client ID`

### Notes

- This slice focuses on connection + visibility first: account validation, recent campaigns, lists, and templates
- Native campaign creation/sending inside Community is the logical next phase

---

## 2026-04-06 — Bumped to @canopy/ui v0.1.4

Updated scaffold to `@canopy/ui` v0.1.4. New in 0.1.4: `Alert` component with `info`, `success`, `error`, `warning` variants.

---

## 2026-04-06 — Initial scaffold created

Built the canonical scaffold for new Canopy products at `/Code/canopy-product-starter/`.

### What was built

- Full Next.js 16 / React 19 / TypeScript / Tailwind v4 / Node 20 stack
- `@canopy/ui` v0.1.3 vendored — includes new `DashboardHero` component
- `app/_components/product-shell.tsx` — complete shell with:
  - Portal handoff exchange on `?launch=` param
  - Server-backed session loading from `/api/app-session`
  - Super admin workspace redirect (injects `?workspace=` if missing)
  - `CanopyHeader` with workspace switcher and product launcher
  - Sidebar with configurable nav items
  - Portal return via `POST /auth/portal-return`
  - Cross-product switching via `POST /auth/product-launch`
- `app/api/app-session/route.ts` — workspace session filtered by product entitlement
- `app/api/auth/exchange-handoff/route.ts` — Portal launch code exchange
- `app/api/launcher-products/route.ts` — entitled products for the switcher
- `lib/server-auth.ts` — `requireWorkspaceAccess`, `getRequestAccess`, `toErrorResponse`
- `lib/product-data.ts` — data layer skeleton with workspace-scoped query pattern
- `lib/supabase-client.ts` — lazy anon client singleton
- `lib/workspace-href.ts` — `buildWorkspaceHref()` for operator nav
- `lib/workspace-client.ts` — localStorage workspace tracking + `useWorkspaceId` hook
- `app/page.tsx` — dashboard with `DashboardHero` and placeholder stat cards
- Complete docs: `CLAUDE.md` (forking checklist + architecture rules), `README.md`

### @canopy/ui v0.1.3

Bumped from 0.1.2. Added `DashboardHero`:
- Navy-to-blue gradient banner (`#0f172a` → `#1a3260` → `#2563eb`)
- Eyebrow, headline, subheading, CTA button, illustration slot
- White CTA button on dark background
- Decorative radial blur accents
- Exported from `packages/ui/src/index.ts`

### Verification
- `@canopy/ui` v0.1.3 built and packed successfully
- All scaffold files created at `/Code/canopy-product-starter/`
