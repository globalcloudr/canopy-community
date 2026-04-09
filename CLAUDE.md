# Canopy Product Starter — Agent Guide

This is the **canonical scaffold** for new Canopy products. Fork this repo to start a new product. Every product in the Canopy platform must start from this scaffold — not from copying an existing product.

## What This Scaffold Provides

- Next.js 16, React 19, TypeScript, Tailwind v4, Node 20
- `@canopy/ui` vendored and integrated (navy/blue design tokens, shared shell components)
- Full Portal handoff exchange wired up and working
- Server-backed workspace session (`/api/app-session`)
- In-app product switcher via Portal (`/api/launcher-products`)
- Portal return flow
- Centralized server auth (`lib/server-auth.ts`)
- Workspace-scoped data layer pattern (`lib/product-data.ts`)
- `DashboardHero` component with navy-to-blue gradient on the dashboard page

## How to Fork for a New Product

1. **Copy this folder** to `/Users/zylstra/Code/canopy-[product-name]/`
2. **Set the product key** — search for `your_product_key` and replace with the real key in:
   - `app/api/auth/exchange-handoff/route.ts`
   - `app/api/app-session/route.ts`
3. **Update product identity** in `app/_components/product-shell.tsx`:
   - `PRODUCT_NAME` → your product's display name
   - `PRODUCT_COLOR` → accent color (default is `#2563eb` blue, keep unless product has a specific color)
4. **Register the product key** in `canopy-platform/apps/portal/src/lib/products.ts`
5. **Add a launch route** in `canopy-platform/apps/portal/src/app/auth/launch/[product]/route.ts`
6. **Rename `lib/product-data.ts`** to `lib/[product]-data.ts` and add your tables
7. **Replace nav items** in `app/page.tsx` with your product's navigation
8. **Update storage key** in `lib/workspace-client.ts` (`ACTIVE_ORG_KEY`)
9. **Update `package.json`** name and description
10. **Update CLAUDE.md, README.md, docs/progress.md** with product-specific content

## Repos

| Repo | Purpose | Live URL |
|---|---|---|
| `canopy-platform` | Portal, identity, entitlements, provisioning, launch | `https://usecanopy.school` |
| `photovault` | PhotoVault by Canopy | `https://photovault.school` |
| `canopy-stories` | Canopy Stories | `https://canopy-stories.vercel.app` |
| `canopy-reach` | Canopy Reach | `https://canopy-reach.vercel.app` |

All repos share one Supabase project.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Node 20
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` — no `tailwind.config.js`)
- **UI**: `@canopy/ui` vendored from `vendor/canopy-ui-0.1.4.tgz`
- **Auth/DB**: Supabase (shared project)
- **Deployment**: Vercel

## App Structure

```
canopy-product-starter/
  app/
    _components/
      product-shell.tsx     — root layout: top bar, sidebar, handoff, session, portal actions
    api/
      app-session/          — workspace session endpoint (filter by product entitlement)
      auth/exchange-handoff/ — Portal launch code exchange
      launcher-products/    — entitled products for in-app switcher
    globals.css             — Tailwind v4 + @canopy/ui tokens
    layout.tsx              — root HTML layout
    page.tsx                — dashboard page with DashboardHero + navItems
  lib/
    product-data.ts         — data access layer (all Supabase calls go here)
    server-auth.ts          — server-side auth: requireWorkspaceAccess, getRequestAccess
    supabase-client.ts      — lazy Supabase singleton for client-side use
    workspace-client.ts     — localStorage workspace tracking + useWorkspaceId hook
    workspace-href.ts       — buildWorkspaceHref() for operator nav links
  vendor/
    canopy-ui-0.1.4.tgz    — vendored @canopy/ui
  .env.local.example
  .nvmrc                    — Node 20
