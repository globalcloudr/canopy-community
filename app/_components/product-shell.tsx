"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AppShellContent,
  AppShellFrame,
  AppShellSidebar,
  AppSidebarPanel,
  AppSidebarPanelBody,
  AppSidebarSection,
  AppWorkspaceSwitcher,
  BodyText,
  CanopyHeader,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  sidebarNavItemClass,
  cn,
} from "@globalcloudr/canopy-ui";
import { supabase } from "@/lib/supabase-client";
import { buildWorkspaceHref } from "@/lib/workspace-href";
import { readStoredWorkspaceId, writeStoredWorkspaceId } from "@/lib/workspace-client";

/**
 * ProductShell — the root layout component for all product pages.
 *
 * Handles:
 *   - Portal launch handoff exchange (?launch= param → /api/auth/exchange-handoff)
 *   - Session loading from /api/app-session
 *   - Super admin workspace redirect (adds ?workspace= if missing)
 *   - Top bar with workspace switcher and product launcher
 *   - Left sidebar with configurable nav items
 *   - Portal return and cross-product switching via Portal POST handlers
 *
 * Usage:
 *   Wrap every page in <ProductShell activeNav="home" ...> ... </ProductShell>
 *   Nav items are defined inside this shell — just pass activeNav as a string.
 *
 * Product identity and workspace session behavior for Canopy Community.
 */

// ─── Product identity ─────────────────────────────────────────────────────────
const PRODUCT_NAME = "Canopy Community";
// ─────────────────────────────────────────────────────────────────────────────

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://app.usecanopy.school";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgOption = { id: string; name: string; slug: string };
type LauncherProductKey = "photovault" | "stories_canopy" | "reach_canopy" | "community_canopy";

type AppSessionPayload = {
  user: { id: string; email: string; displayName: string };
  isPlatformOperator: boolean;
  workspaces: OrgOption[];
  activeWorkspace: OrgOption | null;
};

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
};

// ─── Nav items ────────────────────────────────────────────────────────────────

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function CampaignsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m6 9 6 4 6-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AudienceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="8" r="4" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 4.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function TemplateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M5 3h10l4 4v14H5z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}
function ComposeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 3.5l2.1 1.2 2.4-.2 1.2 2.1 2 1.3-.2 2.4L20.5 12l-1.2 2.1.2 2.4-2.1 1.2-1.3 2-2.4-.2L12 20.5l-2.1 1.2-2.4-.2-1.2-2.1-2-1.3.2-2.4L3.5 12l1.2-2.1-.2-2.4 2.1-1.2 1.3-2 2.4.2Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}
function HelpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/",          label: "Dashboard",    icon: DashboardIcon },
  { key: "campaigns", href: "/campaigns", label: "Campaigns",    icon: CampaignsIcon },
  { key: "compose",   href: "/compose",   label: "New campaign", icon: ComposeIcon   },
  { key: "audiences", href: "/audiences", label: "Lists",        icon: AudienceIcon  },
  { key: "templates", href: "/templates", label: "Templates",    icon: TemplateIcon  },
  { key: "settings",  href: "/settings",  label: "Settings",     icon: SettingsIcon  },
  { key: "help",      href: "/help",      label: "Help",         icon: HelpIcon      },
];

type ProductShellProps = {
  /** Nav key matching the current page — highlights that item in the sidebar */
  activeNav: string;
  /** Page children — rendered in the content area */
  children: ReactNode;
};

type ProductShellContextValue = {
  userEmail: string;
  userName: string;
  isPlatformOperator: boolean;
  workspaces: OrgOption[];
  activeWorkspace: OrgOption | null;
  loadingSession: boolean;
};

const ProductShellContext = createContext<ProductShellContextValue | null>(null);
const PRODUCT_SHELL_FALLBACK_CONTEXT: ProductShellContextValue = {
  userEmail: "",
  userName: "",
  isPlatformOperator: false,
  workspaces: [],
  activeWorkspace: null,
  loadingSession: true,
};

export function useProductShell() {
  return useContext(ProductShellContext) ?? PRODUCT_SHELL_FALLBACK_CONTEXT;
}

// ─── Nav helpers ──────────────────────────────────────────────────────────────

