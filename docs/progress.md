# Canopy Community — Progress

Append new sessions at the top. Do not overwrite history.

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