```

## Key Source Files

| File | Purpose |
|---|---|
| `app/_components/product-shell.tsx` | Root layout — handoff exchange, session load, shell render |
| `app/api/app-session/route.ts` | Server session — user, active workspace, operator flag |
| `app/api/auth/exchange-handoff/route.ts` | Exchanges Portal launch code for session tokens |
| `app/api/launcher-products/route.ts` | Returns launchable products for workspace switcher |
| `lib/server-auth.ts` | `requireWorkspaceAccess`, `getRequestAccess`, `toErrorResponse` |
| `lib/product-data.ts` | All Supabase read/write operations |
| `lib/supabase-client.ts` | Lazy Supabase anon client singleton |
| `lib/workspace-href.ts` | `buildWorkspaceHref()` — preserves ?workspace= across nav |

## Routes

### Workspace (authenticated)
| Route | Description |
|---|---|
| `/` | Dashboard with DashboardHero |
| `/settings` | Workspace settings placeholder |

### API
| Route | Description |
|---|---|
| `GET /api/app-session` | Server-backed session — user, workspaces, operator flag |
| `POST /api/auth/exchange-handoff` | Exchange Portal launch code for session tokens |
| `GET /api/launcher-products` | Launchable products for the workspace switcher |

## Portal Integration

**Launch flow**:
1. User launches from Portal → Portal creates handoff row in `product_launch_handoffs`
2. Portal redirects to this product with `?launch=<code>&workspace=<slug>`
3. `ProductShell` calls `POST /api/auth/exchange-handoff` to exchange the code
4. Shell calls `GET /api/app-session` to resolve workspace context
5. Super admins get `?workspace=<slug>` injected into the URL if missing

**Switcher flow**:
- Product switching: POST to `${PORTAL_URL}/auth/product-launch`
- Portal return: POST to `${PORTAL_URL}/auth/portal-return`
- Both use 303 semantics so the browser follows with a GET

## Data Layer Rules

- All Supabase calls live in `lib/product-data.ts` (rename to `lib/[product]-data.ts`)
- Every query must filter by `workspace_id`
- Use the service-role client for server-side operations
- Use the anon client (`lib/supabase-client.ts`) for client-side reads
- Enable RLS on all product tables
- Use workspace-scoped storage paths: `{workspaceId}/...`

## @canopy/ui

Vendored at `vendor/canopy-ui-0.1.4.tgz`. Source of truth: `canopy-platform/packages/ui/`.

**Exports**: `Alert`, `Button`, `Badge`, `Input`, `Avatar`, `Card`, `Dialog`, `DropdownMenu`, `IconButton`, `Label`, `MenuSurface`, `SegmentedToggle`, `Select`, `Separator`, `Textarea`, `Typography`, `CanopyHeader`, `AppSurface`, `AppPill`, `DashboardHero`, `cn()`

**Refreshing the vendored package** after UI changes:
```bash
cd /Users/zylstra/Code/canopy-platform/packages/ui
npm run build && npm pack

cd /Users/zylstra/Code/canopy-[your-product]
cp /Users/zylstra/Code/canopy-platform/packages/ui/canopy-ui-0.1.4.tgz ./vendor/
npm install
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PORTAL_URL=https://usecanopy.school
```

## Local Dev

```bash
node --version  # must be 20.x (see .nvmrc)
cp .env.local.example .env.local
# fill in Supabase credentials
npm install
npm run dev     # runs at localhost:3000
```

## Architecture Rules

**This scaffold owns:**
- Product shell, session loading, handoff exchange
- Workspace-scoped data layer pattern
- Product-specific pages and API routes

**This scaffold does NOT own:**
- User identity or workspace membership (canopy-platform)
- Product entitlements (canopy-platform)
- Other products' domain data

**Rules for all products built from this scaffold:**
- Never re-implement auth — consume it from the handoff and `lib/server-auth.ts`
- All data queries must filter by `workspace_id`
- Use `@canopy/ui` for all UI — do not introduce new component libraries
- Run `npx tsc --noEmit` before considering any change done