function navClass(active: boolean) {
  return sidebarNavItemClass(active);
}

// ─── Session helpers ──────────────────────────────────────────────────────────

async function waitForSessionTokens() {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token && data.session.refresh_token) {
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  return new Promise<{ accessToken: string; refreshToken: string } | null>((resolve) => {
    const timeout = window.setTimeout(() => {
      subscription.unsubscribe();
      resolve(null);
    }, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token && session.refresh_token) {
        window.clearTimeout(timeout);
        subscription.unsubscribe();
        resolve({ accessToken: session.access_token, refreshToken: session.refresh_token });
      }
    });
  });
}

// ─── Shell ────────────────────────────────────────────────────────────────────

// Module-level guard against re-exchanging a single-use handoff code.
// If the session-load effect fires twice in quick succession (StrictMode
// double-invocation in dev, or searchParams reference churn in prod) we'd
// otherwise consume the code on run 1 then fail on run 2 and bounce the
// user back to the Portal. This keeps the second exchange short-circuited
// so the first run's setSession is what wins.
const exchangedLaunchCodes = new Set<string>();

export function ProductShell({ activeNav, children }: ProductShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isPlatformOperator, setIsPlatformOperator] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [launcherProductKeys, setLauncherProductKeys] = useState<LauncherProductKey[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [launchingProductKey, setLaunchingProductKey] = useState<LauncherProductKey | null>(null);
  const [returningToPortal, setReturningToPortal] = useState(false);

  const activeOrg = useMemo(
    () => orgs.find((o) => o.id === activeOrgId) ?? null,
    [orgs, activeOrgId]
  );

  const initials = useMemo(() => {
    if (userName.trim()) {
      return userName.split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
    }
    return (userEmail[0] ?? "U").toUpperCase();
  }, [userName, userEmail]);

  const displayName = userName.trim() || userEmail || "Canopy User";

  const orgInitials = activeOrg
    ? activeOrg.name.split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase()
    : "W";

  const portalBase = PORTAL_URL.replace(/\/$/, "");
  const portalHomeHref = activeOrg?.slug
    ? `${portalBase}/?workspace=${encodeURIComponent(activeOrg.slug)}`
    : portalBase;

  // ── Load launcher products when workspace changes ──────────────────────────

  useEffect(() => {
    if (!activeOrgId) {
      setLauncherProductKeys([]);
      return;
    }

    const controller = new AbortController();

    async function loadLauncherProducts() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) { setLauncherProductKeys([]); return; }

        const response = await fetch(
          `/api/launcher-products?workspaceId=${encodeURIComponent(activeOrgId!)}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal }
        );

        if (!response.ok) { setLauncherProductKeys([]); return; }

        const payload = (await response.json()) as { products?: LauncherProductKey[] };
        setLauncherProductKeys(
          (payload.products ?? []).filter((v): v is LauncherProductKey =>
            v === "photovault" || v === "stories_canopy" || v === "reach_canopy" || v === "community_canopy"
          )
        );
      } catch {
        if (!controller.signal.aborted) setLauncherProductKeys([]);
      }
    }

    void loadLauncherProducts();
    return () => controller.abort();
  }, [activeOrgId]);

  // ── Load session (and handle handoff exchange) ─────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingSession(true);
      try {
        // 1. Exchange Portal launch code if present
        const launchCode = searchParams.get("launch")?.trim();
        if (launchCode) {
          // Skip the exchange if we've already handled this code in a prior
          // effect run. The first run's setSession already wrote tokens to
          // storage, so we can fall through to the session check below.
          if (exchangedLaunchCodes.has(launchCode)) {
            // Clean up the launch param from the URL in case replaceState from
            // the first run raced with this second run's initial read.
            if (typeof window !== "undefined" && new URL(window.location.href).searchParams.has("launch")) {
              const url = new URL(window.location.href);
              url.searchParams.delete("launch");
              window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
            }
          } else {
            exchangedLaunchCodes.add(launchCode);
            const exchangeResponse = await fetch("/api/auth/exchange-handoff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: launchCode }),
            });

            if (!exchangeResponse.ok) {
              window.location.assign(PORTAL_URL);
              return;
            }

            const exchangePayload = (await exchangeResponse.json()) as {
              accessToken?: string;
              refreshToken?: string;
              workspaceSlug?: string | null;
            };

            if (!exchangePayload.accessToken || !exchangePayload.refreshToken) {
              window.location.assign(PORTAL_URL);
              return;
            }

            await supabase.auth.setSession({
              access_token: exchangePayload.accessToken,
              refresh_token: exchangePayload.refreshToken,
            });

            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.delete("launch");
              if (exchangePayload.workspaceSlug) {
                url.searchParams.set("workspace", exchangePayload.workspaceSlug);
              }
              window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
            }
          }
        }

        // 2. Verify there is a valid session
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          window.location.assign(PORTAL_URL);
          return;
        }

        // 3. Load app session from server
        const requestedSlug = searchParams.get("workspace")?.trim() || "";
        const sessionResponse = await fetch(
          `/api/app-session${requestedSlug ? `?workspace=${encodeURIComponent(requestedSlug)}` : ""}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );

        if (!sessionResponse.ok) {
          window.location.assign(PORTAL_URL);
          return;
        }

        const appSession = (await sessionResponse.json()) as AppSessionPayload;
        if (cancelled) { setLoadingSession(false); return; }

        // 4. Platform operators must always have ?workspace= in the URL so
        //    server-side data queries are correctly scoped from the first render.
        if (appSession.isPlatformOperator && !requestedSlug && appSession.activeWorkspace?.slug) {
          const url = new URL(window.location.href);
          url.searchParams.set("workspace", appSession.activeWorkspace.slug);
          window.location.replace(url.toString());
          return;
        }

        setUserEmail(appSession.user.email);
        setUserName(appSession.user.displayName);
        setIsPlatformOperator(appSession.isPlatformOperator);
        setOrgs(appSession.workspaces);
        setActiveOrgId(appSession.activeWorkspace?.id ?? null);
        writeStoredWorkspaceId(appSession.activeWorkspace?.id ?? null);
      } catch {
        // Session not available — stay on page, shell shows loading state
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [searchParams]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut({ scope: "local" });
      window.location.assign(PORTAL_URL);
    } finally {
      setSigningOut(false);
    }
  }

  async function submitPortalForm(action: string, extraFields?: Record<string, string>) {
    const tokens = await waitForSessionTokens();
    if (!tokens) { window.location.assign(PORTAL_URL); return; }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    form.style.display = "none";

    const fields = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      workspaceSlug: activeOrg?.slug ?? "",
      ...extraFields,
    };

    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  async function launchProduct(productKey: Exclude<LauncherProductKey, never>) {
    if (launchingProductKey) return;
    setLaunchingProductKey(productKey);
    try {
      await submitPortalForm(`${portalBase}/auth/product-launch`, { productKey });
    } finally {
      setLaunchingProductKey(null);
    }
  }

  async function returnToPortal() {
    if (returningToPortal) return;
    setReturningToPortal(true);
    try {
      await submitPortalForm(`${portalBase}/auth/portal-return`);
    } finally {
      setReturningToPortal(false);
    }
  }

  // ── Switcher items ────────────────────────────────────────────────────────

  const launcherItems = [
    { key: "portal", label: "Canopy Portal", portal: true as const },
    { key: "community_canopy", label: "Canopy Community", current: true as const },
    ...(launcherProductKeys.includes("photovault")
      ? [{ key: "photovault", label: "PhotoVault", productKey: "photovault" as const }]
      : []),
    ...(launcherProductKeys.includes("stories_canopy")
      ? [{ key: "stories_canopy", label: "Canopy Stories", productKey: "stories_canopy" as const }]
      : []),
    ...(launcherProductKeys.includes("reach_canopy")
      ? [{ key: "reach_canopy", label: "Canopy Reach", productKey: "reach_canopy" as const }]
      : []),
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ProductShellContext.Provider
      value={{
        userEmail,
        userName,
        isPlatformOperator,
        workspaces: orgs,
        activeWorkspace: activeOrg,
        loadingSession,
      }}
    >
      <main className="min-h-screen bg-[var(--app-shell-bg)] md:h-screen md:overflow-hidden">

        {/* Top bar */}
        <CanopyHeader
          brandHref={portalHomeHref}
          onBrandSelect={() => void returnToPortal()}
          workspaceLabel={activeOrg?.name ?? (loadingSession ? "Loading..." : "Select workspace")}
          workspaceContextLabel="School"
          workspaceLinks={
            isPlatformOperator
              ? orgs.map((org) => ({
                  id: org.id,
                  label: org.name,
                  href: `${pathname}?workspace=${encodeURIComponent(org.slug)}`,
                  active: org.id === activeOrgId,
                }))
              : []
          }
          isPlatformOperator={isPlatformOperator}
          platformOverviewHref={PORTAL_URL}
          onPlatformOverviewSelect={() => void returnToPortal()}
          userInitials={loadingSession ? "…" : initials}
          displayName={displayName}
          email={userName ? userEmail : null}
          roleLabel={isPlatformOperator ? "operator" : null}
          accountMenuItems={[
            { label: "Portal overview", onSelect: () => void returnToPortal() },
          ]}
          onSignOut={() => void signOut()}
          signOutLabel={signingOut ? "Signing out…" : "Sign out"}
        />

        {/* Main layout */}
        <AppShellFrame>
          <AppShellSidebar>
            <div className="flex h-full flex-col">

            {/* Workspace lockup */}
            <AppWorkspaceSwitcher
              leading={
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-soft)] bg-[var(--accent)] text-[1.05rem] font-semibold tracking-[-0.02em] text-white shadow-[var(--shadow-sm)]">
                  {loadingSession ? "…" : orgInitials}
                </div>
              }
              title={activeOrg?.name ?? (loadingSession ? "Loading…" : "No workspace")}
              subtitle={PRODUCT_NAME}
              menuLabel={activeOrg?.name ?? "Workspace"}
            >
              <DropdownMenuGroup>
                {launcherItems.map((item) =>
                  "portal" in item ? (
                    <DropdownMenuItem
                      key={item.key}
                      onSelect={(e) => { e.preventDefault(); void returnToPortal(); }}
                    >
                      {item.label}
                      {returningToPortal && (
                        <span className="ml-auto text-[11px] text-[var(--text-muted)]">opening…</span>
                      )}
                    </DropdownMenuItem>
                  ) : "current" in item ? (
                    <DropdownMenuItem key={item.key} disabled>
                      {item.label}
                      <span className="ml-auto text-[11px] text-[var(--text-muted)]">current</span>
                    </DropdownMenuItem>
                  ) : "productKey" in item ? (
                    <DropdownMenuItem
                      key={item.key}
                      onSelect={(e) => { e.preventDefault(); void launchProduct(item.productKey!); }}
                    >
                      {item.label}
                      {launchingProductKey === item.productKey && (
                        <span className="ml-auto text-[11px] text-[var(--text-muted)]">opening…</span>
                      )}
                    </DropdownMenuItem>
                  ) : null
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); void returnToPortal(); }}
              >
                Back to portal home
                {returningToPortal && (
                  <span className="ml-auto text-[11px] text-[var(--text-muted)]">opening…</span>
                )}
              </DropdownMenuItem>
            </AppWorkspaceSwitcher>

            {/* Nav */}
            <AppSidebarPanel>
              <AppSidebarPanelBody>
                <AppSidebarSection label="Navigation">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.key}
                        href={
                          isPlatformOperator
                            ? buildWorkspaceHref(item.href, activeOrg?.slug)
                            : item.href
                        }
                        className={navClass(activeNav === item.key)}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </AppSidebarSection>
              </AppSidebarPanelBody>
            </AppSidebarPanel>
            </div>
          </AppShellSidebar>

          <AppShellContent className="bg-white" containerClassName="px-6 py-8 sm:px-8 lg:px-10">
            {loadingSession ? (
              <div className="py-12 text-center">
                <BodyText muted>Loading workspace…</BodyText>
              </div>
            ) : (
              children
            )}
          </AppShellContent>
        </AppShellFrame>
      </main>
    </ProductShellContext.Provider>
  );
}
